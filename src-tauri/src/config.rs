use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const CONFIG_FILE_NAME: &str = "cadence-config.json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageConfig {
    /// Absolute path to the user-chosen folder holding cadence-data.json.
    /// `None` (or a missing/corrupt config file) means "use the default
    /// app_data_dir", exactly like the app's original behavior.
    #[serde(default)]
    pub data_dir: Option<String>,
}

/// Always the OS default location, independent of `storage::resolve_data_dir`
/// — this pointer must never itself move, or the app can't find its own
/// data on next launch.
fn config_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join(CONFIG_FILE_NAME))
}

/// Never fails outward — first run (no file) and a corrupt file both fall
/// back to `StorageConfig::default()` (use the default data dir).
pub fn load(app: &AppHandle) -> StorageConfig {
    let Ok(path) = config_file_path(app) else {
        return StorageConfig::default();
    };
    let Ok(contents) = fs::read_to_string(&path) else {
        return StorageConfig::default();
    };
    serde_json::from_str(&contents).unwrap_or_default()
}

pub fn save(app: &AppHandle, config: &StorageConfig) -> Result<(), String> {
    let path = config_file_path(app)?;
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    crate::storage::atomic_write(&path, &json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_serializes_and_parses() {
        let config = StorageConfig {
            data_dir: Some("/tmp/somewhere".into()),
        };
        let json = serde_json::to_string_pretty(&config).unwrap();
        let parsed: StorageConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.data_dir, Some("/tmp/somewhere".into()));
    }

    #[test]
    fn missing_or_corrupt_json_falls_back_to_default() {
        let default_config: StorageConfig = serde_json::from_str("not json").unwrap_or_default();
        assert_eq!(default_config.data_dir, None);

        let empty_object: StorageConfig = serde_json::from_str("{}").unwrap();
        assert_eq!(empty_object.data_dir, None);
    }
}
