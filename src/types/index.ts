/**
 * Core domain types for Daily OS.
 *
 * The unit of state is a "day" — a self-contained workspace keyed by an
 * ISO date string (yyyy-MM-dd). Global entities (habits, templates, recurring
 * tasks, settings) live in their own tables and project into each day.
 */

export type Priority = "low" | "medium" | "high";

/** How much mental/physical energy a task demands. */
export type EnergyLevel = "low" | "medium" | "high";

/** Rough effort/complexity of a task. */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * The four coarse parts of a day the Planner Engine schedules into.
 * Purely a planning concept — never persisted onto a task.
 */
export type DayPart = "morning" | "afternoon" | "evening" | "night";

export type TaskColor =
  | "burgundy"
  | "amber"
  | "green"
  | "blue"
  | "violet"
  | "slate";

export type RecurrenceRule =
  | "none"
  | "daily"
  | "weekdays"
  | "weekends"
  | "weekly"
  | "monthly";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: string;
  color: TaskColor;
  notes: string;
  /** Recurrence rule for display; "none" for one-off tasks. */
  recurrence: RecurrenceRule;
  /** Links a materialized instance back to its RecurringTask definition. */
  recurringId: string | null;
  /** Absolute reminder time (epoch ms) or null. Phase 2 uses the Notification API. */
  reminderAt: number | null;
  /** Ordering weight within the day; lower renders first. */
  order: number;
  createdAt: number;

  // ─── Smart task metadata (Phase 4, all optional & back-compatible) ───────
  //
  // Every field below is optional so pre-Phase-4 records and older JSON
  // backups load untouched. The Intelligence Engine reads them through
  // defaulting helpers, so a task with none of these still scores and plans.

  /** User's estimated duration in minutes. Engine falls back to a default. */
  estimatedMinutes?: number;
  /** Energy the task demands; feeds the Planner's time-of-day placement. */
  energy?: EnergyLevel;
  /** Effort/complexity; a major input to the calculated priority. */
  difficulty?: Difficulty;
  /** Hard deadline as a day key (yyyy-MM-dd); drives deadline urgency. */
  deadline?: string | null;
  /** Epoch ms the task was completed — the basis for energy/time analysis. */
  completedAt?: number | null;
  /** How many times the task was pushed to a later day. */
  timesDeferred?: number;
  /** How many times its scheduled day changed (deadline/day moves). */
  timesRescheduled?: number;
  /** Links this task to a long-term Mission (Mission Mode). */
  missionId?: string | null;
  /** Links this task to a Workspace (Phase 5). Null = the default workspace. */
  workspaceId?: string | null;
  /** Assigned member's actorId in a shared workspace (Phase 8). Null = unassigned. */
  assigneeId?: string | null;
}

export interface FocusItem {
  id: string;
  title: string;
  done: boolean;
}

/** Reflection captured in the daily review. */
export interface DailyReview {
  wentWell: string;
  slowedDown: string;
  achievement: string;
  improvement: string;
  completedAt: number;
}

/**
 * A single calendar day's complete workspace. `date` is the primary key
 * in the form yyyy-MM-dd so days sort lexicographically.
 */
export interface DayRecord {
  date: string;
  tasks: Task[];
  notes: string;
  focus: FocusItem[];
  /** Per-day habit completion, keyed by habit id. */
  habitLog: Record<string, boolean>;
  /** Recurring-task ids already materialized into this day (idempotency). */
  recurringApplied: string[];
  review: DailyReview | null;
  updatedAt: number;
}

/** Global habit definition. Completion is stored per-day in DayRecord.habitLog. */
export interface HabitDef {
  id: string;
  name: string;
  color: TaskColor;
  order: number;
  createdAt: number;
}

export interface TemplateItem {
  title: string;
  category: string;
  priority: Priority;
  color: TaskColor;
}

export interface Template {
  id: string;
  name: string;
  /** Emoji glyph shown on the chip. */
  icon: string;
  items: TemplateItem[];
  builtIn: boolean;
  order: number;
  createdAt: number;
}

/** Global recurring-task definition; instances are materialized per matching day. */
export interface RecurringTask {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  color: TaskColor;
  notes: string;
  rule: RecurrenceRule;
  createdAt: number;
}

// ─── Mission Mode (Phase 4) ────────────────────────────────────────────────

/** A checkpoint within a mission. Progress is derived from these. */
export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  /** Optional target day key (yyyy-MM-dd). */
  targetDate: string | null;
}

/**
 * A long-term objective ("Crack Placements", "Launch Startup"). Missions live
 * in their own table; tasks link back via `Task.missionId`, so the Planner can
 * recommend daily work toward whatever missions are active. Progress is
 * calculated by the Intelligence Engine, never stored.
 */
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  color: TaskColor;
  /** Emoji glyph shown on the mission card. */
  icon: string;
  /** Day key the mission began. */
  startDate: string;
  /** Optional day key the mission is aiming for. */
  targetDate: string | null;
  milestones: Milestone[];
  /** Ids of habits that support this mission. */
  habitIds: string[];
  /** Owning Workspace (Phase 5). Null = the default workspace. */
  workspaceId?: string | null;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Workspace OS (Phase 5) ─────────────────────────────────────────────────

/**
 * A Workspace is the top-level container that everything else can belong to —
 * a life or work area like "Daily OS", "Placement Prep", "Germany" or "Startup".
 * It owns tasks, missions, notes, journal entries and resources. Filtering is a
 * pure in-memory operation on `workspaceId`, so switching workspaces is instant.
 */
export interface Workspace {
  id: string;
  name: string;
  /** Emoji glyph shown on the workspace chip. */
  icon: string;
  color: TaskColor;
  description: string;
  archived: boolean;
  /** Manual ordering weight; lower renders first. */
  order: number;
  /** True once the workspace has members beyond the local owner (Phase 8). */
  shared?: boolean;
  /** The owning member's actorId (Phase 8). Undefined = the local user owns it. */
  ownerId?: string | null;
  createdAt: number;
  updatedAt: number;
}

/** The block kinds the note editor supports. Deliberately small and robust. */
export type NoteBlockType =
  | "heading"
  | "text"
  | "bullet"
  | "checkbox"
  | "quote"
  | "code";

/**
 * One block in a rich note. A note is an ordered list of these — a lightweight,
 * offline block model (no Markdown parsing, no external editor). `checked` is
 * only meaningful for `checkbox` blocks.
 */
export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  text: string;
  checked?: boolean;
}

/** A rich, autosaving note page that belongs to a workspace. */
export interface WorkspaceNote {
  id: string;
  workspaceId: string;
  title: string;
  blocks: NoteBlock[];
  /** Pinned notes sort to the top of a workspace's note list. */
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

/** The kinds of reference a resource can point at. */
export type ResourceKind =
  | "link"
  | "article"
  | "video"
  | "repo"
  | "pdf"
  | "image"
  | "book";

/**
 * A saved reference inside a workspace's library — a link, article, video,
 * repository, PDF, image (metadata only) or book. Searchable, taggable,
 * pinnable and favouritable.
 */
export interface Resource {
  id: string;
  workspaceId: string;
  kind: ResourceKind;
  title: string;
  /** URL or reference string. Optional for book/image metadata entries. */
  url: string;
  description: string;
  tags: string[];
  category: string;
  pinned: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

/** A coarse mood grade captured in a journal entry. */
export type Mood = "great" | "good" | "okay" | "low" | "rough";

/**
 * A rich journal entry for a single day. Expands the day's free-text notes into
 * structured reflection: mood, highlights, challenges, lessons and a free
 * reflection. Optionally scoped to a workspace; entries feed the Timeline.
 */
export interface JournalEntry {
  id: string;
  /** Day key (yyyy-MM-dd) the entry reflects on. */
  date: string;
  /** Owning workspace, or null for a general life-journal entry. */
  workspaceId: string | null;
  mood: Mood | null;
  highlights: string;
  challenges: string;
  lessons: string;
  reflection: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Collaboration (Phase 8) ────────────────────────────────────────────────
//
// All collaboration is additive and off by default. In personal/offline mode
// these tables simply stay empty and the app behaves exactly as before. A
// workspace only becomes "shared" when it has members beyond the local owner.

/** Workspace member roles, from most to least privileged. */
export type Role = "owner" | "admin" | "editor" | "viewer";

/** Lifecycle of a membership. */
export type MemberStatus = "active" | "invited" | "pending";

/**
 * The local identity of the person using this device. A single "me" row; in
 * shared mode a real provider would map this to an account. Deliberately not
 * tied to any auth vendor — see the AuthProvider abstraction in `src/collab`.
 */
export interface Identity {
  id: "me";
  /** A stable, per-device actor id used for authorship & conflict resolution. */
  actorId: string;
  name: string;
  /** Optional email/handle for display; never used to contact anyone. */
  handle: string;
  createdAt: number;
}

/** A member of a shared workspace. */
export interface Member {
  id: string;
  workspaceId: string;
  /** The member's actor/account id (matches Identity.actorId for the local user). */
  actorId: string;
  name: string;
  role: Role;
  status: MemberStatus;
  /** Opaque invite code for the invited-but-not-joined state. */
  inviteCode: string | null;
  invitedAt: number;
  joinedAt: number | null;
}

/** What a comment is attached to. */
export type CommentTargetType = "task" | "mission" | "workspace" | "journal";

export interface Comment {
  id: string;
  workspaceId: string;
  targetType: CommentTargetType;
  targetId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** Names (@mention) referenced in the body. */
  mentions: string[];
  createdAt: number;
  editedAt: number | null;
}

/** The kinds of event surfaced in a workspace activity feed. */
export type ActivityKind =
  | "created"
  | "completed"
  | "edited"
  | "archived"
  | "invited"
  | "joined"
  | "commented"
  | "assigned"
  | "role-changed";

export interface Activity {
  id: string;
  workspaceId: string;
  kind: ActivityKind;
  actorId: string;
  actorName: string;
  targetType: CommentTargetType | "member";
  targetId: string;
  summary: string;
  createdAt: number;
}

/** A queued mutation in the offline outbox (the sync engine's unit of work). */
export interface Mutation {
  id: string;
  workspaceId: string;
  actorId: string;
  /** Lamport clock for total ordering across actors. */
  lamport: number;
  entity: string;
  op: "create" | "update" | "delete";
  payload: unknown;
  createdAt: number;
  status: "pending" | "synced" | "failed";
}

export type AccentKey =
  | "blossom"
  | "burgundy"
  | "plum"
  | "forest"
  | "indigo"
  | "slate";

export interface AppSettings {
  id: "app";
  accent: AccentKey;
  notificationsEnabled: boolean;
  reviewEnabled: boolean;
  /** Placeholder for a future dark theme. */
  theme: "light";
  /** The workspace currently in focus (Phase 5). Null = default workspace. */
  activeWorkspaceId?: string | null;
  /**
   * Force reduced motion regardless of the OS setting (Phase 6, accessibility).
   * Undefined = follow the operating system's prefers-reduced-motion.
   */
  reducedMotion?: boolean;
}

export type TaskDraft = Pick<
  Task,
  | "title"
  | "priority"
  | "category"
  | "color"
  | "notes"
  | "recurrence"
  | "reminderAt"
  // Smart metadata the composer can optionally set.
  | "estimatedMinutes"
  | "energy"
  | "difficulty"
  | "deadline"
  | "missionId"
  | "workspaceId"
  | "assigneeId"
>;

/** Shape of a full data export / import bundle. */
export interface ExportBundle {
  version: number;
  exportedAt: number;
  days: DayRecord[];
  habits: HabitDef[];
  templates: Template[];
  recurring: RecurringTask[];
  /** Long-term missions (Phase 4). Absent in pre-Phase-4 backups. */
  missions?: Mission[];
  /** Workspace OS entities (Phase 5). Absent in pre-Phase-5 backups. */
  workspaces?: Workspace[];
  notes?: WorkspaceNote[];
  resources?: Resource[];
  journal?: JournalEntry[];
  /** Collaboration entities (Phase 8). Absent in pre-Phase-8 backups. */
  members?: Member[];
  comments?: Comment[];
  activity?: Activity[];
  settings: AppSettings | null;
}
