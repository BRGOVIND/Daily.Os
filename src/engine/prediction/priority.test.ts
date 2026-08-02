import { describe, it, expect } from "vitest";
import { computePriority } from "./priority";
import type { Task } from "@/types";

const TODAY = "2026-07-31";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Task",
    completed: false,
    priority: "medium",
    category: "Work",
    color: "slate",
    notes: "",
    recurrence: "none",
    recurringId: null,
    reminderAt: null,
    order: 0,
    createdAt: 0,
    ...overrides,
  };
}

describe("computePriority", () => {
  it("scores completed tasks at 0 / low", () => {
    const p = computePriority(task({ completed: true }), TODAY);
    expect(p.score).toBe(0);
    expect(p.band).toBe("low");
  });

  it("floors overdue tasks at critical", () => {
    const p = computePriority(task({ deadline: "2026-07-01" }), TODAY);
    expect(p.band).toBe("critical");
  });

  it("always returns a score within 0..100 and a valid band", () => {
    const p = computePriority(task({ priority: "high", difficulty: "hard", deadline: TODAY }), TODAY);
    expect(p.score).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high", "critical"]).toContain(p.band);
  });

  it("ranks an urgent task above a bare one", () => {
    const bare = computePriority(task(), TODAY);
    const urgent = computePriority(task({ priority: "high", deadline: TODAY }), TODAY);
    expect(urgent.score).toBeGreaterThan(bare.score);
  });
});
