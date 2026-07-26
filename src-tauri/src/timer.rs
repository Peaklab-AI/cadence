use crate::commands;
use crate::lock_ext::LockOrRecover;
use crate::prompt;
use crate::state::{AppState, Status};
use crate::tray;
use chrono::{Duration as ChronoDuration, Utc};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

/// Grace period for the "still working?" prompt before it auto-pauses.
pub const PROMPT_TIMEOUT_SECS: i64 = 120;

/// How often (in ticks) to nudge the tray label's elapsed-time display
/// while tracking. Full-menu rebuilds every second would be wasteful for a
/// value that's cosmetic (the main window computes its own live display).
const TRAY_REFRESH_EVERY_SECS: u64 = 60;

/// A plain OS thread, not a tokio interval — this is the only thing in the
/// app guaranteed to keep running for the app's whole lifetime regardless
/// of which windows are open, which is what lets the tray icon and the
/// confirmation prompt keep working while the main window is hidden.
pub fn start(app: AppHandle) {
    thread::spawn(move || {
        let mut tick_count: u64 = 0;
        loop {
            thread::sleep(Duration::from_secs(1));
            tick_count += 1;
            tick(&app, tick_count);
        }
    });
}

/// How often the tray spinner advances while tracking. A separate thread
/// from `start` above: the business-logic tick only needs to run once a
/// second, and folding a faster cadence into it would mean running
/// everything else several times more often than it needs to. 16 frames at
/// 90ms is one full rotation every ~1.4s — matched to the frame count in
/// `tray::ICON_ACTIVE_FRAMES` so the spin reads as smooth, not choppy.
const ANIMATION_TICK: Duration = Duration::from_millis(90);

/// Spins the tray icon while tracking is active. `tray::advance_frame` is a
/// no-op when not tracking, so this can just tick forever without needing
/// to know here whether anything is actually running.
pub fn start_animation(app: AppHandle) {
    thread::spawn(move || {
        let mut frame: usize = 0;
        loop {
            thread::sleep(ANIMATION_TICK);
            frame = frame.wrapping_add(1);
            tray::advance_frame(&app, frame);
        }
    });
}

fn tick(app: &AppHandle, tick_count: u64) {
    let state = app.state::<AppState>();
    let mut should_open_prompt = false;
    let mut should_auto_pause = false;
    let mut should_refresh_tray = false;

    {
        let mut tracking = state.tracking.lock_or_recover();
        match tracking.status {
            Status::Tracking => {
                tracking.active_seconds_since_last_prompt += 1;
                if tracking.active_seconds_since_last_prompt >= tracking.active_interval.threshold_seconds() {
                    tracking.status = Status::PromptPending;
                    tracking.prompt_deadline =
                        Some(Utc::now() + ChronoDuration::seconds(PROMPT_TIMEOUT_SECS));
                    should_open_prompt = true;
                } else if tick_count % TRAY_REFRESH_EVERY_SECS == 0 {
                    should_refresh_tray = true;
                }
            }
            Status::PromptPending => {
                if let Some(deadline) = tracking.prompt_deadline {
                    if Utc::now() >= deadline {
                        should_auto_pause = true;
                    }
                }
            }
            Status::Idle | Status::Paused => {}
        }
    }

    if should_open_prompt {
        prompt::open_prompt_window(app);
    }
    if should_auto_pause {
        let _ = commands::respond_to_prompt(app.clone(), state, false);
    } else if should_refresh_tray {
        tray::refresh(app, &state);
    }
}
