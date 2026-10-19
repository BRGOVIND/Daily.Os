// @vitest-environment jsdom
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyDatabase, db, switchActiveDatabase } from "./db";
import {
  describeBundle,
  exportAll,
  importBundle,
  journalOnlyBundle,
  missionsOnlyBundle,
  scopeBundleToWorkspace,
  validateBundle,
} from "./backup";

let name: string;

beforeEach(async () => {
  name = `backup-test-${crypto.randomUUID()}`;
  await switchActiveDatabase(name);
});

afterEach(async () => {
  await switchActiveDatabase(`${name}-cleanup`);
  await Dexie.delete(name);
});

describe("backup coverage", () => {
  it("exports and restores every v6 productivity table", async () => {
    await db.quickNotes.put({
      id: "quick-1", body: "Keep this", date: "2026-10-19", pinned: false,
      color: "yellow", createdAt: 1, updatedAt: 1,
    });
    await db.stickyNotes.put({
      id: "sticky-1", body: "Board note", color: "yellow", x: 12, y: 20,
      width: 200, height: 150, collapsed: false, createdAt: 1, updatedAt: 1,
    });
    await db.pomodoroSessions.put({
      id: "focus-1", phase: "focus", plannedSeconds: 1500,
      elapsedSeconds: 1500, completed: true, taskTitle: "Write",
      date: "2026-10-19", startedAt: 1, endedAt: 1501,
    });
    await db.utilities.put({ id: "shopping", data: ["milk"], updatedAt: 1 });

    const bundle = await exportAll();
    expect(describeBundle(bundle)).toMatchObject({
      quickNotes: 1, stickyNotes: 1, pomodoroSessions: 1, utilities: 1,
    });
    await Promise.all([
      db.quickNotes.clear(), db.stickyNotes.clear(),
      db.pomodoroSessions.clear(), db.utilities.clear(),
    ]);

    await importBundle(validateBundle(JSON.parse(JSON.stringify(bundle))), "replace");
    expect((await db.quickNotes.get("quick-1"))?.body).toBe("Keep this");
    expect((await db.stickyNotes.get("sticky-1"))?.x).toBe(12);
    expect((await db.pomodoroSessions.get("focus-1"))?.completed).toBe(true);
    expect((await db.utilities.get("shopping"))?.data).toEqual(["milk"]);

    await db.quickNotes.put({ ...bundle.quickNotes![0], body: "Old" });
    await importBundle(bundle, "merge");
    expect((await db.quickNotes.get("quick-1"))?.body).toBe("Keep this");
  });

  it("keeps scoped backups scoped and accepts older files", async () => {
    const full = await exportAll();
    full.quickNotes = [{ id: "quick-1", body: "Private", date: null, pinned: true,
      color: "yellow", createdAt: 1, updatedAt: 1 }];
    full.utilities = [{ id: "expenses", data: { total: 42 }, updatedAt: 1 }];
    full.members = [{ id: "member-1", workspaceId: "other" } as NonNullable<typeof full.members>[number]];

    for (const scoped of [
      missionsOnlyBundle(full),
      journalOnlyBundle(full),
      scopeBundleToWorkspace(full, "target"),
    ]) {
      expect(scoped.quickNotes).toEqual([]);
      expect(scoped.utilities).toEqual([]);
      expect(scoped.members).toEqual([]);
    }

    const old = { ...full };
    delete old.quickNotes;
    delete old.stickyNotes;
    delete old.pomodoroSessions;
    delete old.utilities;
    expect(validateBundle(old)).toMatchObject({
      quickNotes: [], stickyNotes: [], pomodoroSessions: [], utilities: [],
    });
  });

  it("copies v6 data when a Guest becomes a profile", async () => {
    const target = `${name}-profile`;
    await db.quickNotes.put({ id: "quick-1", body: "Guest note", date: null,
      pinned: true, color: "yellow", createdAt: 1, updatedAt: 1 });
    await db.stickyNotes.put({ id: "sticky-1", body: "Guest sticky", color: "yellow",
      x: 0, y: 0, width: 200, height: 150, collapsed: false, createdAt: 1, updatedAt: 1 });
    await db.pomodoroSessions.put({ id: "focus-1", phase: "focus",
      plannedSeconds: 1500, elapsedSeconds: 1500, completed: true,
      taskTitle: null, date: "2026-10-19", startedAt: 1, endedAt: 1501 });
    await db.utilities.put({ id: "shopping", data: ["bread"], updatedAt: 1 });
    try {
      await copyDatabase(name, target);
      await switchActiveDatabase(target);
      expect((await db.quickNotes.get("quick-1"))?.body).toBe("Guest note");
      expect((await db.stickyNotes.get("sticky-1"))?.body).toBe("Guest sticky");
      expect((await db.pomodoroSessions.get("focus-1"))?.completed).toBe(true);
      expect((await db.utilities.get("shopping"))?.data).toEqual(["bread"]);
    } finally {
      await switchActiveDatabase(`${name}-copy-cleanup`);
      await Dexie.delete(target);
    }
  });
});
