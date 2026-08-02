/** Thin, SSR-safe wrapper around notifications — native (Tauri) when available,
 * otherwise the browser Notification API. */

import { isTauri, nativeNotify } from "@/lib/native/native";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

/** Request permission; resolves to the resulting state. Safe to call anytime. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Fire a notification via the OS (native shell) when possible, else the
 * browser API. Safe no-op if neither is permitted. */
export function showNotification(title: string, body?: string): void {
  if (isTauri()) {
    // Prefer a real OS notification; fall back to the browser if it fails.
    void nativeNotify(title, body).then((shown) => {
      if (!shown) browserNotification(title, body);
    });
    return;
  }
  browserNotification(title, body);
}

function browserNotification(title: string, body?: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `daily-os-${title}`,
    });
  } catch {
    /* Some browsers throw if called outside a user gesture; ignore. */
  }
}
