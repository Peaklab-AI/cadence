use crate::models::{AppData, Interval};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Status {
    Idle,
    Tracking,
    Paused,
    PromptPending,
}

#[derive(Debug, Clone)]
pub struct TrackingState {
    pub status: Status,
    pub active_client_id: Option<String>,
    pub active_project_id: Option<String>,
    pub active_entry_id: Option<String>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    /// Cumulative active (non-paused) tracking seconds since the last
    /// confirmation prompt was answered. Reset on "yes" and on start.
    pub active_seconds_since_last_prompt: i64,
    /// Snapshot of the active project's interval, copied in at
    /// `start_tracking` (and refreshed on `update_project_interval`) so the
    /// timer thread doesn't need to look up the project on every tick.
    pub active_interval: Interval,
    /// When set (status == PromptPending), the timer auto-pauses if no
    /// response arrives by this instant.
    pub prompt_deadline: Option<chrono::DateTime<chrono::Utc>>,
}

impl Default for TrackingState {
    fn default() -> Self {
        TrackingState {
            status: Status::Idle,
            active_client_id: None,
            active_project_id: None,
            active_entry_id: None,
            started_at: None,
            active_seconds_since_last_prompt: 0,
            active_interval: Interval::Hourly,
            prompt_deadline: None,
        }
    }
}

/// Rust-owned source of truth for both persisted data and live tracking
/// status, so the tray icon and background timer keep working even when
/// the main window is closed/hidden.
pub struct AppState {
    pub data: Mutex<AppData>,
    pub tracking: Mutex<TrackingState>,
    /// The directory `cadence-data.json` is currently written to, resolved
    /// once at startup and updated only by `set_data_directory`. Every save
    /// for the rest of the process uses this cached value rather than
    /// re-resolving the pointer config on every call — otherwise a custom
    /// folder that goes briefly unreachable (unmounted drive, dropped sync
    /// folder) would cause saves to silently redirect to the default
    /// location and then flip back once the folder returns, orphaning
    /// whatever was written during the gap.
    pub data_dir: Mutex<PathBuf>,
}

impl AppState {
    pub fn new(data: AppData, data_dir: PathBuf) -> Self {
        AppState {
            data: Mutex::new(data),
            tracking: Mutex::new(TrackingState::default()),
            data_dir: Mutex::new(data_dir),
        }
    }
}
