/**
 * Sync transport abstraction (Modules 3 & 9).
 *
 * The real-time engine depends only on the `SyncTransport` interface, never on a
 * concrete network. Two transports ship:
 *
 *   - `LocalTransport`            — a no-op; the app is single-device & offline.
 *   - `BroadcastChannelTransport` — real-time sync across windows/tabs on the
 *                                    same device (main window ⇄ Quick Capture ⇄
 *                                    other tabs), with **no server**.
 *
 * A networked transport (WebSocket / CRDT relay) implements the same interface
 * to reach other devices — the documented cross-device integration point.
 */

import type { Mutation } from "@/types";

export type SyncStatus = "offline" | "connecting" | "online" | "error";

/** A message on the wire: a mutation plus who/when for ordering. */
export interface SyncMessage {
  mutation: Mutation;
  actorId: string;
  lamport: number;
}

export interface SyncTransport {
  readonly name: string;
  status(): SyncStatus;
  connect(): Promise<void>;
  disconnect(): void;
  /** Broadcast a local mutation to peers. */
  send(message: SyncMessage): void;
  /** Subscribe to remote mutations. Returns an unsubscribe fn. */
  subscribe(handler: (message: SyncMessage) => void): () => void;
  /** Subscribe to connection-status changes. */
  onStatus?(handler: (status: SyncStatus) => void): () => void;
}

/** The offline default: accepts sends, delivers nothing, always "offline". */
export class LocalTransport implements SyncTransport {
  readonly name = "local";
  status(): SyncStatus {
    return "offline";
  }
  async connect(): Promise<void> {}
  disconnect(): void {}
  send(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

/**
 * Real-time sync between windows/tabs of the same origin via the BroadcastChannel
 * API. Fully local — nothing leaves the device — yet delivers genuine
 * optimistic, multi-window collaboration. Safe to construct anywhere; it stays
 * "offline" where BroadcastChannel is unavailable (e.g. SSR).
 */
export class BroadcastChannelTransport implements SyncTransport {
  readonly name = "broadcast-channel";
  private channel: BroadcastChannel | null = null;
  private handlers = new Set<(m: SyncMessage) => void>();
  private statusHandlers = new Set<(s: SyncStatus) => void>();
  private state: SyncStatus = "offline";

  constructor(private readonly channelName = "daily-os-sync") {}

  status(): SyncStatus {
    return this.state;
  }

  async connect(): Promise<void> {
    if (typeof BroadcastChannel === "undefined") {
      this.setState("offline");
      return;
    }
    this.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessage = (ev: MessageEvent<SyncMessage>) => {
      for (const h of this.handlers) h(ev.data);
    };
    this.setState("online");
  }

  disconnect(): void {
    this.channel?.close();
    this.channel = null;
    this.setState("offline");
  }

  send(message: SyncMessage): void {
    this.channel?.postMessage(message);
  }

  subscribe(handler: (m: SyncMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStatus(handler: (s: SyncStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setState(s: SyncStatus): void {
    this.state = s;
    for (const h of this.statusHandlers) h(s);
  }
}
