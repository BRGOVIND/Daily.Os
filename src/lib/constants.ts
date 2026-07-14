import type {
  AccentKey,
  Priority,
  RecurrenceRule,
  TaskColor,
  Template,
} from "@/types";

export const APP_NAME = "Daily OS";
export const MAX_FOCUS_ITEMS = 3;
export const DB_VERSION = 2;

/** Date-key format used for the Dexie primary key and all lookups. */
export const DATE_KEY_FORMAT = "yyyy-MM-dd";

interface ColorSwatch {
  key: TaskColor;
  label: string;
  dot: string;
  soft: string;
  text: string;
}

export const TASK_COLORS: ColorSwatch[] = [
  { key: "burgundy", label: "Burgundy", dot: "#8C1232", soft: "#F7E9ED", text: "#8C1232" },
  { key: "amber", label: "Amber", dot: "#F0B429", soft: "#FBF1DA", text: "#8A6100" },
  { key: "green", label: "Green", dot: "#3FA66B", soft: "#E4F4EB", text: "#256b45" },
  { key: "blue", label: "Blue", dot: "#3B82C4", soft: "#E4EEF8", text: "#1f537f" },
  { key: "violet", label: "Violet", dot: "#7C5CBF", soft: "#EDE8F7", text: "#4f3a86" },
  { key: "slate", label: "Slate", dot: "#666666", soft: "#EFEFEF", text: "#444444" },
];

export const COLOR_MAP: Record<TaskColor, ColorSwatch> = TASK_COLORS.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<TaskColor, ColorSwatch>,
);

export const PRIORITIES: { key: Priority; label: string; weight: number }[] = [
  { key: "high", label: "High", weight: 0 },
  { key: "medium", label: "Medium", weight: 1 },
  { key: "low", label: "Low", weight: 2 },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const CATEGORIES: string[] = [
  "Personal",
  "Work",
  "Health",
  "Learning",
  "Errands",
  "Ideas",
];

export const RECURRENCE_OPTIONS: { key: RecurrenceRule; label: string }[] = [
  { key: "none", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekdays", label: "Weekdays" },
  { key: "weekends", label: "Weekends" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export const RECURRENCE_LABEL: Record<RecurrenceRule, string> =
  RECURRENCE_OPTIONS.reduce(
    (acc, o) => ({ ...acc, [o.key]: o.label }),
    {} as Record<RecurrenceRule, string>,
  );

/** Reminder quick-picks. `offset` is minutes from now; `time` opens a picker. */
export type ReminderOption =
  | { key: string; label: string; kind: "none" }
  | { key: string; label: string; kind: "offset"; minutes: number }
  | { key: string; label: string; kind: "time" };

export const REMINDER_OPTIONS: ReminderOption[] = [
  { key: "none", label: "None", kind: "none" },
  { key: "5", label: "In 5 min", kind: "offset", minutes: 5 },
  { key: "15", label: "In 15 min", kind: "offset", minutes: 15 },
  { key: "30", label: "In 30 min", kind: "offset", minutes: 30 },
  { key: "60", label: "In 1 hour", kind: "offset", minutes: 60 },
  { key: "time", label: "At time…", kind: "time" },
];

/** Accent presets stored as space-separated RGB channels for Tailwind alpha. */
export const ACCENTS: Record<
  AccentKey,
  { label: string; base: string; hover: string; hex: string }
> = {
  blossom: { label: "Blossom", base: "193 62 107", hover: "209 84 126", hex: "#C13E6B" },
  burgundy: { label: "Burgundy", base: "140 18 50", hover: "166 27 69", hex: "#8C1232" },
  plum: { label: "Plum", base: "111 45 92", hover: "134 58 112", hex: "#6F2D5C" },
  forest: { label: "Forest", base: "31 104 74", hover: "40 128 92", hex: "#1F684A" },
  indigo: { label: "Indigo", base: "62 68 148", hover: "80 88 178", hex: "#3E4494" },
  slate: { label: "Slate", base: "58 63 74", hover: "78 84 98", hex: "#3A3F4A" },
};

export const DEFAULT_SETTINGS = {
  id: "app" as const,
  accent: "blossom" as AccentKey,
  notificationsEnabled: false,
  reviewEnabled: true,
  theme: "light" as const,
};

/** The hour (24h) at which the daily review prompt appears. */
export const REVIEW_HOUR = 22;

type SeedTemplate = Omit<Template, "id" | "createdAt" | "order"> & {
  seedId: string;
};

/** Built-in templates seeded on first run. */
export const DEFAULT_TEMPLATES: SeedTemplate[] = [
  {
    seedId: "tpl-placement",
    name: "Placement Prep",
    icon: "🎯",
    builtIn: true,
    items: [
      { title: "Solve 2 Leetcode", category: "Learning", priority: "high", color: "burgundy" },
      { title: "Java Practice", category: "Learning", priority: "medium", color: "amber" },
      { title: "Revise DBMS", category: "Learning", priority: "medium", color: "blue" },
      { title: "Apply to one company", category: "Work", priority: "high", color: "green" },
    ],
  },
  {
    seedId: "tpl-coding",
    name: "Coding",
    icon: "💻",
    builtIn: true,
    items: [
      { title: "Git Commit", category: "Work", priority: "medium", color: "slate" },
      { title: "Continue Project", category: "Work", priority: "high", color: "burgundy" },
      { title: "Update README", category: "Work", priority: "low", color: "blue" },
      { title: "Push Changes", category: "Work", priority: "medium", color: "green" },
    ],
  },
  {
    seedId: "tpl-gym",
    name: "Gym",
    icon: "🏋️",
    builtIn: true,
    items: [
      { title: "Workout", category: "Health", priority: "high", color: "green" },
      { title: "Creatine", category: "Health", priority: "low", color: "amber" },
      { title: "Protein", category: "Health", priority: "low", color: "amber" },
      { title: "Stretch", category: "Health", priority: "medium", color: "blue" },
    ],
  },
  {
    seedId: "tpl-university",
    name: "University",
    icon: "🎓",
    builtIn: true,
    items: [
      { title: "Attend lectures", category: "Learning", priority: "high", color: "burgundy" },
      { title: "Review notes", category: "Learning", priority: "medium", color: "blue" },
      { title: "Assignment progress", category: "Learning", priority: "high", color: "amber" },
      { title: "Read one chapter", category: "Learning", priority: "low", color: "violet" },
    ],
  },
  {
    seedId: "tpl-hackathon",
    name: "Weekend Hackathon",
    icon: "⚡",
    builtIn: true,
    items: [
      { title: "Plan", category: "Work", priority: "high", color: "burgundy" },
      { title: "Build", category: "Work", priority: "high", color: "green" },
      { title: "Test", category: "Work", priority: "medium", color: "amber" },
      { title: "Push", category: "Work", priority: "medium", color: "blue" },
    ],
  },
  {
    seedId: "tpl-deepwork",
    name: "Weekend Deep Work",
    icon: "🧠",
    builtIn: true,
    items: [
      { title: "Define one hard goal", category: "Work", priority: "high", color: "burgundy" },
      { title: "3h focused block", category: "Work", priority: "high", color: "violet" },
      { title: "No-distraction session", category: "Work", priority: "medium", color: "slate" },
      { title: "Review & document", category: "Work", priority: "low", color: "blue" },
    ],
  },
  {
    seedId: "tpl-morning",
    name: "Morning Routine",
    icon: "🌅",
    builtIn: true,
    items: [
      { title: "Hydrate", category: "Health", priority: "medium", color: "blue" },
      { title: "Meditate 10 min", category: "Health", priority: "medium", color: "violet" },
      { title: "Plan the day", category: "Personal", priority: "high", color: "burgundy" },
      { title: "Move / stretch", category: "Health", priority: "low", color: "green" },
    ],
  },
  {
    seedId: "tpl-night",
    name: "Night Routine",
    icon: "🌙",
    builtIn: true,
    items: [
      { title: "Reflect on the day", category: "Personal", priority: "medium", color: "violet" },
      { title: "Prep tomorrow", category: "Personal", priority: "high", color: "burgundy" },
      { title: "Read", category: "Learning", priority: "low", color: "blue" },
      { title: "Sleep before midnight", category: "Health", priority: "medium", color: "slate" },
    ],
  },
];

/** Suggested habits offered when the user has none yet. */
export const SUGGESTED_HABITS: { name: string; color: TaskColor }[] = [
  { name: "Gym", color: "green" },
  { name: "Java", color: "amber" },
  { name: "DSA", color: "burgundy" },
  { name: "Read", color: "blue" },
  { name: "Meditate", color: "violet" },
  { name: "Sleep before midnight", color: "slate" },
];
