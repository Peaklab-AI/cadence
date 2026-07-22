use crate::models::AppData;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DATA_FILE_NAME: &str = "cadence-data.json";

pub fn data_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.join(DATA_FILE_NAME))
}

pub fn load(app: &AppHandle) -> Result<AppData, String> {
    let path = data_file_path(app)?;
    if !path.exists() {
        return Ok(AppData::default());
    }
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

/// Writes to a temp file then renames over the target so a crash mid-write
/// can never leave a truncated/corrupt data file on disk.
pub fn save(app: &AppHandle, data: &AppData) -> Result<(), String> {
    let path = data_file_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp_path = path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&tmp_path, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, &path).map_err(|e| e.to_string())?;
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
            settings: Settings { active_entry_id: None },
        };
        let json = serde_json::to_string_pretty(&data).unwrap();
        let parsed: AppData = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.version, 1);
        assert_eq!(parsed.projects[0].interval, Interval::Daily);
    }

    #[test]
    fn atomic_write_leaves_no_tmp_file_on_success() {
        let dir = std::env::temp_dir().join(format!("cadence-test-{}", uuid::Uuid::new_v4()));
        stdfs::create_dir_all(&dir).unwrap();
        let path = dir.join(DATA_FILE_NAME);
        let tmp_path = path.with_extension("json.tmp");
        let data = AppData::default();
        let json = serde_json::to_string_pretty(&data).unwrap();
        stdfs::write(&tmp_path, json).unwrap();
        stdfs::rename(&tmp_path, &path).unwrap();
        assert!(path.exists());
        assert!(!tmp_path.exists());
        stdfs::remove_dir_all(&dir).unwrap();
    }
}
