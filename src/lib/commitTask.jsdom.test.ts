// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, getDay, switchActiveDatabase } from "./db";
import { commitTask } from "./commitTask";
import type { TaskDraft } from "@/types";

const dateKey = "2026-10-19";
const draft: TaskDraft = {
  title: " Review launch ",
  category: "Work",
  priority: "high",
  color: "burgundy",
  notes: " Check every flow ",
  recurrence: "daily",
  reminderAt: null,
};

beforeEach(async () => {
  await switchActiveDatabase(`commit-task-test-${crypto.randomUUID()}`);
});

describe("commitTask", () => {
  it("saves one linked recurring definition and task together", async () => {
    await commitTask(dateKey, draft);

    const day = await getDay(dateKey);
    const recurring = await db.recurring.toArray();
    expect(day.tasks).toHaveLength(1);
    expect(recurring).toHaveLength(1);
    expect(day.tasks[0].recurringId).toBe(recurring[0].id);
    expect(day.recurringApplied).toEqual([recurring[0].id]);
    expect(recurring[0]).toMatchObject({ title: "Review launch", notes: "Check every flow" });
  });
});
