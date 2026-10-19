// @vitest-environment jsdom
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { DEFAULT_WORKSPACE_ID } from "./constants";
import { db, ensureSeeded, getDay, switchActiveDatabase } from "./db";

describe("legacy database migration", () => {
  it("preserves v3 tasks and missions while adding Workspace OS stores", async () => {
    const name = `migration-test-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(3).stores({
      days: "date, updatedAt",
      habits: "id, order",
      templates: "id, order",
      recurring: "id, createdAt",
      settings: "id",
      missions: "id, createdAt, archived",
    });
    await legacy.open();
    await legacy.table("days").put({
      date: "2026-10-18",
      tasks: [{
        id: "legacy-task",
        title: "Keep my task",
        completed: false,
        priority: "medium",
        category: "Work",
        color: "burgundy",
        notes: "",
        recurrence: "none",
        recurringId: null,
        reminderAt: null,
        order: 0,
        createdAt: 1,
      }],
      notes: "Keep my note",
      focus: [],
      habitLog: {},
      recurringApplied: [],
      review: null,
      updatedAt: 1,
    });
    await legacy.table("missions").put({
      id: "legacy-mission",
      title: "Keep my mission",
      createdAt: 1,
      archived: false,
    });
    legacy.close();

    try {
      await switchActiveDatabase(name);
      expect(db.verno).toBe(6);
      expect((await getDay("2026-10-18")).tasks[0].title).toBe("Keep my task");
      expect((await getDay("2026-10-18")).notes).toBe("Keep my note");
      expect((await db.missions.get("legacy-mission"))?.title).toBe("Keep my mission");

      await ensureSeeded();
      expect((await db.workspaces.get(DEFAULT_WORKSPACE_ID))?.name).toBe("Daily OS");
      expect((await getDay("2026-10-18")).tasks).toHaveLength(1);
    } finally {
      await switchActiveDatabase(`${name}-cleanup`);
      await Dexie.delete(name);
    }
  });
});
