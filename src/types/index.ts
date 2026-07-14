/**
 * Core domain types for Daily OS.
 *
 * The unit of state is a "day" — a self-contained workspace keyed by an
 * ISO date string (yyyy-MM-dd). Global entities (habits, templates, recurring
 * tasks, settings) live in their own tables and project into each day.
 */

export type Priority = "low" | "medium" | "high";

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
}

export type TaskDraft = Pick<
  Task,
  "title" | "priority" | "category" | "color" | "notes" | "recurrence" | "reminderAt"
>;

/** Shape of a full data export / import bundle. */
export interface ExportBundle {
  version: number;
  exportedAt: number;
  days: DayRecord[];
  habits: HabitDef[];
  templates: Template[];
  recurring: RecurringTask[];
  settings: AppSettings | null;
}
