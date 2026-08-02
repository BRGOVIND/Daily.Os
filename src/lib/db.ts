import Dexie, { type Table } from "dexie";
import type {
  Activity,
  AppSettings,
  Comment,
  DayRecord,
  HabitDef,
  Identity,
  JournalEntry,
  Member,
  Mission,
  Mutation,
  PomodoroSession,
  QuickNote,
  RecurringTask,
  Resource,
  StickyNote,
  Task,
  Template,
  UtilityRecord,
  Workspace,
  WorkspaceNote,
} from "@/types";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TEMPLATES,
  DEFAULT_WORKSPACE_ID,
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
  missions!: Table<Mission, string>;
  workspaces!: Table<Workspace, string>;
  notes!: Table<WorkspaceNote, string>;
  resources!: Table<Resource, string>;
  journal!: Table<JournalEntry, string>;
  identity!: Table<Identity, string>;
  members!: Table<Member, string>;
  comments!: Table<Comment, string>;
  activity!: Table<Activity, string>;
  outbox!: Table<Mutation, string>;
  quickNotes!: Table<QuickNote, string>;
  stickyNotes!: Table<StickyNote, string>;
  pomodoroSessions!: Table<PomodoroSession, string>;
  utilities!: Table<UtilityRecord, string>;

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

    // v3 — Intelligence Engine: a missions table + smart-task backfill. Every
    // new task field is optional, but backfilling normalizes older rows so the
    // engine never has to special-case pre-Phase-4 data.
    this.version(3)
      .stores({
        days: "date, updatedAt",
        habits: "id, order",
        templates: "id, order",
        recurring: "id, createdAt",
        settings: "id",
        missions: "id, createdAt, archived",
      })
      .upgrade(async (tx) => {
        await tx
          .table<DayRecord>("days")
          .toCollection()
          .modify((d) => {
            d.tasks = (d.tasks ?? []).map((t) => backfillTask(t, d.updatedAt));
          });
      });

    // v4 — Workspace OS: four new container tables. Everything else is
    // untouched; existing tasks/missions simply keep a null workspaceId (i.e.
    // "the default workspace"), which the default workspace is seeded to own.
    this.version(4).stores({
      days: "date, updatedAt",
      habits: "id, order",
      templates: "id, order",
      recurring: "id, createdAt",
      settings: "id",
      missions: "id, createdAt, archived",
      workspaces: "id, order, archived, createdAt",
      notes: "id, workspaceId, updatedAt",
      resources: "id, workspaceId, kind, createdAt",
      journal: "id, date, workspaceId",
    });

    // v5 — Collaboration: identity + members/comments/activity + the offline
    // sync outbox. All additive; personal mode leaves them empty and unchanged.
    this.version(5).stores({
      days: "date, updatedAt",
      habits: "id, order",
      templates: "id, order",
      recurring: "id, createdAt",
      settings: "id",
      missions: "id, createdAt, archived",
      workspaces: "id, order, archived, createdAt",
      notes: "id, workspaceId, updatedAt",
      resources: "id, workspaceId, kind, createdAt",
      journal: "id, date, workspaceId",
      identity: "id",
      members: "id, workspaceId, actorId",
      comments: "id, workspaceId, [targetType+targetId], createdAt",
      activity: "id, workspaceId, createdAt",
      outbox: "id, workspaceId, status, lamport",
    });

    // v6 — Daily productivity: quick notes, sticky notes, Pomodoro history and
    // a generic per-tool utility store. All additive; nothing existing changes.
    this.version(6).stores({
      days: "date, updatedAt",
      habits: "id, order",
      templates: "id, order",
      recurring: "id, createdAt",
      settings: "id",
      missions: "id, createdAt, archived",
      workspaces: "id, order, archived, createdAt",
      notes: "id, workspaceId, updatedAt",
      resources: "id, workspaceId, kind, createdAt",
      journal: "id, date, workspaceId",
      identity: "id",
      members: "id, workspaceId, actorId",
      comments: "id, workspaceId, [targetType+targetId], createdAt",
      activity: "id, workspaceId, createdAt",
      outbox: "id, workspaceId, status, lamport",
      quickNotes: "id, date, pinned, updatedAt",
      stickyNotes: "id, updatedAt",
      pomodoroSessions: "id, date, startedAt",
      utilities: "id, updatedAt",
    });
  }
}

/**
 * Normalize a pre-Phase-4 task to the smart-task shape without inventing data:
 * counters start at 0, a task already marked complete gets a best-effort
 * completion timestamp so energy/time analysis has something to work with.
 */
function backfillTask(task: Task, fallbackCompletedAt: number): Task {
  return {
    ...task,
    deadline: task.deadline ?? null,
    completedAt:
      task.completedAt ??
      (task.completed ? fallbackCompletedAt : null),
    timesDeferred: task.timesDeferred ?? 0,
    timesRescheduled: task.timesRescheduled ?? 0,
    missionId: task.missionId ?? null,
  };
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
    from.days.toArray(),
    from.habits.toArray(),
    from.templates.toArray(),
    from.recurring.toArray(),
    from.settings.toArray(),
    from.missions.toArray(),
    from.workspaces.toArray(),
    from.notes.toArray(),
    from.resources.toArray(),
    from.journal.toArray(),
  ]);
  const [members, comments, activity] = await Promise.all([
    from.members.toArray(),
    from.comments.toArray(),
    from.activity.toArray(),
  ]);
  await to.transaction(
    "rw",
    // Array form: Dexie's typed overloads only reach 5 tables inline.
    [
      to.days,
      to.habits,
      to.templates,
      to.recurring,
      to.settings,
      to.missions,
      to.workspaces,
      to.notes,
      to.resources,
      to.journal,
      to.members,
      to.comments,
      to.activity,
    ],
    async () => {
      if (days.length) await to.days.bulkPut(days);
      if (habits.length) await to.habits.bulkPut(habits);
      if (templates.length) await to.templates.bulkPut(templates);
      if (recurring.length) await to.recurring.bulkPut(recurring);
      if (settings.length) await to.settings.bulkPut(settings);
      if (missions.length) await to.missions.bulkPut(missions);
      if (workspaces.length) await to.workspaces.bulkPut(workspaces);
      if (notes.length) await to.notes.bulkPut(notes);
      if (resources.length) await to.resources.bulkPut(resources);
      if (journal.length) await to.journal.bulkPut(journal);
      if (members.length) await to.members.bulkPut(members);
      if (comments.length) await to.comments.bulkPut(comments);
      if (activity.length) await to.activity.bulkPut(activity);
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
  await db.transaction(
    "rw",
    [db.templates, db.settings, db.workspaces, db.identity],
    async () => {
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

      // Seed the default "Daily OS" workspace so pre-Phase-5 data (all null
      // workspaceId) has a home the moment Workspace OS turns on.
      const workspaceCount = await db.workspaces.count();
      if (workspaceCount === 0) {
        const now = Date.now();
        await db.workspaces.add({
          id: DEFAULT_WORKSPACE_ID,
          name: "Daily OS",
          icon: "🗂️",
          color: "burgundy",
          description: "Your everyday planning space.",
          archived: false,
          order: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Seed the local identity (the "me" actor) used for authorship & sync.
      const identity = await db.identity.get("me");
      if (!identity) {
        const now = Date.now();
        await db.identity.put({
          id: "me",
          actorId: createId(),
          name: "You",
          handle: "",
          createdAt: now,
        });
      }
    },
  );
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

// ─── Missions (Phase 4) ─────────────────────────────────────────────────────

/** Fields a mission needs at creation; the rest are defaulted here. */
export type MissionInput = Pick<
  Mission,
  "title" | "description" | "category" | "color" | "icon" | "startDate"
> &
  Partial<Pick<Mission, "targetDate" | "milestones" | "habitIds">>;

/** Create a mission, filling in defaults and timestamps. */
export async function addMission(input: MissionInput): Promise<string> {
  const now = Date.now();
  const mission: Mission = {
    id: createId(),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    color: input.color,
    icon: input.icon,
    startDate: input.startDate,
    targetDate: input.targetDate ?? null,
    milestones: input.milestones ?? [],
    habitIds: input.habitIds ?? [],
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.missions.add(mission);
  return mission.id;
}

/** Patch a mission, bumping its updatedAt stamp. */
export async function updateMission(
  id: string,
  patch: Partial<Omit<Mission, "id" | "createdAt">>,
): Promise<void> {
  const current = await db.missions.get(id);
  if (!current) return;
  await db.missions.put({ ...current, ...patch, id, updatedAt: Date.now() });
}

/** Delete a mission and detach any tasks that pointed at it. */
export async function deleteMission(id: string): Promise<void> {
  await db.transaction("rw", db.missions, db.days, async () => {
    await db.missions.delete(id);
    await db.days
      .toCollection()
      .modify((d) => {
        let changed = false;
        const tasks = d.tasks.map((t) => {
          if (t.missionId === id) {
            changed = true;
            return { ...t, missionId: null };
          }
          return t;
        });
        if (changed) d.tasks = tasks;
      });
  });
}

// ─── Workspaces (Phase 5) ────────────────────────────────────────────────────

export type WorkspaceInput = Pick<
  Workspace,
  "name" | "icon" | "color" | "description"
>;

/** Create a workspace, auto-assigning the next order weight. */
export async function addWorkspace(input: WorkspaceInput): Promise<string> {
  const now = Date.now();
  const order = (await db.workspaces.count()) + 1;
  const workspace: Workspace = {
    id: createId(),
    name: input.name.trim(),
    icon: input.icon,
    color: input.color,
    description: input.description.trim(),
    archived: false,
    order,
    createdAt: now,
    updatedAt: now,
  };
  await db.workspaces.add(workspace);
  return workspace.id;
}

export async function updateWorkspace(
  id: string,
  patch: Partial<Omit<Workspace, "id" | "createdAt">>,
): Promise<void> {
  const current = await db.workspaces.get(id);
  if (!current) return;
  await db.workspaces.put({ ...current, ...patch, id, updatedAt: Date.now() });
}

/**
 * Delete a workspace and everything it owns: its notes, resources and journal
 * entries, and detach (never delete) its tasks and missions so day data is
 * never silently lost.
 */
export async function deleteWorkspace(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.workspaces, db.notes, db.resources, db.journal, db.missions, db.days],
    async () => {
      await db.workspaces.delete(id);
      await db.notes.where("workspaceId").equals(id).delete();
      await db.resources.where("workspaceId").equals(id).delete();
      await db.journal.where("workspaceId").equals(id).delete();
      // missions don't index workspaceId — modify over the collection instead.
      await db.missions.toCollection().modify((m) => {
        if (m.workspaceId === id) m.workspaceId = null;
      });
      await db.days.toCollection().modify((d) => {
        let changed = false;
        const tasks = d.tasks.map((t) => {
          if (t.workspaceId === id) {
            changed = true;
            return { ...t, workspaceId: null };
          }
          return t;
        });
        if (changed) d.tasks = tasks;
      });
    },
  );
}

// ─── Notes (Phase 5) ─────────────────────────────────────────────────────────

/** Create an empty note in a workspace and return its id. */
export async function addNote(
  workspaceId: string,
  title = "Untitled note",
): Promise<string> {
  const now = Date.now();
  const note: WorkspaceNote = {
    id: createId(),
    workspaceId,
    title,
    blocks: [{ id: createId(), type: "text", text: "" }],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  return note.id;
}

export async function updateNote(
  id: string,
  patch: Partial<Omit<WorkspaceNote, "id" | "workspaceId" | "createdAt">>,
): Promise<void> {
  const current = await db.notes.get(id);
  if (!current) return;
  await db.notes.put({ ...current, ...patch, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

// ─── Resources (Phase 5) ─────────────────────────────────────────────────────

export type ResourceInput = Pick<
  Resource,
  "workspaceId" | "kind" | "title" | "url" | "description" | "tags" | "category"
>;

export async function addResource(input: ResourceInput): Promise<string> {
  const now = Date.now();
  const resource: Resource = {
    id: createId(),
    workspaceId: input.workspaceId,
    kind: input.kind,
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description.trim(),
    tags: input.tags,
    category: input.category,
    pinned: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.resources.add(resource);
  return resource.id;
}

export async function updateResource(
  id: string,
  patch: Partial<Omit<Resource, "id" | "createdAt">>,
): Promise<void> {
  const current = await db.resources.get(id);
  if (!current) return;
  await db.resources.put({ ...current, ...patch, id, updatedAt: Date.now() });
}

export async function deleteResource(id: string): Promise<void> {
  await db.resources.delete(id);
}

// ─── Journal (Phase 5) ───────────────────────────────────────────────────────

export type JournalInput = Pick<
  JournalEntry,
  | "date"
  | "workspaceId"
  | "mood"
  | "highlights"
  | "challenges"
  | "lessons"
  | "reflection"
>;

/**
 * Create or update the journal entry for a (date, workspace) pair. There is at
 * most one entry per day per workspace, so this upserts rather than duplicates.
 */
export async function upsertJournal(input: JournalInput): Promise<string> {
  return db.transaction("rw", db.journal, async () => {
    const existing = await db.journal
      .where("date")
      .equals(input.date)
      .filter((e) => (e.workspaceId ?? null) === (input.workspaceId ?? null))
      .first();
    const now = Date.now();
    if (existing) {
      await db.journal.put({ ...existing, ...input, updatedAt: now });
      return existing.id;
    }
    const entry: JournalEntry = {
      id: createId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await db.journal.add(entry);
    return entry.id;
  });
}

export async function deleteJournal(id: string): Promise<void> {
  await db.journal.delete(id);
}

// ─── Collaboration (Phase 8) ────────────────────────────────────────────────

/** Read the local identity, creating it on demand (idempotent). */
export async function getIdentity(): Promise<Identity> {
  const existing = await db.identity.get("me");
  if (existing) return existing;
  const identity: Identity = {
    id: "me",
    actorId: createId(),
    name: "You",
    handle: "",
    createdAt: Date.now(),
  };
  await db.identity.put(identity);
  return identity;
}

export async function renameIdentity(name: string, handle: string): Promise<void> {
  const current = await getIdentity();
  await db.identity.put({ ...current, name: name.trim() || current.name, handle: handle.trim() });
}

export type MemberInput = Pick<Member, "workspaceId" | "actorId" | "name" | "role" | "status"> &
  Partial<Pick<Member, "inviteCode">>;

export async function addMember(input: MemberInput): Promise<string> {
  const now = Date.now();
  const member: Member = {
    id: createId(),
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    name: input.name.trim(),
    role: input.role,
    status: input.status,
    inviteCode: input.inviteCode ?? null,
    invitedAt: now,
    joinedAt: input.status === "active" ? now : null,
  };
  await db.members.add(member);
  // A workspace with >1 member is "shared".
  await markWorkspaceShared(input.workspaceId);
  return member.id;
}

export async function updateMember(
  id: string,
  patch: Partial<Omit<Member, "id" | "workspaceId">>,
): Promise<void> {
  const current = await db.members.get(id);
  if (!current) return;
  await db.members.put({ ...current, ...patch, id });
}

export async function removeMember(id: string): Promise<void> {
  const member = await db.members.get(id);
  await db.members.delete(id);
  if (member) await markWorkspaceShared(member.workspaceId);
}

/** Recompute a workspace's `shared` flag from its member count (>1 = shared). */
export async function markWorkspaceShared(workspaceId: string): Promise<void> {
  const count = await db.members.where("workspaceId").equals(workspaceId).count();
  const ws = await db.workspaces.get(workspaceId);
  if (ws) await db.workspaces.put({ ...ws, shared: count > 1, updatedAt: Date.now() });
}

export type CommentInput = Pick<
  Comment,
  "workspaceId" | "targetType" | "targetId" | "authorId" | "authorName" | "body" | "mentions"
>;

export async function addComment(input: CommentInput): Promise<string> {
  const comment: Comment = {
    id: createId(),
    ...input,
    createdAt: Date.now(),
    editedAt: null,
  };
  await db.comments.add(comment);
  return comment.id;
}

export async function deleteComment(id: string): Promise<void> {
  await db.comments.delete(id);
}

export type ActivityInput = Pick<
  Activity,
  "workspaceId" | "kind" | "actorId" | "actorName" | "targetType" | "targetId" | "summary"
>;

export async function addActivity(input: ActivityInput): Promise<void> {
  await db.activity.add({ id: createId(), ...input, createdAt: Date.now() });
}

/** Enqueue a mutation in the offline outbox (the sync engine's unit of work). */
export async function enqueueMutation(
  m: Omit<Mutation, "id" | "createdAt" | "status">,
): Promise<void> {
  await db.outbox.add({ id: createId(), ...m, createdAt: Date.now(), status: "pending" });
}

// ─── Quick Notes (Phase 9) ───────────────────────────────────────────────────

/** Create a quick note for a day and return its id. */
export async function addQuickNote(
  date: string,
  body = "",
  color: QuickNote["color"] = "yellow",
): Promise<string> {
  const now = Date.now();
  const note: QuickNote = {
    id: createId(),
    body,
    date,
    pinned: false,
    color,
    createdAt: now,
    updatedAt: now,
  };
  await db.quickNotes.add(note);
  return note.id;
}

export async function updateQuickNote(
  id: string,
  patch: Partial<Omit<QuickNote, "id" | "createdAt">>,
): Promise<void> {
  const current = await db.quickNotes.get(id);
  if (!current) return;
  await db.quickNotes.put({ ...current, ...patch, id, updatedAt: Date.now() });
}

/** Toggle a note between day-scoped and pinned-global. */
export async function toggleQuickNotePinned(id: string): Promise<void> {
  const current = await db.quickNotes.get(id);
  if (!current) return;
  await db.quickNotes.put({
    ...current,
    pinned: !current.pinned,
    updatedAt: Date.now(),
  });
}

export async function deleteQuickNote(id: string): Promise<void> {
  await db.quickNotes.delete(id);
}

// ─── Sticky Notes (Phase 9) ──────────────────────────────────────────────────

const STICKY_PALETTE: StickyNote["color"][] = [
  "yellow",
  "pink",
  "blue",
  "green",
  "purple",
  "gray",
];

/** Create a sticky note, cascading its position so new ones don't stack exactly. */
export async function addStickyNote(): Promise<string> {
  const now = Date.now();
  const count = await db.stickyNotes.count();
  const step = (count % 6) * 26;
  const note: StickyNote = {
    id: createId(),
    body: "",
    color: STICKY_PALETTE[count % STICKY_PALETTE.length],
    x: 24 + step,
    y: 24 + step,
    width: 216,
    height: 200,
    collapsed: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.stickyNotes.add(note);
  return note.id;
}

export async function updateStickyNote(
  id: string,
  patch: Partial<Omit<StickyNote, "id" | "createdAt">>,
): Promise<void> {
  const current = await db.stickyNotes.get(id);
  if (!current) return;
  await db.stickyNotes.put({ ...current, ...patch, id, updatedAt: Date.now() });
}

export async function deleteStickyNote(id: string): Promise<void> {
  await db.stickyNotes.delete(id);
}

// ─── Pomodoro history (Phase 9) ──────────────────────────────────────────────

/** Record a finished (or skipped) Pomodoro interval. */
export async function recordPomodoroSession(
  session: Omit<PomodoroSession, "id">,
): Promise<void> {
  await db.pomodoroSessions.add({ id: createId(), ...session });
}

/** Read every session that started on a given day key. */
export async function getPomodoroSessionsForDay(
  date: string,
): Promise<PomodoroSession[]> {
  return db.pomodoroSessions.where("date").equals(date).sortBy("startedAt");
}

// ─── Utilities store (Phase 9) ───────────────────────────────────────────────

/** Read a utility's persisted blob, or null if it has none yet. */
export async function getUtility<T>(id: string): Promise<T | null> {
  const row = await db.utilities.get(id);
  return row ? (row.data as T) : null;
}

/** Persist a utility's blob (upsert). */
export async function saveUtility(id: string, data: unknown): Promise<void> {
  await db.utilities.put({ id, data, updatedAt: Date.now() });
}
