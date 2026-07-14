import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  DayRecord,
  HabitDef,
  RecurringTask,
  Template,
} from "@/types";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TEMPLATES,
} from "@/lib/constants";
import { createId } from "@/lib/utils";
import { initialDbName } from "@/lib/profiles";

/**
 * A per-profile IndexedDB database for Daily OS.
 *
 *  - `days`      one workspace per date (primary key = yyyy-MM-dd)
 *  - `habits`    global habit definitions (completion lives per-day)
 *  - `templates` reusable task groups (built-in + user)
 *  - `recurring` recurring-task definitions, materialized into matching days
 *  - `settings`  a single app-settings row keyed "app"
 *
 * Each profile is backed by its own database (name), so data is fully isolated.
 * All reads/writes flow through the helpers below so the UI never touches
 * Dexie directly.
 */
export class DailyOSDatabase extends Dexie {
  days!: Table<DayRecord, string>;
  habits!: Table<HabitDef, string>;
  templates!: Table<Template, string>;
  recurring!: Table<RecurringTask, string>;
  settings!: Table<AppSettings, string>;

  constructor(name: string) {
    super(name);

    // v1 — original day-only schema.
    this.version(1).stores({ days: "date, updatedAt" });

    // v2 — global entities + normalized day shape.
    this.version(2)
      .stores({
        days: "date, updatedAt",
        habits: "id, order",
        templates: "id, order",
        recurring: "id, createdAt",
        settings: "id",
      })
      .upgrade(async (tx) => {
        // Migrate any v1 day records that carried an ad-hoc habits array.
        await tx
          .table<DayRecord & { habits?: unknown }>("days")
          .toCollection()
          .modify((d) => {
            d.habitLog = d.habitLog ?? {};
            d.recurringApplied = d.recurringApplied ?? [];
            d.review = d.review ?? null;
            delete d.habits;
          });
      });
  }
}

// The active database instance. Swapped on profile switch; the app subtree is
// remounted afterwards so all live queries re-subscribe to the new instance.
let active = new DailyOSDatabase(initialDbName());

/**
 * A stable proxy over the active database, so call sites can keep importing a
 * single `db` while the underlying instance changes on profile switches.
 * Methods are bound to the live instance; table accessors return live tables.
 */
export const db = new Proxy({} as DailyOSDatabase, {
  get(_target, prop) {
    const value = Reflect.get(active, prop, active);
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as DailyOSDatabase;

/** Switch the active database. No-op if already active. */
export async function switchActiveDatabase(name: string): Promise<void> {
  if (active.name === name) return;
  const previous = active;
  active = new DailyOSDatabase(name);
  await active.open();
  previous.close();
}

/** Permanently delete a profile's database. */
export async function deleteDatabase(name: string): Promise<void> {
  if (active.name === name) return; // never delete the live db
  await Dexie.delete(name);
}

/** Copy every table from one database into another (used for Guest → profile). */
export async function copyDatabase(fromName: string, toName: string): Promise<void> {
  const from = fromName === active.name ? active : new DailyOSDatabase(fromName);
  const to = toName === active.name ? active : new DailyOSDatabase(toName);
  await from.open();
  await to.open();
  const [days, habits, templates, recurring, settings] = await Promise.all([
    from.days.toArray(),
    from.habits.toArray(),
    from.templates.toArray(),
    from.recurring.toArray(),
    from.settings.toArray(),
  ]);
  await to.transaction(
    "rw",
    to.days,
    to.habits,
    to.templates,
    to.recurring,
    to.settings,
    async () => {
      if (days.length) await to.days.bulkPut(days);
      if (habits.length) await to.habits.bulkPut(habits);
      if (templates.length) await to.templates.bulkPut(templates);
      if (recurring.length) await to.recurring.bulkPut(recurring);
      if (settings.length) await to.settings.bulkPut(settings);
    },
  );
  if (from !== active) from.close();
  if (to !== active) to.close();
}

/** Wipe a database's contents (used to discard Guest data). */
export async function clearDatabase(name: string): Promise<void> {
  await Dexie.delete(name);
}

/** A fresh, empty workspace for a given day key. */
export function emptyDay(date: string): DayRecord {
  return {
    date,
    tasks: [],
    notes: "",
    focus: [],
    habitLog: {},
    recurringApplied: [],
    review: null,
    updatedAt: Date.now(),
  };
}

/** Read a day, returning an in-memory empty record if none is stored yet. */
export async function getDay(date: string): Promise<DayRecord> {
  const record = await db.days.get(date);
  return record ?? emptyDay(date);
}

/**
 * Read-modify-write a single day inside a transaction so concurrent updates
 * (e.g. toggling a task while notes autosave) never clobber each other.
 */
export async function updateDay(
  date: string,
  mutate: (day: DayRecord) => DayRecord,
): Promise<DayRecord> {
  return db.transaction("rw", db.days, async () => {
    const current = (await db.days.get(date)) ?? emptyDay(date);
    const next = { ...mutate(current), updatedAt: Date.now() };
    await db.days.put(next);
    return next;
  });
}

export async function getDaysInRange(
  fromKey: string,
  toKey: string,
): Promise<DayRecord[]> {
  return db.days.where("date").between(fromKey, toKey, true, true).toArray();
}

/**
 * Ensure the database is seeded (default templates, settings row). Idempotent —
 * safe to call on every app start.
 */
export async function ensureSeeded(): Promise<void> {
  await db.transaction("rw", db.templates, db.settings, async () => {
    const templateCount = await db.templates.count();
    if (templateCount === 0) {
      const now = Date.now();
      await db.templates.bulkAdd(
        DEFAULT_TEMPLATES.map((t, i) => ({
          id: t.seedId,
          name: t.name,
          icon: t.icon,
          items: t.items,
          builtIn: t.builtIn,
          order: i,
          createdAt: now,
        })),
      );
    }

    const settings = await db.settings.get("app");
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }
  });
}

/** Read settings, falling back to defaults if not yet written. */
export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get("app")) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "app" });
}

/** Add a template, auto-assigning the next order weight. */
export async function addTemplate(
  input: Pick<Template, "name" | "icon" | "items">,
): Promise<void> {
  const order = (await db.templates.count()) + 1;
  await db.templates.add({
    id: createId(),
    name: input.name,
    icon: input.icon,
    items: input.items,
    builtIn: false,
    order,
    createdAt: Date.now(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}
