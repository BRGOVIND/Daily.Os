//! Daily OS — native shell (Tauri 2).
//!
//! The web app remains the source of truth; this shell *enhances* it with a
//! system tray, global shortcuts, a floating Quick Capture window and native
//! notifications. It adds no backend, no network, no account — everything the
//! frontend does still happens locally in the shared WebView storage.
//!
//! IPC surface:
//!   * Rust → JS  : `app.emit("native:action", <NativeAction>)` (tray/shortcut)
//!   * JS → Rust  : the `#[tauri::command]` handlers registered below.

use tauri::{
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
};

mod tray;

/// Actions the shell asks the frontend to perform. Kept as plain strings so the
/// TypeScript bridge can pattern-match without a generated binding.
pub const ACTION_OPEN: &str = "open";
pub const ACTION_DASHBOARD: &str = "dashboard";
pub const ACTION_QUICK_ADD: &str = "quick-add";
pub const ACTION_FOCUS: &str = "focus";

/// The floating Quick Capture window's label.
const QUICK_LABEL: &str = "quick-capture";

/// Bring the main window to the foreground (restoring if minimized/hidden).
pub fn show_main<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

/// Emit a native action to every window; the frontend routes it.
pub fn emit_action<R: tauri::Runtime>(app: &tauri::AppHandle<R>, action: &str) {
    let _ = app.emit("native:action", action);
}

// ─── IPC commands (JS → Rust) ────────────────────────────────────────────────

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    show_main(&app);
}

/// Open (or focus) the always-on-top Quick Capture window. Targets <100 ms by
/// reusing the window if it already exists rather than rebuilding it.
#[tauri::command]
fn open_quick_capture(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(QUICK_LABEL) {
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }
    WebviewWindowBuilder::new(&app, QUICK_LABEL, WebviewUrl::App("capture".into()))
        .title("Quick Capture")
        .inner_size(440.0, 340.0)
        .min_inner_size(360.0, 280.0)
        .always_on_top(true)
        .decorations(true)
        .resizable(false)
        .center()
        .skip_taskbar(true)
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Close the window that made the call (used by Quick Capture's Esc / save).
#[tauri::command]
fn close_self(window: tauri::Window) {
    let _ = window.close();
}

/// Toggle Focus Mode: surface the main window and let the frontend dim chrome.
#[tauri::command]
fn enter_focus_mode(app: tauri::AppHandle) {
    show_main(&app);
    emit_action(&app, ACTION_FOCUS);
}

/// Reveal a path in the OS file manager (backup folder, an export, etc.).
#[tauri::command]
fn reveal_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .reveal_item_in_dir(path)
        .map_err(|e| e.to_string())
}

/// The default backup directory: `<app data>/backups`, created on demand.
#[tauri::command]
fn backup_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// Enable/disable launch-at-login. No-op scaffold on mobile.
#[tauri::command]
fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    #[cfg(desktop)]
    {
        use tauri_plugin_autostart::ManagerExt;
        let manager = app.autolaunch();
        let r = if enabled { manager.enable() } else { manager.disable() };
        return r.map_err(|e| e.to_string());
    }
    #[cfg(not(desktop))]
    {
        let _ = (app, enabled);
        Ok(())
    }
}

/// Whether launch-at-login is currently enabled.
#[tauri::command]
fn is_autostart(app: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(desktop)]
    {
        use tauri_plugin_autostart::ManagerExt;
        return app.autolaunch().is_enabled().map_err(|e| e.to_string());
    }
    #[cfg(not(desktop))]
    {
        let _ = app;
        Ok(false)
    }
}

/// Register the desktop-only plugins (single-instance, autostart, shortcuts).
#[cfg(desktop)]
fn register_desktop(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    use tauri_plugin_autostart::MacosLauncher;
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

    // Default global shortcuts (configurable from Settings later).
    let quick = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
    let dash = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD);
    let focus = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyF);

    builder
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Second launch: focus the existing window instead of spawning one.
            show_main(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts([quick, dash, focus])
                .expect("valid shortcuts")
                .with_handler(move |app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if shortcut == &quick {
                        let _ = open_quick_capture(app.clone());
                    } else if shortcut == &dash {
                        show_main(app);
                        emit_action(app, ACTION_DASHBOARD);
                    } else if shortcut == &focus {
                        show_main(app);
                        emit_action(app, ACTION_FOCUS);
                    }
                })
                .build(),
        )
}

#[cfg(not(desktop))]
fn register_desktop(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder
}

/// Entry point shared by the desktop binary (and, later, mobile).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        // Cross-platform plugins.
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        // Remember window size/position across launches & monitors.
        .plugin(tauri_plugin_window_state::Builder::default().build());

    register_desktop(builder)
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            open_quick_capture,
            close_self,
            enter_focus_mode,
            reveal_path,
            backup_dir,
            set_autostart,
            is_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Daily OS");
}
