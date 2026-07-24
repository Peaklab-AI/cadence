mod commands;
mod config;
mod models;
mod prompt;
mod state;
mod storage;
mod timer;
mod tray;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let data_dir = storage::resolve_effective_dir(&handle).expect("failed to resolve app data directory");
            let data = storage::load_from_dir(&data_dir).unwrap_or_default();
            app.manage(AppState::new(data, data_dir));

            // Menu-bar-only app: no Dock icon / Cmd+Tab entry on macOS.
            #[cfg(target_os = "macos")]
            handle.set_activation_policy(tauri::ActivationPolicy::Accessory)?;

            tray::setup(&handle)?;
            timer::start(handle.clone());
            timer::start_animation(handle);

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            match event {
                // Closing the main window hides it instead of quitting, so
                // tracking (and the tray) keep running in the background.
                // Only the tray's "Quit Cadence" item actually exits the app.
                // Routed through request_hide so it gets the same "leave
                // tracking off?" confirmation as any other dismiss.
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    tray::request_hide(window.app_handle());
                }
                // Popover behavior: clicking outside the window hides it,
                // same as a native menu-bar dropdown (unless request_hide
                // holds it open to confirm leaving tracking off). We also
                // record the moment an actual hide happens so a tray click
                // landing right after (which is what caused the blur in the
                // first place, when dismissing an already-open popover)
                // doesn't immediately reopen it — see
                // tray::consume_recent_blur_hide.
                tauri::WindowEvent::Focused(false) => {
                    if tray::request_hide(window.app_handle()) {
                        tray::record_blur_hide();
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_state,
            commands::list_time_entries,
            commands::list_billed_periods,
            commands::mark_period_billed,
            commands::unmark_period_billed,
            commands::save_text_file,
            commands::add_client,
            commands::add_project,
            commands::start_tracking,
            commands::pause_tracking,
            commands::update_project,
            commands::delete_project,
            commands::update_time_entry,
            commands::delete_time_entry,
            commands::add_manual_time_entry,
            commands::respond_to_prompt,
            commands::confirm_leave_tracking_off,
            commands::cancel_leave_tracking_off,
            commands::get_storage_settings,
            commands::check_data_folder,
            commands::set_data_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
