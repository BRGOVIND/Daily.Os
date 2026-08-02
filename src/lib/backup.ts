import { db, saveSettings } from "@/lib/db";
import { DB_VERSION } from "@/lib/constants";
import { belongsTo } from "@/workspace";
import type {
  Activity,
  AppSettings,
  Comment,
  DayRecord,
  ExportBundle,
  HabitDef,
  JournalEntry,
  Member,
  Mission,
  RecurringTask,
  Resource,
  Template,
  Workspace,
  WorkspaceNote,
} from "@/types";

/** Serialize the entire local database into a portable JSON bundle. */
export async function exportAll(): Promise<ExportBundle> {
  const [
    days,
    habits,
    templates,
    recurring,
    settings,
    missions,
    workspaces,
    notes,
    resources,
    journal,
  ] = await Promise.all([
    db.days.toArray(),
    db.habits.toArray(),
    db.templates.toArray(),
    db.recurring.toArray(),
    db.settings.get("app"),
    db.missions.toArray(),
    db.workspaces.toArray(),
    db.notes.toArray(),
    db.resources.toArray(),
    db.journal.toArray(),
  ]);
  const [members, comments, activity] = await Promise.all([
    db.members.toArray(),
    db.comments.toArray(),
    db.activity.toArray(),
  ]);

  return {
    version: DB_VERSION,
    exportedAt: Date.now(),
    days,
    habits,
    templates,
    recurring,
    missions,
    workspaces,
    notes,
    resources,
    journal,
    members,
    comments,
    activity,
    settings: settings ?? null,
  };
}

/** Trigger a browser download of the export bundle. `label` names the scope. */
export function downloadExport(bundle: ExportBundle, label = "backup"): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const day = new Date(bundle.exportedAt).toISOString().slice(0, 10);
  a.download = `daily-os-${label}-${day}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export class ImportError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Validate a parsed bundle's shape before we trust it. Throws on invalid data. */
export function validateBundle(data: unknown): ExportBundle {
  if (!isRecord(data)) throw new ImportError("File is not a valid backup.");
  const arrays: (keyof ExportBundle)[] = [
    "days",
    "habits",
    "templates",
    "recurring",
  ];
  for (const key of arrays) {
    if (!Array.isArray(data[key])) {
      throw new ImportError(`Backup is missing the "${key}" section.`);
    }
  }

  // Spot-check the shape of a day record if present.
  const days = data.days as unknown[];
  if (days.length > 0) {
    const sample = days[0];
    if (!isRecord(sample) || typeof sample.date !== "string" || !Array.isArray(sample.tasks)) {
      throw new ImportError("Backup contains malformed day records.");
    }
  }

  return {
    version: typeof data.version === "number" ? data.version : DB_VERSION,
    exportedAt: typeof data.exportedAt === "number" ? data.exportedAt : Date.now(),
    days: data.days as DayRecord[],
    habits: data.habits as HabitDef[],
    templates: data.templates as Template[],
    recurring: data.recurring as RecurringTask[],
    // Missions were introduced in Phase 4 — tolerate their absence in
    // older backups by defaulting to an empty list.
    missions: Array.isArray(data.missions) ? (data.missions as Mission[]) : [],
    // Workspace OS (Phase 5) entities — likewise optional in older bundles.
    workspaces: Array.isArray(data.workspaces)
      ? (data.workspaces as Workspace[])
      : [],
    notes: Array.isArray(data.notes) ? (data.notes as WorkspaceNote[]) : [],
    resources: Array.isArray(data.resources)
      ? (data.resources as Resource[])
      : [],
    journal: Array.isArray(data.journal)
      ? (data.journal as JournalEntry[])
      : [],
    // Collaboration (Phase 8) — optional in older bundles.
    members: Array.isArray(data.members) ? (data.members as Member[]) : [],
    comments: Array.isArray(data.comments) ? (data.comments as Comment[]) : [],
    activity: Array.isArray(data.activity) ? (data.activity as Activity[]) : [],
    settings: (isRecord(data.settings) ? data.settings : null) as AppSettings | null,
  };
}

/** Replace all local data with a validated bundle. */
export async function importAll(bundle: ExportBundle): Promise<void> {
  await db.transaction(
    "rw",
    // Array form: Dexie's typed overloads only reach 5 tables inline.
    [
      db.days,
      db.habits,
      db.templates,
      db.recurring,
      db.settings,
      db.missions,
      db.workspaces,
      db.notes,
      db.resources,
      db.journal,
      db.members,
      db.comments,
      db.activity,
    ],
    async () => {
      await Promise.all([
        db.days.clear(),
        db.habits.clear(),
        db.templates.clear(),
        db.recurring.clear(),
        db.missions.clear(),
        db.workspaces.clear(),
        db.notes.clear(),
        db.resources.clear(),
        db.journal.clear(),
        db.members.clear(),
        db.comments.clear(),
        db.activity.clear(),
      ]);
      await db.days.bulkPut(bundle.days);
      await db.habits.bulkPut(bundle.habits);
      await db.templates.bulkPut(bundle.templates);
      await db.recurring.bulkPut(bundle.recurring);
      if (bundle.missions?.length) await db.missions.bulkPut(bundle.missions);
      if (bundle.workspaces?.length)
        await db.workspaces.bulkPut(bundle.workspaces);
      if (bundle.notes?.length) await db.notes.bulkPut(bundle.notes);
      if (bundle.resources?.length)
        await db.resources.bulkPut(bundle.resources);
      if (bundle.journal?.length) await db.journal.bulkPut(bundle.journal);
      if (bundle.members?.length) await db.members.bulkPut(bundle.members);
      if (bundle.comments?.length) await db.comments.bulkPut(bundle.comments);
      if (bundle.activity?.length) await db.activity.bulkPut(bundle.activity);
    },
  );

  if (bundle.settings) {
    const {
      accent,
      notificationsEnabled,
      reviewEnabled,
      theme,
      activeWorkspaceId,
      reducedMotion,
    } = bundle.settings;
    await saveSettings({
      accent,
      notificationsEnabled,
      reviewEnabled,
      theme,
      activeWorkspaceId: activeWorkspaceId ?? null,
      reducedMotion: reducedMotion ?? false,
    });
  }
}

/** Read a File as parsed, validated bundle. */
export async function readBundleFile(file: File): Promise<ExportBundle> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new ImportError("Could not parse the file as JSON.");
  }
  return validateBundle(parsed);
}

// ─── Counts, scoped exports, conflicts & merge (Phase 6) ─────────────────────

export interface BundleSummary {
  days: number;
  tasks: number;
  habits: number;
  templates: number;
  recurring: number;
  missions: number;
  workspaces: number;
  notes: number;
  resources: number;
  journal: number;
}

/** Human-countable summary of what a bundle contains. */
export function describeBundle(b: ExportBundle): BundleSummary {
  return {
    days: b.days.length,
    tasks: b.days.reduce((n, d) => n + d.tasks.length, 0),
    habits: b.habits.length,
    templates: b.templates.length,
    recurring: b.recurring.length,
    missions: b.missions?.length ?? 0,
    workspaces: b.workspaces?.length ?? 0,
    notes: b.notes?.length ?? 0,
    resources: b.resources?.length ?? 0,
    journal: b.journal?.length ?? 0,
  };
}

/**
 * Narrow a full bundle to a single workspace: its record, missions, notes,
 * resources and journal, plus days carrying only that workspace's tasks (days
 * with none are dropped). Day-level notes/focus/habits are preserved as context.
 */
export function scopeBundleToWorkspace(
  full: ExportBundle,
  workspaceId: string,
): ExportBundle {
  const days = full.days
    .map((d) => ({ ...d, tasks: d.tasks.filter((t) => belongsTo(t.workspaceId, workspaceId)) }))
    .filter((d) => d.tasks.length > 0);
  return {
    ...full,
    days,
    habits: [],
    templates: [],
    recurring: [],
    missions: (full.missions ?? []).filter((m) => belongsTo(m.workspaceId, workspaceId)),
    workspaces: (full.workspaces ?? []).filter((w) => w.id === workspaceId),
    notes: (full.notes ?? []).filter((n) => belongsTo(n.workspaceId, workspaceId)),
    resources: (full.resources ?? []).filter((r) => belongsTo(r.workspaceId, workspaceId)),
    journal: (full.journal ?? []).filter((e) => belongsTo(e.workspaceId, workspaceId)),
    settings: null,
  };
}

/** A bundle of only missions (with an empty scaffold for everything else). */
export function missionsOnlyBundle(full: ExportBundle): ExportBundle {
  return { ...full, days: [], habits: [], templates: [], recurring: [], workspaces: [], notes: [], resources: [], journal: [], settings: null };
}

/** A bundle of only journal entries. */
export function journalOnlyBundle(full: ExportBundle): ExportBundle {
  return { ...full, days: [], habits: [], templates: [], recurring: [], missions: [], workspaces: [], notes: [], resources: [], settings: null };
}

export type ImportMode = "replace" | "merge";

export interface ImportConflicts {
  days: number;
  missions: number;
  workspaces: number;
  notes: number;
  resources: number;
  journal: number;
}

/** Count how many incoming records already exist locally (by primary key). */
export async function detectConflicts(bundle: ExportBundle): Promise<ImportConflicts> {
  const has = async <T>(
    table: { get: (key: string) => Promise<T | undefined> },
    keys: string[],
  ): Promise<number> => {
    let n = 0;
    for (const k of keys) if (await table.get(k)) n += 1;
    return n;
  };
  return {
    days: await has(db.days, bundle.days.map((d) => d.date)),
    missions: await has(db.missions, (bundle.missions ?? []).map((m) => m.id)),
    workspaces: await has(db.workspaces, (bundle.workspaces ?? []).map((w) => w.id)),
    notes: await has(db.notes, (bundle.notes ?? []).map((n) => n.id)),
    resources: await has(db.resources, (bundle.resources ?? []).map((r) => r.id)),
    journal: await has(db.journal, (bundle.journal ?? []).map((e) => e.id)),
  };
}

export interface ImportResult {
  mode: ImportMode;
  summary: BundleSummary;
}

/** Union two task lists by id, keeping the incoming version on conflict. */
function mergeTasks(existing: DayRecord["tasks"], incoming: DayRecord["tasks"]): DayRecord["tasks"] {
  const byId = new Map(existing.map((t) => [t.id, t] as const));
  for (const t of incoming) byId.set(t.id, t);
  return [...byId.values()];
}

/**
 * Import a bundle either by fully replacing local data or merging it in.
 * Merge upserts by primary key (days by date with task-union), so an import can
 * restore a single workspace or mission set without wiping everything else.
 */
export async function importBundle(
  bundle: ExportBundle,
  mode: ImportMode = "replace",
): Promise<ImportResult> {
  if (mode === "replace") {
    await importAll(bundle);
    return { mode, summary: describeBundle(bundle) };
  }

  await db.transaction(
    "rw",
    [db.days, db.habits, db.templates, db.recurring, db.missions, db.workspaces, db.notes, db.resources, db.journal, db.members, db.comments, db.activity],
    async () => {
      // Days: merge task lists so we never drop tasks already on a date.
      for (const incoming of bundle.days) {
        const existing = await db.days.get(incoming.date);
        if (!existing) {
          await db.days.put(incoming);
        } else {
          await db.days.put({
            ...existing,
            tasks: mergeTasks(existing.tasks, incoming.tasks),
            notes: existing.notes || incoming.notes,
            focus: existing.focus.length ? existing.focus : incoming.focus,
            habitLog: { ...incoming.habitLog, ...existing.habitLog },
            recurringApplied: [...new Set([...existing.recurringApplied, ...incoming.recurringApplied])],
            review: existing.review ?? incoming.review,
            updatedAt: Date.now(),
          });
        }
      }
      // Everything else: id-keyed upsert (incoming wins on conflict).
      if (bundle.habits.length) await db.habits.bulkPut(bundle.habits);
      if (bundle.templates.length) await db.templates.bulkPut(bundle.templates);
      if (bundle.recurring.length) await db.recurring.bulkPut(bundle.recurring);
      if (bundle.missions?.length) await db.missions.bulkPut(bundle.missions);
      if (bundle.workspaces?.length) await db.workspaces.bulkPut(bundle.workspaces);
      if (bundle.notes?.length) await db.notes.bulkPut(bundle.notes);
      if (bundle.resources?.length) await db.resources.bulkPut(bundle.resources);
      if (bundle.journal?.length) await db.journal.bulkPut(bundle.journal);
      if (bundle.members?.length) await db.members.bulkPut(bundle.members);
      if (bundle.comments?.length) await db.comments.bulkPut(bundle.comments);
      if (bundle.activity?.length) await db.activity.bulkPut(bundle.activity);
    },
  );
  return { mode, summary: describeBundle(bundle) };
}
