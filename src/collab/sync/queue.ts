/**
 * The sync engine's conflict-resolution core (Module 9) — pure functions.
 *
 * Ordering uses a **Lamport clock** so mutations from different actors have a
 * deterministic total order without a central server. Conflicts on the same
 * entity resolve **last-write-wins** by `(lamport, timestamp, actorId)`, which
 * is commutative and associative — every peer converges to the same result
 * regardless of delivery order.
 */

import type { Mutation } from "@/types";

/** Advance a Lamport clock, accounting for a possibly-newer remote clock. */
export function tickLamport(local: number, remote = 0): number {
  return Math.max(local, remote) + 1;
}

/** A minimal versioned record the resolver can compare. */
export interface Versioned {
  lamport: number;
  createdAt: number;
  actorId: string;
}

/**
 * Deterministic winner of two versions of the same entity. Higher Lamport wins;
 * ties break by wall-clock, then by actorId so all peers agree. Total order.
 */
export function resolveConflict<T extends Versioned>(a: T, b: T): T {
  if (a.lamport !== b.lamport) return a.lamport > b.lamport ? a : b;
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? a : b;
  return a.actorId <= b.actorId ? a : b;
}

/** Total-order a batch of mutations for deterministic application. */
export function orderMutations(mutations: Mutation[]): Mutation[] {
  return [...mutations].sort((a, b) => {
    if (a.lamport !== b.lamport) return a.lamport - b.lamport;
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.actorId < b.actorId ? -1 : a.actorId > b.actorId ? 1 : 0;
  });
}

/**
 * Merge incoming mutations into a keyed entity map, resolving per-key conflicts.
 * `keyOf` extracts an entity id; `versionOf` extracts its version stamp. Pure —
 * returns a new map, mutating nothing.
 */
export function mergeById<T>(
  current: Map<string, { value: T; version: Versioned }>,
  incoming: { value: T; version: Versioned; key: string }[],
): Map<string, { value: T; version: Versioned }> {
  const next = new Map(current);
  for (const item of incoming) {
    const existing = next.get(item.key);
    if (!existing) {
      next.set(item.key, { value: item.value, version: item.version });
      continue;
    }
    const winner = resolveConflict(existing.version, item.version);
    next.set(item.key, winner === existing.version ? existing : { value: item.value, version: item.version });
  }
  return next;
}

/** Pending mutations, oldest first — what a transport flushes on (re)connect. */
export function pending(mutations: Mutation[]): Mutation[] {
  return orderMutations(mutations.filter((m) => m.status === "pending"));
}
