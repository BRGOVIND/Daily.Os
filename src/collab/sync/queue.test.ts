import { describe, it, expect } from "vitest";
import { tickLamport, resolveConflict, orderMutations, pending, type Versioned } from "./queue";
import type { Mutation } from "@/types";

const v = (lamport: number, createdAt: number, actorId: string): Versioned => ({
  lamport,
  createdAt,
  actorId,
});

describe("tickLamport", () => {
  it("advances past the max of local and remote", () => {
    expect(tickLamport(3)).toBe(4);
    expect(tickLamport(3, 7)).toBe(8);
    expect(tickLamport(9, 2)).toBe(10);
  });
});

describe("resolveConflict (last-write-wins, deterministic total order)", () => {
  it("prefers the higher Lamport clock", () => {
    expect(resolveConflict(v(2, 100, "a"), v(1, 999, "b")).lamport).toBe(2);
  });
  it("breaks Lamport ties by wall-clock", () => {
    expect(resolveConflict(v(2, 100, "a"), v(2, 200, "b")).createdAt).toBe(200);
  });
  it("breaks full ties by actorId so all peers agree", () => {
    expect(resolveConflict(v(2, 100, "b"), v(2, 100, "a")).actorId).toBe("a");
  });
  it("is commutative on the winner", () => {
    const a = v(2, 100, "a");
    const b = v(3, 50, "b");
    expect(resolveConflict(a, b)).toEqual(resolveConflict(b, a));
  });
});

describe("orderMutations / pending", () => {
  const m = (id: string, lamport: number, createdAt: number, actorId: string, status: Mutation["status"] = "pending"): Mutation => ({
    id,
    workspaceId: "w",
    actorId,
    lamport,
    entity: "task",
    op: "create",
    payload: null,
    createdAt,
    status,
  });

  it("orders by lamport, then time, then actor", () => {
    const ordered = orderMutations([m("c", 2, 5, "z"), m("a", 1, 9, "a"), m("b", 2, 5, "a")]);
    expect(ordered.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("pending() keeps only pending, oldest first", () => {
    const out = pending([m("a", 3, 1, "a", "synced"), m("b", 1, 1, "a"), m("c", 2, 1, "a")]);
    expect(out.map((x) => x.id)).toEqual(["b", "c"]);
  });
});
