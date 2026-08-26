use crate::lock_ext::LockOrRecover;
use crate::models::AppData;
use crate::state::AppState;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub const DATA_FILE_NAME: &str = "cadence-data.json";

/// Writes to a temp file then renames over the target so a crash mid-write
/// can never leave a truncated/corrupt file on disk. Shared by the data file
/// and the storage-location pointer config in `config.rs`.
pub fn atomic_write(path: &std::path::Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, contents).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn default_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

/// Resolves the data directory from the persisted pointer config, falling
/// back to the default directory if unset or if the configured folder isn't
/// currently reachable (unmounted drive, removed sync folder) — the app
/// must always be able to start. Called once at startup to seed
/// `AppState::data_dir`; after that, the cached value there is the single
/// source of truth for where data is written (see the field's doc comment
/// for why re-resolving on every save would be unsafe).
pub fn resolve_effective_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let default_dir = default_data_dir(app)?;
    match crate::config::load(app).data_dir {
        Some(dir) if PathBuf::from(&dir).is_dir() => Ok(PathBuf::from(dir)),
        _ => Ok(default_dir),
    }
}

/// True when the persisted folder choice doesn't match the directory
/// actually in use this session — i.e. it wasn't reachable at startup and
/// the app fell back to the default location.
pub fn configured_dir_missing(app: &AppHandle, active_dir: &Path) -> bool {
    match crate::config::load(app).data_dir {
        Some(dir) => Path::new(&dir) != active_dir,
        None => false,
    }
}

pub fn load_from_dir(dir: &Path) -> Result<AppData, String> {
    let path = dir.join(DATA_FILE_NAME);
    if !path.exists() {
        return Ok(AppData::default());
    }
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

/// Persists an already-serialized snapshot. Callers serialize while still
/// holding `state.data`'s guard (cheap, in-memory) and must drop that guard
/// before calling this — the write inside can block indefinitely on a bad
/// network/removable data_dir, and must never do so while any other command
/// or the background timer thread is waiting on `state.data`. Always writes
/// to `AppState::data_dir`'s current value, never a freshly re-resolved path
/// — see that field's doc comment.
pub fn save(app: &AppHandle, json: &str) -> Result<(), String> {
    let dir = app.state::<AppState>().data_dir.lock_or_recover().clone();
    let path = dir.join(DATA_FILE_NAME);
    atomic_write(&path, json)
}

/// Writes `json` to `new_path` and verifies it parses back as `AppData`,
/// rolling back (removing the half-written file) and returning `Err` if
/// either step fails — so the caller's original file/config is never
/// touched on failure. Does not touch anything at the old location; that's
/// a separate, later step once the caller has committed to the switch.
pub fn write_and_verify_data_file(json: &str, new_path: &PathBuf) -> Result<(), String> {
    atomic_write(new_path, json)?;

    if let Err(e) = fs::read_to_string(new_path)
        .map_err(|e| e.to_string())
        .and_then(|c| serde_json::from_str::<AppData>(&c).map_err(|e| e.to_string()))
    {
        let _ = fs::remove_file(new_path);
        return Err(format!("could not verify data in new location: {e}"));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Interval, Project, Settings};
    use std::fs as stdfs;

    #[test]
    fn round_trip_serializes_and_parses() {
        let data = AppData {
            version: 1,
            clients: Vec::new(),
            projects: vec![Project {
                id: "p1".into(),
                client_id: "c1".into(),
                name: "Website".into(),
                created_at: "2026-01-01T00:00:00Z".into(),
                interval: Interval::Daily,
                rate: None,
                currency: None,
            }],
            time_entries: Vec::new(),
            billed_periods: Vec::new(),
            settings: Settings::default(),
        };
        let json = serde_json::to_string_pretty(&data).unwrap();
        let parsed: AppData = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.version, 1);
        assert_eq!(parsed.projects[0].interval, Interval::Daily);
    }

    #[test]
    fn atomic_write_leaves_no_tmp_file_on_success() {
        let dir = std::env::temp_dir().join(format!("cadence-test-{}", uuid::Uuid::new_v4()));
        let path = dir.join(DATA_FILE_NAME);
        let tmp_path = path.with_extension("json.tmp");
        let data = AppData::default();
        let json = serde_json::to_string_pretty(&data).unwrap();
        atomic_write(&path, &json).unwrap();
        assert!(path.exists());
        assert!(!tmp_path.exists());
        stdfs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn write_and_verify_writes_valid_data() {
        let dir = std::env::temp_dir().join(format!("cadence-test-{}", uuid::Uuid::new_v4()));
        stdfs::create_dir_all(&dir).unwrap();
        let new_path = dir.join(DATA_FILE_NAME);
        let json = serde_json::to_string_pretty(&AppData::default()).unwrap();

        write_and_verify_data_file(&json, &new_path).unwrap();

        assert!(new_path.exists());
        let contents = stdfs::read_to_string(&new_path).unwrap();
        let parsed: AppData = serde_json::from_str(&contents).unwrap();
        assert_eq!(parsed.version, 1);
        stdfs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn write_and_verify_rolls_back_on_invalid_json() {
        let dir = std::env::temp_dir().join(format!("cadence-test-{}", uuid::Uuid::new_v4()));
        stdfs::create_dir_all(&dir).unwrap();
        let new_path = dir.join(DATA_FILE_NAME);

        let result = write_and_verify_data_file("not valid json", &new_path);

        assert!(result.is_err());
        assert!(!new_path.exists(), "half-written file should be rolled back on verify failure");
        stdfs::remove_dir_all(&dir).unwrap();
    }
}
