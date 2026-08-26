use crate::lock_ext::LockOrRecover;
use crate::state::{AppState, Status};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    image::Image,
    menu::{Menu, MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, Rect, State, WebviewWindow,
};

pub const TRAY_ID: &str = "cadence-tray";
const ICON_IDLE: &[u8] = include_bytes!("../icons/tray-idle.png");
/// Frames of the tracking-in-progress spinner — the same ring-with-a-sweep
/// motif as the app icon, rotated a step further each frame. Advanced by a
/// dedicated fast tick in `timer::start_animation`; `refresh` below only
/// picks the icon *family* (idle vs. active) on actual state transitions.
const ICON_ACTIVE_FRAMES: [&[u8]; 16] = [
    include_bytes!("../icons/tray-active-0.png"),
    include_bytes!("../icons/tray-active-1.png"),
    include_bytes!("../icons/tray-active-2.png"),
    include_bytes!("../icons/tray-active-3.png"),
    include_bytes!("../icons/tray-active-4.png"),
    include_bytes!("../icons/tray-active-5.png"),
    include_bytes!("../icons/tray-active-6.png"),
    include_bytes!("../icons/tray-active-7.png"),
    include_bytes!("../icons/tray-active-8.png"),
    include_bytes!("../icons/tray-active-9.png"),
    include_bytes!("../icons/tray-active-10.png"),
    include_bytes!("../icons/tray-active-11.png"),
    include_bytes!("../icons/tray-active-12.png"),
    include_bytes!("../icons/tray-active-13.png"),
    include_bytes!("../icons/tray-active-14.png"),
    include_bytes!("../icons/tray-active-15.png"),
];

/// Last time the main window was auto-hidden because it lost focus (i.e.
/// the user clicked away, including onto the tray icon itself). Guards
/// against the click that dismisses an open popover immediately reopening
/// it: the blur fires first, then the tray click event — without this,
/// the click would see an already-hidden window and show it right back.
static LAST_BLUR_HIDE: Mutex<Option<Instant>> = Mutex::new(None);
const BLUR_REOPEN_GUARD: Duration = Duration::from_millis(250);

/// Last time the "leave tracking off?" nag was shown, so a burst of
/// open/close while idle (e.g. just checking the app) only gets asked
/// once instead of on every single dismiss.
static LAST_LEAVE_OFF_NAG: Mutex<Option<Instant>> = Mutex::new(None);
const LEAVE_OFF_NAG_COOLDOWN: Duration = Duration::from_secs(20 * 60);

/// Set while a native file/folder picker (e.g. the logo upload input) is
/// open. On macOS, presenting that OS panel takes key focus away from the
/// webview just like clicking outside the popover would, which would
/// otherwise fire the same `Focused(false)` → hide path below and make the
/// window vanish out from under the open picker. The frontend sets this
/// immediately before opening a picker and clears it once the picker
/// closes (chosen or cancelled).
static SUPPRESS_HIDE: Mutex<bool> = Mutex::new(false);

pub fn set_suppress_hide(suppressed: bool) {
    *SUPPRESS_HIDE.lock_or_recover() = suppressed;
}

pub fn record_blur_hide() {
    *LAST_BLUR_HIDE.lock_or_recover() = Some(Instant::now());
}

fn consume_recent_blur_hide() -> bool {
    let mut last = LAST_BLUR_HIDE.lock_or_recover();
    if last.is_some_and(|t| t.elapsed() < BLUR_REOPEN_GUARD) {
        *last = None;
        true
    } else {
        false
    }
}

fn should_nag_leave_off() -> bool {
    let last = LAST_LEAVE_OFF_NAG.lock_or_recover();
    !last.is_some_and(|t| t.elapsed() < LEAVE_OFF_NAG_COOLDOWN)
}

fn mark_leave_off_nagged() {
    *LAST_LEAVE_OFF_NAG.lock_or_recover() = Some(Instant::now());
}

/// Resets the cooldown so the next dismiss-while-idle nags again — called
/// when the user explicitly starts tracking, since that's a clear signal
/// they're now paying attention and a future "forgot to track?" nag is
/// relevant again.
pub fn reset_leave_off_nag() {
    *LAST_LEAVE_OFF_NAG.lock_or_recover() = None;
}

/// Hides the main window, unless tracking is off and we haven't nagged
/// about it recently — in which case the hide is held back and the
/// frontend is asked to confirm first. Returns whether the window was
/// actually hidden.
pub fn request_hide(app: &AppHandle) -> bool {
    if *SUPPRESS_HIDE.lock_or_recover() {
        return false;
    }
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };
    let state = app.state::<AppState>();
    let status = state.tracking.lock_or_recover().status;
    let is_tracking = matches!(status, Status::Tracking | Status::PromptPending);

    if is_tracking || !should_nag_leave_off() {
        let _ = window.hide();
        return true;
    }

    mark_leave_off_nagged();
    let _ = window.set_focus();
    let _ = app.emit("confirm-close-requested", ());
    false
}

/// The tray is deliberately minimal: an icon that shows tracking status at a
/// glance, and a left-click that toggles the main window as a popover
/// anchored under the icon — all the real controls (pause, switch project,
/// history) live in that window, not duplicated into a native menu. The
/// right-click context menu only holds Quit.
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let icon = Image::from_bytes(ICON_IDLE)?;
    let menu = build_menu(app)?;
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        // Idle starts out as a template image (see `refresh` — a plain
        // color ring at rest was hard to see against some menu bars, so
        // idle stays monochrome/theme-adaptive; the active spinner switches
        // to the app's real gradient once tracking starts).
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id().as_ref() == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                toggle_main_window(tray.app_handle(), &rect);
            }
        })
        .build(app)?;
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let quit_item = MenuItemBuilder::with_id("quit", "Quit Cadence").build(app)?;
    MenuBuilder::new(app).item(&quit_item).build()
}

fn toggle_main_window(app: &AppHandle, tray_rect: &Rect) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        request_hide(app);
        return;
    }
    if consume_recent_blur_hide() {
        // This click is what caused the blur that just hid the window —
        // the user was dismissing it, not asking to reopen it.
        return;
    }
    position_under_tray(&window, tray_rect);
    let _ = window.show();
    let _ = window.set_focus();
}

/// Centers the window horizontally under the tray icon, just below it —
/// the standard menu-bar-popover placement.
fn position_under_tray(window: &WebviewWindow, tray_rect: &Rect) {
    let Ok(window_size) = window.outer_size() else {
        return;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let tray_pos = tray_rect.position.to_physical::<f64>(scale);
    let tray_size = tray_rect.size.to_physical::<f64>(scale);

    let x = tray_pos.x + tray_size.width / 2.0 - window_size.width as f64 / 2.0;
    let y = tray_pos.y + tray_size.height;

    let _ = window.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
}

/// Swaps the tray icon between idle/active to reflect tracking status. The
/// context menu itself is static (just Quit), so nothing else to refresh.
/// This gives instant feedback right when tracking starts/stops; the
/// spinner then keeps animating on its own via `advance_frame`.
///
/// Idle is a template (monochrome, theme-adaptive) icon; active is the
/// app's real gradient. `set_icon_with_as_template` switches both
/// atomically — setting the icon and the template flag separately causes a
/// visible flicker on macOS.
pub fn refresh(app: &AppHandle, _state: &State<AppState>) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return;
    };
    let state = app.state::<AppState>();
    let status = state.tracking.lock_or_recover().status;
    let (icon_bytes, is_template) = if matches!(status, Status::Tracking | Status::PromptPending) {
        (ICON_ACTIVE_FRAMES[0], false)
    } else {
        (ICON_IDLE, true)
    };
    if let Ok(icon) = Image::from_bytes(icon_bytes) {
        let _ = tray.set_icon_with_as_template(Some(icon), is_template);
    }
}

/// Advances the tracking spinner by one frame. A no-op while not tracking
/// (the icon is left exactly as `refresh` last set it — the static idle
/// mark), so this can tick continuously without needing to know whether
/// anything actually changed.
pub fn advance_frame(app: &AppHandle, frame: usize) {
    let state = app.state::<AppState>();
    let status = state.tracking.lock_or_recover().status;
    if !matches!(status, Status::Tracking | Status::PromptPending) {
        return;
    }
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return;
    };
    let icon_bytes = ICON_ACTIVE_FRAMES[frame % ICON_ACTIVE_FRAMES.len()];
    if let Ok(icon) = Image::from_bytes(icon_bytes) {
        let _ = tray.set_icon(Some(icon));
    }
}
