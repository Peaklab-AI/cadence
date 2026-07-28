use crate::commands;
use crate::lock_ext::LockOrRecover;
use crate::prompt;
use crate::state::{AppState, Status, TrackingState};
use crate::tray;
use chrono::{DateTime, Duration as ChronoDuration, Utc};
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

/// What tick() should do as a result of one second passing, decided by
/// `evaluate_tick` in isolation so the transition logic is testable without
/// an `AppHandle`. `tick()` is the thin imperative shell that carries this out.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TickAction {
    None,
    OpenPrompt,
    AutoPause,
    RefreshTray,
}

/// Pure decision of the tracking status transition for one tick. Mutates
/// `tracking` in place exactly as the inline match previously did, and
/// returns what `tick()` should do as a result — the only place this
/// decision is made, so it can be tested with a synthetic `now` instead of
/// `Utc::now()`.
fn evaluate_tick(tracking: &mut TrackingState, now: DateTime<Utc>, tick_count: u64) -> TickAction {
    match tracking.status {
        Status::Tracking => {
            tracking.active_seconds_since_last_prompt += 1;
            if tracking.active_seconds_since_last_prompt >= tracking.active_interval.threshold_seconds() {
                tracking.status = Status::PromptPending;
                tracking.prompt_deadline = Some(now + ChronoDuration::seconds(PROMPT_TIMEOUT_SECS));
                TickAction::OpenPrompt
            } else if tick_count % TRAY_REFRESH_EVERY_SECS == 0 {
                TickAction::RefreshTray
            } else {
                TickAction::None
            }
        }
        Status::PromptPending => match tracking.prompt_deadline {
            Some(deadline) if now >= deadline => TickAction::AutoPause,
            _ => TickAction::None,
        },
        Status::Idle | Status::Paused => TickAction::None,
    }
}

fn tick(app: &AppHandle, tick_count: u64) {
    let state = app.state::<AppState>();
    let action = {
        let mut tracking = state.tracking.lock_or_recover();
        evaluate_tick(&mut tracking, Utc::now(), tick_count)
    };

    match action {
        TickAction::OpenPrompt => prompt::open_prompt_window(app),
        TickAction::AutoPause => {
            let _ = commands::respond_to_prompt(app.clone(), state, false);
        }
        TickAction::RefreshTray => tray::refresh(app, &state),
        TickAction::None => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Interval;

    fn tracking_with(status: Status, active_seconds: i64, interval: Interval) -> TrackingState {
        TrackingState {
            status,
            active_seconds_since_last_prompt: active_seconds,
            active_interval: interval,
            ..TrackingState::default()
        }
    }

    #[test]
    fn tracking_below_threshold_increments_and_does_nothing_off_the_tray_cadence() {
        let mut tracking = tracking_with(Status::Tracking, 10, Interval::Hourly);
        let now = Utc::now();

        let action = evaluate_tick(&mut tracking, now, 1);

        assert_eq!(action, TickAction::None);
        assert_eq!(tracking.active_seconds_since_last_prompt, 11);
        assert_eq!(tracking.status, Status::Tracking);
    }

    #[test]
    fn tracking_below_threshold_refreshes_tray_on_the_cadence() {
        let mut tracking = tracking_with(Status::Tracking, 10, Interval::Hourly);
        let now = Utc::now();

        let action = evaluate_tick(&mut tracking, now, TRAY_REFRESH_EVERY_SECS);

        assert_eq!(action, TickAction::RefreshTray);
    }

    #[test]
    fn tracking_reaching_threshold_opens_prompt_and_sets_deadline() {
        let mut tracking = tracking_with(Status::Tracking, Interval::Hourly.threshold_seconds() - 1, Interval::Hourly);
        let now = Utc::now();

        let action = evaluate_tick(&mut tracking, now, 1);

        assert_eq!(action, TickAction::OpenPrompt);
        assert_eq!(tracking.status, Status::PromptPending);
        assert_eq!(tracking.prompt_deadline, Some(now + ChronoDuration::seconds(PROMPT_TIMEOUT_SECS)));
    }

    #[test]
    fn prompt_pending_before_deadline_does_nothing() {
        let now = Utc::now();
        let mut tracking = TrackingState {
            status: Status::PromptPending,
            prompt_deadline: Some(now + ChronoDuration::seconds(1)),
            ..TrackingState::default()
        };

        let action = evaluate_tick(&mut tracking, now, 1);

        assert_eq!(action, TickAction::None);
        assert_eq!(tracking.status, Status::PromptPending);
    }

    #[test]
    fn prompt_pending_at_or_after_deadline_auto_pauses() {
        let now = Utc::now();
        let mut tracking = TrackingState {
            status: Status::PromptPending,
            prompt_deadline: Some(now),
            ..TrackingState::default()
        };

        let action = evaluate_tick(&mut tracking, now, 1);

        assert_eq!(action, TickAction::AutoPause);
    }

    #[test]
    fn prompt_pending_with_no_deadline_does_nothing_and_does_not_panic() {
        let mut tracking = TrackingState {
            status: Status::PromptPending,
            prompt_deadline: None,
            ..TrackingState::default()
        };

        let action = evaluate_tick(&mut tracking, Utc::now(), 1);

        assert_eq!(action, TickAction::None);
    }

    #[test]
    fn idle_and_paused_never_transition_regardless_of_tick_count() {
        for status in [Status::Idle, Status::Paused] {
            let mut tracking = tracking_with(status, 0, Interval::Hourly);

            let action = evaluate_tick(&mut tracking, Utc::now(), TRAY_REFRESH_EVERY_SECS);

            assert_eq!(action, TickAction::None);
            assert_eq!(tracking.active_seconds_since_last_prompt, 0);
        }
    }
}
