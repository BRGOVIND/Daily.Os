"use client";

import { useEffect, useState } from "react";
import { BroadcastChannelTransport, type SyncStatus } from "@/collab";

/**
 * Connects the real-time transport and reports its status. The default
 * BroadcastChannel transport keeps windows/tabs of the same device in sync with
 * **no server**; it reconnects automatically on mount. A networked transport
 * would report the same status shape for cross-device sync.
 *
 * Note: entity data (comments, members, activity) already propagates across
 * windows via Dexie's live queries over shared IndexedDB — this hook governs the
 * sync *channel* used by the mutation engine and the connection indicator.
 */
export function useSyncStatus(enabled = true): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("offline");

  useEffect(() => {
    if (!enabled) return;
    const transport = new BroadcastChannelTransport();
    const off = transport.onStatus?.(setStatus) ?? (() => {});
    setStatus("connecting");
    void transport.connect().then(() => setStatus(transport.status()));
    return () => {
      off();
      transport.disconnect();
    };
  }, [enabled]);

  return status;
}
