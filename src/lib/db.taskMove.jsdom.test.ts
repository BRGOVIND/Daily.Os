// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, emptyDay, getDay, moveTaskToDay, restoreDeletedTask, restoreMovedTask, switchActiveDatabase, updateDay } from "./db";
import type { Task } from "@/types";

const sourceKey = "2026-10-18";
const targetKey = "2026-10-19";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Plan launch",
    completed: false,
    priority: "medium",
    category: "Work",
    color: "burgundy",
    notes: "",
    recurrence: "none",
    recurringId: null,
    reminderAt: null,
    order: 2,
    createdAt: 1,
    timesDeferred: 0,
    timesRescheduled: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  await switchActiveDatabase(`task-move-test-${crypto.randomUUID()}`);
  await db.days.put({ ...emptyDay(sourceKey), tasks: [task({ reminderAt: new Date(2026, 9, 18, 9).getTime() })] });
});

describe("task day move and Undo", () => {
  it("moves task atomically and restores original metadata on Undo", async () => {
    const original = await moveTaskToDay(sourceKey, targetKey, "task-1");
    expect(original).toEqual(task({ reminderAt: new Date(2026, 9, 18, 9).getTime() }));
    expect((await getDay(sourceKey)).tasks).toEqual([]);
    expect((await getDay(targetKey)).tasks).toEqual([
      expect.objectContaining({ id: "task-1", order: 0, reminderAt: new Date(2026, 9, 19, 9).getTime(), timesDeferred: 1, timesRescheduled: 1 }),
    ]);

    expect(await restoreMovedTask(sourceKey, targetKey, original!)).toBe(true);
    expect((await getDay(sourceKey)).tasks).toEqual([task({ reminderAt: new Date(2026, 9, 18, 9).getTime() })]);
    expect((await getDay(targetKey)).tasks).toEqual([]);
  });

  it("keeps recurring and completed tasks on their original days", async () => {
    await updateDay(sourceKey, (day) => ({ ...day, tasks: [task({ recurrence: "daily" })] }));
    expect(await moveTaskToDay(sourceKey, targetKey, "task-1")).toBeNull();
    await updateDay(sourceKey, (day) => ({ ...day, tasks: [task({ completed: true })] }));
    expect(await moveTaskToDay(sourceKey, targetKey, "task-1")).toBeNull();
    expect((await getDay(sourceKey)).tasks).toHaveLength(1);
  });

  it("restores deleted task without duplicating it", async () => {
    const original = task();
    await updateDay(sourceKey, (day) => ({ ...day, tasks: [] }));
    expect(await restoreDeletedTask(sourceKey, original)).toBe(true);
    expect(await restoreDeletedTask(sourceKey, original)).toBe(false);
    expect((await getDay(sourceKey)).tasks).toEqual([original]);
  });
});
