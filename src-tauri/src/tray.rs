//! System tray: quick access to Daily OS from the menu bar / notification area.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};

use crate::{emit_action, open_quick_capture, show_main, ACTION_DASHBOARD, ACTION_FOCUS, ACTION_OPEN};

/// Build the tray icon and its menu. Left-click restores the main window;
/// menu items mirror the global shortcuts.
///
/// Non-generic over the runtime on purpose: `TrayIconBuilder` defaults its
/// runtime parameter to `Wry`, and the app is built on the default `Wry`
/// runtime, so tying this to `AppHandle` (= `AppHandle<Wry>`) keeps every
/// `Manager<R>` bound consistent (a generic `R` collides with that default).
pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Daily OS", true, None::<&str>)?;
    let dashboard = MenuItem::with_id(app, "dashboard", "Today's Dashboard", true, None::<&str>)?;
    let quick = MenuItem::with_id(app, "quick_add", "Quick Add Task…", true, None::<&str>)?;
    let focus = MenuItem::with_id(app, "focus", "Focus Mode", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Daily OS", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open, &dashboard, &quick, &focus, &sep, &quit])?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("Daily OS")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                show_main(app);
                emit_action(app, ACTION_OPEN);
            }
            "dashboard" => {
                show_main(app);
                emit_action(app, ACTION_DASHBOARD);
            }
            "quick_add" => {
                let _ = open_quick_capture(app.clone());
            }
            "focus" => {
                show_main(app);
                emit_action(app, ACTION_FOCUS);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        });

    // Use the app's default window icon for the tray when available.
    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}
