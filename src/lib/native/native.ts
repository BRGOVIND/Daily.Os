/**
 * High-level native API used by the React layer. Every function is safe to call
 * in the browser — it simply resolves to a no-op / false when not in the shell.
 */

import { invoke, isTauri, listen } from "./bridge";

export { isTauri } from "./bridge";

/** Actions the shell (tray / global shortcuts) asks the frontend to perform. */
export type NativeAction = "open" | "dashboard" | "quick-add" | "focus";

const ACTIONS: NativeAction[] = ["open", "dashboard", "quick-add", "focus"];

/** Subscribe to tray / global-shortcut actions. Returns an unlisten fn. */
export async function onNativeAction(
  handler: (action: NativeAction) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {};
  return listen<string>("native:action", (payload) => {
    if ((ACTIONS as string[]).includes(payload)) handler(payload as NativeAction);
  });
}

// ─── Windows ─────────────────────────────────────────────────────────────────

export async function showMainWindow(): Promise<void> {
  if (isTauri()) await invoke("show_main_window").catch(() => {});
}

export async function openQuickCapture(): Promise<void> {
  if (isTauri()) await invoke("open_quick_capture").catch(() => {});
}

export async function closeSelf(): Promise<void> {
  if (isTauri()) await invoke("close_self").catch(() => {});
}

export async function enterFocusMode(): Promise<void> {
  if (isTauri()) await invoke("enter_focus_mode").catch(() => {});
}

// ─── Filesystem ──────────────────────────────────────────────────────────────

/** The native backup directory (`<app data>/backups`), or null off-shell. */
export async function backupDir(): Promise<string | null> {
  if (!isTauri()) return null;
  return invoke<string>("backup_dir").catch(() => null);
}

/** Reveal a file/folder in the OS file manager. */
export async function revealPath(path: string): Promise<void> {
  if (isTauri()) await invoke("reveal_path", { path }).catch(() => {});
}

// ─── Autostart ───────────────────────────────────────────────────────────────

export async function isAutostartEnabled(): Promise<boolean> {
  if (!isTauri()) return false;
  return invoke<boolean>("is_autostart").catch(() => false);
}

export async function setAutostart(enabled: boolean): Promise<void> {
  if (isTauri()) await invoke("set_autostart", { enabled }).catch(() => {});
}

// ─── Notifications ───────────────────────────────────────────────────────────

/**
 * Fire a native OS notification via the notification plugin, requesting
 * permission on first use. Returns true if it was shown. Off-shell it returns
 * false so callers can fall back to the browser Notification API.
 */
export async function nativeNotify(title: string, body?: string): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    let granted = await invoke<boolean>("plugin:notification|is_permission_granted");
    if (!granted) {
      const res = await invoke<string>("plugin:notification|request_permission");
      granted = res === "granted";
    }
    if (!granted) return false;
    await invoke("plugin:notification|notify", { options: { title, body } });
    return true;
  } catch {
    return false;
  }
}
