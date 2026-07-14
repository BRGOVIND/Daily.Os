/** Thin, SSR-safe wrapper around the browser Notification API. */

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

/** Fire a notification if permitted; a no-op otherwise. */
export function showNotification(title: string, body?: string): void {
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
