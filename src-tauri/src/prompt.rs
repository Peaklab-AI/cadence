use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const PROMPT_WINDOW_LABEL: &str = "confirm";

/// Opens (or refocuses) the small always-on-top "still working?" window.
/// A dedicated webview window is used instead of a native dialog because
/// native dialogs can't reliably race against Rust's own timeout, nor be
/// dismissed programmatically, across macOS/Windows/Linux.
pub fn open_prompt_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(PROMPT_WINDOW_LABEL) {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    let _ = WebviewWindowBuilder::new(app, PROMPT_WINDOW_LABEL, WebviewUrl::App("index.html".into()))
        .title("Still working?")
        .inner_size(360.0, 220.0)
        .resizable(false)
        .always_on_top(true)
        .decorations(false)
        .transparent(true)
        .shadow(true)
        .center()
        .build();
}

pub fn close_prompt_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(PROMPT_WINDOW_LABEL) {
        let _ = window.close();
    }
}
