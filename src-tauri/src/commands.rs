use crate::lock_ext::LockOrRecover;
use crate::models::{AppData, BilledPeriod, Client, Interval, Project, TimeEntry};
use crate::prompt;
use crate::state::{AppState, Status, TrackingState};
use crate::storage;
use crate::tray;
use chrono::Utc;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSnapshot {
    pub status: Status,
    pub active_client_id: Option<String>,
    pub active_project_id: Option<String>,
    pub started_at: Option<String>,
    pub prompt_deadline: Option<String>,
    pub clients: Vec<Client>,
    pub projects: Vec<Project>,
}

fn build_snapshot(state: &State<AppState>) -> AppSnapshot {
    let tracking = state.tracking.lock_or_recover();
    let data = state.data.lock_or_recover();
    AppSnapshot {
        status: tracking.status,
        active_client_id: tracking.active_client_id.clone(),
        active_project_id: tracking.active_project_id.clone(),
        started_at: tracking.started_at.map(|t| t.to_rfc3339()),
        prompt_deadline: tracking.prompt_deadline.map(|t| t.to_rfc3339()),
        clients: data.clients.clone(),
        projects: projects_by_usage(&data),
    }
}

/// Projects ordered by total tracked time, most-worked-on first, so the
/// picker list surfaces what's actually used instead of creation order.
/// Untouched projects sort to the bottom (oldest-created first, stable).
fn projects_by_usage(data: &AppData) -> Vec<Project> {
    let now = Utc::now();
    let mut totals: HashMap<&str, i64> = HashMap::new();
    for entry in &data.time_entries {
        let seconds = match &entry.ended_at {
            Some(_) => entry.duration_seconds,
            // The currently-open entry hasn't had duration_seconds written
            // yet — use its live elapsed time so the ranking reflects
            // whatever is being tracked right now.
            None => chrono::DateTime::parse_from_rfc3339(&entry.started_at)
                .map(|t| (now - t.with_timezone(&Utc)).num_seconds())
                .unwrap_or(0),
        };
        *totals.entry(entry.project_id.as_str()).or_insert(0) += seconds;
    }

    let mut projects = data.projects.clone();
    projects.sort_by(|a, b| {
        let a_total = totals.get(a.id.as_str()).unwrap_or(&0);
        let b_total = totals.get(b.id.as_str()).unwrap_or(&0);
        b_total.cmp(a_total).then_with(|| a.created_at.cmp(&b.created_at))
    });
    projects
}

/// Broadcasts the latest snapshot to every window and refreshes the tray so
/// tray-triggered and UI-triggered actions never fall out of sync.
fn emit_state_changed(app: &AppHandle, state: &State<AppState>) {
    let snapshot = build_snapshot(state);
    let _ = app.emit("state-changed", &snapshot);
    tray::refresh(app, state);
}

/// Runs `mutate` against the live data under `state.data`'s lock, producing
/// `T`; serializes the (now-mutated) data to JSON while still holding that
/// lock (cheap, in-memory, no I/O); then, still holding the lock, takes
/// `state.save_order` before dropping `state.data`'s guard; only then calls
/// `storage::save` (the slow part). This way a hung disk write blocks at
/// most this one command — never `get_state`, the background timer thread,
/// or any other command that only needs `state.data` — and `save_order`
/// keeps concurrent saves landing on disk in the same order their
/// mutations happened (see that field's doc comment in state.rs).
fn save_data<T>(
    app: &AppHandle,
    state: &State<AppState>,
    mutate: impl FnOnce(&mut AppData) -> Result<T, String>,
) -> Result<T, String> {
    let (json, result, _write_guard) = {
        let mut data = state.data.lock_or_recover();
        let result = mutate(&mut data)?;
        let json = serde_json::to_string_pretty(&*data).map_err(|e| e.to_string())?;
        let write_guard = state.save_order.lock_or_recover();
        (json, result, write_guard)
    };
    storage::save(app, &json)?;
    Ok(result)
}

/// Ends whichever time entry is currently open (if any) and clears the
/// active-entry pointer. Shared by pause and by "switch project" (which
/// pauses the old entry before starting the new one).
fn close_active_entry(app: &AppHandle, state: &State<AppState>, note: Option<String>) -> Result<(), String> {
    let now = Utc::now();
    save_data(app, state, |data| {
        if let Some(entry) = data.time_entries.iter_mut().find(|e| e.ended_at.is_none()) {
            let started = chrono::DateTime::parse_from_rfc3339(&entry.started_at)
                .map_err(|e| e.to_string())?
                .with_timezone(&Utc);
            entry.ended_at = Some(now.to_rfc3339());
            entry.duration_seconds = (now - started).num_seconds();
            entry.note = note;
        }
        data.settings.active_entry_id = None;
        Ok(())
    })
}

fn pause_internal(app: &AppHandle, state: &State<AppState>, note: Option<String>) -> Result<(), String> {
    close_active_entry(app, state, note)?;
    let mut tracking = state.tracking.lock_or_recover();
    tracking.status = Status::Paused;
    tracking.active_entry_id = None;
    tracking.started_at = None;
    Ok(())
}

#[tauri::command]
pub fn get_state(state: State<AppState>) -> AppSnapshot {
    build_snapshot(&state)
}

/// Raw time entries for the history view. Range filtering and per-project
/// aggregation (sum of seconds vs. distinct days/weeks touched) happen in
/// the frontend — this is read-only reporting over already-persisted data,
/// not live-tracking state, so it doesn't need to live in Rust.
#[tauri::command]
pub fn list_time_entries(state: State<AppState>) -> Vec<crate::models::TimeEntry> {
    state.data.lock_or_recover().time_entries.clone()
}

/// Raw billed-period records for the History panel. Same "read-only
/// reporting, no snapshot participation" treatment as `list_time_entries` —
/// nothing outside the history views consumes this, so it doesn't belong in
/// `AppSnapshot`/`emit_state_changed`.
#[tauri::command]
pub fn list_billed_periods(state: State<AppState>) -> Vec<BilledPeriod> {
    state.data.lock_or_recover().billed_periods.clone()
}

/// Marks a (project, week) as invoiced, with an optional invoice reference.
/// Upsert — marking an already-billed period updates its `invoice_id`
/// in place (so the invoice ID can be added or corrected later) rather than
/// creating a duplicate or leaving it unchanged; `billed_at` is only set
/// on first creation.
#[tauri::command]
pub fn mark_period_billed(
    app: AppHandle,
    state: State<AppState>,
    project_id: String,
    period_start: String,
    invoice_id: Option<String>,
) -> Result<BilledPeriod, String> {
    save_data(&app, &state, |data| {
        if let Some(existing) = data
            .billed_periods
            .iter_mut()
            .find(|b| b.project_id == project_id && b.period_start == period_start)
        {
            existing.invoice_id = invoice_id;
            return Ok(existing.clone());
        }
        let record = BilledPeriod {
            id: Uuid::new_v4().to_string(),
            project_id,
            period_start,
            billed_at: Utc::now().to_rfc3339(),
            invoice_id,
        };
        data.billed_periods.push(record.clone());
        Ok(record)
    })
}

/// Reverses `mark_period_billed`. Idempotent — unmarking something that
/// isn't billed is a no-op, not an error.
#[tauri::command]
pub fn unmark_period_billed(
    app: AppHandle,
    state: State<AppState>,
    project_id: String,
    period_start: String,
) -> Result<(), String> {
    save_data(&app, &state, |data| {
        data.billed_periods.retain(|b| !(b.project_id == project_id && b.period_start == period_start));
        Ok(())
    })
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if r#"/\:*?"<>|"#.contains(c) { '-' } else { c })
        .collect()
}

/// Writes arbitrary text (a generated CSV export, currently) to the user's
/// Downloads folder and returns the saved path. Plain `std::fs`, same as
/// `storage.rs`'s own writes — no dialog/fs plugin needed for a one-shot
/// text file, and `download_dir()` is already part of core Tauri's path
/// resolver (the same family as `app_data_dir`, used in storage.rs).
#[tauri::command]
pub fn save_text_file(app: AppHandle, filename: String, contents: String) -> Result<String, String> {
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(sanitize_filename(&filename));
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageSettings {
    pub data_dir: String,
    pub is_default: bool,
    pub default_dir: String,
    pub configured_dir_missing: bool,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderCheck {
    pub writable: bool,
    pub has_existing_data: bool,
}

fn build_storage_settings(app: &AppHandle, state: &AppState) -> Result<StorageSettings, String> {
    let data_dir = state.data_dir.lock_or_recover().clone();
    let default_dir = storage::default_data_dir(app)?;
    Ok(StorageSettings {
        is_default: data_dir == default_dir,
        configured_dir_missing: storage::configured_dir_missing(app, &data_dir),
        data_dir: data_dir.to_string_lossy().to_string(),
        default_dir: default_dir.to_string_lossy().to_string(),
        warning: None,
    })
}

#[tauri::command]
pub fn get_storage_settings(app: AppHandle, state: State<AppState>) -> Result<StorageSettings, String> {
    build_storage_settings(&app, &state)
}

/// Called right after the native folder picker returns, before any writes
/// happen, so the frontend can show a confirmation step for a destructive
/// overwrite instead of `set_data_directory` surprising the user.
#[tauri::command]
pub fn check_data_folder(dir: String) -> Result<FolderCheck, String> {
    let path = std::path::PathBuf::from(&dir);
    if !path.is_dir() {
        return Err("that folder doesn't exist".to_string());
    }
    let probe = path.join(".cadence-write-test");
    let writable = std::fs::write(&probe, b"").is_ok();
    if writable {
        let _ = std::fs::remove_file(&probe);
    }
    Ok(FolderCheck {
        writable,
        has_existing_data: path.join("cadence-data.json").exists(),
    })
}

/// Migrates the data file to `dir` and points the app at it going forward.
/// Sequenced so a failure at any step never touches the original file:
/// write the new file, verify it parses, only then flip the config
/// pointer, only then best-effort delete the old file.
#[tauri::command]
pub fn set_data_directory(
    app: AppHandle,
    state: State<AppState>,
    dir: String,
    overwrite: bool,
) -> Result<StorageSettings, String> {
    let new_dir = std::path::PathBuf::from(&dir);
    if !new_dir.is_dir() {
        return Err("that folder doesn't exist".to_string());
    }
    let new_path = new_dir.join(storage::DATA_FILE_NAME);

    // Snapshot the in-memory data and release `state.data` immediately —
    // the disk I/O below (write, verify, config save) can be slow (e.g. a
    // network drive) and must not block the background timer thread or any
    // other command that needs this lock for the whole operation.
    let (json, old_dir) = {
        let data = state.data.lock_or_recover();
        let json = serde_json::to_string_pretty(&*data).map_err(|e| e.to_string())?;
        (json, state.data_dir.lock_or_recover().clone())
    };
    let old_path = old_dir.join(storage::DATA_FILE_NAME);

    if new_path == old_path {
        return build_storage_settings(&app, &state);
    }
    if new_path.exists() && !overwrite {
        return Err("A Cadence data file already exists in that folder.".to_string());
    }

    storage::write_and_verify_data_file(&json, &new_path)?;

    let cfg = crate::config::StorageConfig {
        data_dir: Some(dir.clone()),
    };
    if let Err(e) = crate::config::save(&app, &cfg) {
        let _ = std::fs::remove_file(&new_path);
        return Err(e);
    }

    *state.data_dir.lock_or_recover() = new_dir;

    let warning = if old_path.exists() {
        std::fs::remove_file(&old_path)
            .err()
            .map(|e| format!("switched, but couldn't remove the old file: {e}"))
    } else {
        None
    };

    let mut settings = build_storage_settings(&app, &state)?;
    settings.warning = warning;
    Ok(settings)
}

#[tauri::command]
pub fn add_client(app: AppHandle, state: State<AppState>, name: String) -> Result<Client, String> {
    let client = Client {
        id: Uuid::new_v4().to_string(),
        name,
        created_at: Utc::now().to_rfc3339(),
    };
    let to_save = client.clone();
    save_data(&app, &state, move |data| {
        data.clients.push(to_save);
        Ok(())
    })?;
    emit_state_changed(&app, &state);
    Ok(client)
}

#[tauri::command]
pub fn add_project(
    app: AppHandle,
    state: State<AppState>,
    client_id: String,
    name: String,
    interval: Interval,
    rate: Option<f64>,
    currency: Option<String>,
) -> Result<Project, String> {
    let project = Project {
        id: Uuid::new_v4().to_string(),
        client_id,
        name,
        created_at: Utc::now().to_rfc3339(),
        interval,
        rate,
        currency,
    };
    let to_save = project.clone();
    save_data(&app, &state, move |data| {
        data.projects.push(to_save);
        Ok(())
    })?;
    emit_state_changed(&app, &state);
    Ok(project)
}

/// Edits an existing project's name, client, and/or interval — used by the
/// Projects tab's edit dialog. If it's the project currently being tracked,
/// the live tracking state is updated too so the timer thread and tray
/// pick up the new client/cadence on their very next tick.
#[tauri::command]
pub fn update_project(
    app: AppHandle,
    state: State<AppState>,
    project_id: String,
    name: String,
    client_id: String,
    interval: Interval,
    rate: Option<f64>,
    currency: Option<String>,
) -> Result<Project, String> {
    let client_id_for_tracking = client_id.clone();
    let project_id_for_tracking = project_id.clone();
    let updated = save_data(&app, &state, move |data| {
        let project = data
            .projects
            .iter_mut()
            .find(|p| p.id == project_id)
            .ok_or_else(|| "project not found".to_string())?;
        project.name = name;
        project.client_id = client_id;
        project.interval = interval;
        project.rate = rate;
        project.currency = currency;
        Ok(project.clone())
    })?;
    {
        let mut tracking = state.tracking.lock_or_recover();
        if tracking.active_project_id.as_deref() == Some(project_id_for_tracking.as_str()) {
            tracking.active_client_id = Some(client_id_for_tracking);
            tracking.active_interval = interval;
        }
    }
    emit_state_changed(&app, &state);
    Ok(updated)
}

/// Permanently removes a project along with every time entry and billed
/// period recorded against it — a confirmed, destructive action from the
/// Edit project screen. Cascades rather than leaving orphaned records
/// behind (they'd otherwise become invisible dead data: History only ever
/// iterates the live `projects` list, so entries for a deleted project
/// would never surface again anyway). If the project being deleted is the
/// one currently being tracked, live tracking is reset to idle first since
/// its active entry no longer exists.
#[tauri::command]
pub fn delete_project(app: AppHandle, state: State<AppState>, project_id: String) -> Result<(), String> {
    let was_active = {
        let tracking = state.tracking.lock_or_recover();
        tracking.active_project_id.as_deref() == Some(project_id.as_str())
    };
    save_data(&app, &state, move |data| {
        if !data.projects.iter().any(|p| p.id == project_id) {
            return Err("project not found".to_string());
        }
        data.projects.retain(|p| p.id != project_id);
        data.time_entries.retain(|e| e.project_id != project_id);
        data.billed_periods.retain(|b| b.project_id != project_id);
        if was_active {
            data.settings.active_entry_id = None;
        }
        Ok(())
    })?;
    if was_active {
        let mut tracking = state.tracking.lock_or_recover();
        *tracking = TrackingState::default();
    }
    emit_state_changed(&app, &state);
    Ok(())
}

/// Edits a closed time entry — used to fix a wrong duration, a session
/// logged against the wrong project, or (via `add_manual_time_entry`) a
/// session that was never tracked at all. Refuses to touch the currently
/// open entry (no `ended_at` yet) since that one is owned by the live
/// tracking state machine, not this ad-hoc editing path.
#[tauri::command]
pub fn update_time_entry(
    app: AppHandle,
    state: State<AppState>,
    entry_id: String,
    client_id: String,
    project_id: String,
    started_at: String,
    ended_at: String,
    note: Option<String>,
) -> Result<TimeEntry, String> {
    let duration_seconds = entry_duration_seconds(&started_at, &ended_at)?;
    save_data(&app, &state, move |data| {
        let entry = data
            .time_entries
            .iter_mut()
            .find(|e| e.id == entry_id)
            .ok_or_else(|| "time entry not found".to_string())?;
        if entry.ended_at.is_none() {
            return Err("can't edit the entry currently being tracked".to_string());
        }
        entry.client_id = client_id;
        entry.project_id = project_id;
        entry.started_at = started_at;
        entry.ended_at = Some(ended_at);
        entry.duration_seconds = duration_seconds;
        entry.note = note;
        Ok(entry.clone())
    })
}

/// Removes a closed time entry entirely (e.g. it was logged by mistake).
/// Same "not the open entry" guard as `update_time_entry`.
#[tauri::command]
pub fn delete_time_entry(app: AppHandle, state: State<AppState>, entry_id: String) -> Result<(), String> {
    save_data(&app, &state, move |data| {
        let entry = data
            .time_entries
            .iter()
            .find(|e| e.id == entry_id)
            .ok_or_else(|| "time entry not found".to_string())?;
        if entry.ended_at.is_none() {
            return Err("can't delete the entry currently being tracked".to_string());
        }
        data.time_entries.retain(|e| e.id != entry_id);
        Ok(())
    })
}

/// Adds a fully-closed time entry directly, for a session that was worked
/// but never actually tracked (forgot to hit start). Independent of
/// `state.tracking` — it doesn't touch the live session, so unlike
/// `start_tracking` there's no tray/snapshot update needed.
#[tauri::command]
pub fn add_manual_time_entry(
    app: AppHandle,
    state: State<AppState>,
    client_id: String,
    project_id: String,
    started_at: String,
    ended_at: String,
    note: Option<String>,
) -> Result<TimeEntry, String> {
    let duration_seconds = entry_duration_seconds(&started_at, &ended_at)?;
    let entry = TimeEntry {
        id: Uuid::new_v4().to_string(),
        client_id,
        project_id,
        started_at,
        ended_at: Some(ended_at),
        duration_seconds,
        note,
    };
    let to_save = entry.clone();
    save_data(&app, &state, move |data| {
        data.time_entries.push(to_save);
        Ok(())
    })?;
    Ok(entry)
}

/// Shared validation for the two commands above: parses both timestamps and
/// checks the range is well-formed before anything is mutated.
fn entry_duration_seconds(started_at: &str, ended_at: &str) -> Result<i64, String> {
    let started = chrono::DateTime::parse_from_rfc3339(started_at).map_err(|e| e.to_string())?;
    let ended = chrono::DateTime::parse_from_rfc3339(ended_at).map_err(|e| e.to_string())?;
    if ended <= started {
        return Err("end time must be after start time".to_string());
    }
    Ok((ended - started).num_seconds())
}

/// Starts tracking a (client, project) pair. If another entry is already
/// open (e.g. "switch project" without an explicit pause first), it is
/// closed first so there is never more than one open entry at a time.
#[tauri::command]
pub fn start_tracking(
    app: AppHandle,
    state: State<AppState>,
    client_id: String,
    project_id: String,
) -> Result<(), String> {
    close_active_entry(&app, &state, None)?;

    let now = Utc::now();
    let entry_id = Uuid::new_v4().to_string();
    let entry_id_for_tracking = entry_id.clone();
    let client_id_for_tracking = client_id.clone();
    let project_id_for_tracking = project_id.clone();
    let interval = save_data(&app, &state, move |data| {
        let interval = data
            .projects
            .iter()
            .find(|p| p.id == project_id)
            .map(|p| p.interval)
            .ok_or_else(|| "project not found".to_string())?;
        data.time_entries.push(TimeEntry {
            id: entry_id.clone(),
            client_id,
            project_id,
            started_at: now.to_rfc3339(),
            ended_at: None,
            duration_seconds: 0,
            note: None,
        });
        data.settings.active_entry_id = Some(entry_id);
        Ok(interval)
    })?;
    let entry_id = entry_id_for_tracking;
    let client_id = client_id_for_tracking;
    let project_id = project_id_for_tracking;
    {
        let mut tracking = state.tracking.lock_or_recover();
        tracking.status = Status::Tracking;
        tracking.active_client_id = Some(client_id);
        tracking.active_project_id = Some(project_id);
        tracking.active_entry_id = Some(entry_id);
        tracking.started_at = Some(now);
        tracking.active_seconds_since_last_prompt = 0;
        tracking.active_interval = interval;
    }
    // Starting tracking is a clear signal the user is now paying attention,
    // so a future "forgot to track?" nag on dismiss is relevant again.
    tray::reset_leave_off_nag();
    emit_state_changed(&app, &state);
    Ok(())
}

#[tauri::command]
pub fn pause_tracking(app: AppHandle, state: State<AppState>, note: Option<String>) -> Result<(), String> {
    pause_internal(&app, &state, note)?;
    emit_state_changed(&app, &state);
    Ok(())
}

/// Called either by the confirm window ("Yes"/"No") or, on timeout, by
/// Rust's own timer — both paths converge here so there is exactly one
/// auto-pause code path regardless of what triggered it.
#[tauri::command]
pub fn respond_to_prompt(app: AppHandle, state: State<AppState>, still_working: bool) -> Result<(), String> {
    if still_working {
        let mut tracking = state.tracking.lock_or_recover();
        tracking.status = Status::Tracking;
        tracking.active_seconds_since_last_prompt = 0;
        tracking.prompt_deadline = None;
    } else {
        pause_internal(&app, &state, None)?;
    }
    prompt::close_prompt_window(&app);
    emit_state_changed(&app, &state);
    Ok(())
}

/// User confirmed the "leave tracking off?" nag — actually hide the window
/// now that the hold-back in `tray::request_hide` has been answered.
#[tauri::command]
pub fn confirm_leave_tracking_off(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

/// User canceled the "leave tracking off?" nag — keep the window open and
/// bring it back to front.
#[tauri::command]
pub fn cancel_leave_tracking_off(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Settings;

    fn project(id: &str, created_at: &str) -> Project {
        Project {
            id: id.to_string(),
            client_id: "c1".to_string(),
            name: id.to_string(),
            created_at: created_at.to_string(),
            interval: Interval::Hourly,
            rate: None,
            currency: None,
        }
    }

    fn entry(project_id: &str, started_at: &str, ended_at: Option<&str>, duration_seconds: i64) -> TimeEntry {
        TimeEntry {
            id: uuid::Uuid::new_v4().to_string(),
            client_id: "c1".to_string(),
            project_id: project_id.to_string(),
            started_at: started_at.to_string(),
            ended_at: ended_at.map(|s| s.to_string()),
            duration_seconds,
            note: None,
        }
    }

    #[test]
    fn entry_duration_seconds_computes_valid_ranges() {
        let seconds = entry_duration_seconds("2026-07-06T09:00:00Z", "2026-07-06T10:00:00Z").unwrap();
        assert_eq!(seconds, 3600);
    }

    #[test]
    fn entry_duration_seconds_rejects_equal_timestamps() {
        let result = entry_duration_seconds("2026-07-06T09:00:00Z", "2026-07-06T09:00:00Z");
        assert!(result.is_err());
    }

    #[test]
    fn entry_duration_seconds_rejects_end_before_start() {
        let result = entry_duration_seconds("2026-07-06T09:00:00Z", "2026-07-06T08:00:00Z");
        assert!(result.is_err());
    }

    #[test]
    fn entry_duration_seconds_rejects_malformed_timestamps() {
        let result = entry_duration_seconds("not-a-timestamp", "2026-07-06T09:00:00Z");
        assert!(result.is_err());
    }

    #[test]
    fn sanitize_filename_replaces_each_illegal_character() {
        assert_eq!(sanitize_filename(r#"a/b\c:d*e?f"g<h>i|j"#), "a-b-c-d-e-f-g-h-i-j");
    }

    #[test]
    fn sanitize_filename_leaves_clean_names_unchanged() {
        assert_eq!(sanitize_filename("Invoice 2026-07.csv"), "Invoice 2026-07.csv");
    }

    #[test]
    fn projects_by_usage_orders_by_total_tracked_seconds_descending() {
        let data = AppData {
            version: 1,
            clients: vec![],
            projects: vec![project("low", "2026-01-01T00:00:00Z"), project("high", "2026-01-02T00:00:00Z")],
            time_entries: vec![
                entry("low", "2026-07-06T09:00:00Z", Some("2026-07-06T09:10:00Z"), 600),
                entry("high", "2026-07-06T09:00:00Z", Some("2026-07-06T10:00:00Z"), 3600),
            ],
            billed_periods: vec![],
            settings: Settings { active_entry_id: None },
        };

        let ordered = projects_by_usage(&data);
        assert_eq!(ordered.iter().map(|p| p.id.as_str()).collect::<Vec<_>>(), vec!["high", "low"]);
    }

    #[test]
    fn projects_by_usage_breaks_ties_by_created_at_ascending() {
        let data = AppData {
            version: 1,
            clients: vec![],
            projects: vec![project("newer", "2026-02-01T00:00:00Z"), project("older", "2026-01-01T00:00:00Z")],
            time_entries: vec![
                entry("newer", "2026-07-06T09:00:00Z", Some("2026-07-06T10:00:00Z"), 3600),
                entry("older", "2026-07-06T09:00:00Z", Some("2026-07-06T10:00:00Z"), 3600),
            ],
            billed_periods: vec![],
            settings: Settings { active_entry_id: None },
        };

        let ordered = projects_by_usage(&data);
        assert_eq!(ordered.iter().map(|p| p.id.as_str()).collect::<Vec<_>>(), vec!["older", "newer"]);
    }

    #[test]
    fn projects_by_usage_counts_live_elapsed_time_for_the_open_entry() {
        // started far enough in the past that live elapsed time reliably
        // dominates the closed "touched" project regardless of test jitter
        let long_ago = (Utc::now() - chrono::Duration::hours(1)).to_rfc3339();
        let data = AppData {
            version: 1,
            clients: vec![],
            projects: vec![project("open", "2026-01-01T00:00:00Z"), project("touched", "2026-01-02T00:00:00Z")],
            time_entries: vec![
                entry("open", &long_ago, None, 0),
                entry("touched", "2026-07-06T09:00:00Z", Some("2026-07-06T09:00:10Z"), 10),
            ],
            billed_periods: vec![],
            settings: Settings { active_entry_id: None },
        };

        let ordered = projects_by_usage(&data);
        assert_eq!(ordered[0].id, "open");
    }

    #[test]
    fn projects_by_usage_sorts_untouched_projects_last() {
        let data = AppData {
            version: 1,
            clients: vec![],
            projects: vec![project("untouched", "2020-01-01T00:00:00Z"), project("touched", "2026-01-02T00:00:00Z")],
            time_entries: vec![entry("touched", "2026-07-06T09:00:00Z", Some("2026-07-06T09:00:10Z"), 10)],
            billed_periods: vec![],
            settings: Settings { active_entry_id: None },
        };

        let ordered = projects_by_usage(&data);
        assert_eq!(ordered.iter().map(|p| p.id.as_str()).collect::<Vec<_>>(), vec!["touched", "untouched"]);
    }
}
