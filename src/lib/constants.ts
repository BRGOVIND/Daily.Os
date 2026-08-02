import type {
  AccentKey,
  Difficulty,
  EnergyLevel,
  Mood,
  NoteBlockType,
  PomodoroPhase,
  Priority,
  RecurrenceRule,
  ResourceKind,
  StickyColor,
  TaskColor,
  Template,
  TemplateItem,
  ThemeKey,
} from "@/types";

export const APP_NAME = "Daily OS";
export const MAX_FOCUS_ITEMS = 3;
export const DB_VERSION = 4;

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

/** Energy-level quick-picks for the smart task composer (Phase 4). */
export const ENERGY_OPTIONS: { key: EnergyLevel; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

/** Difficulty quick-picks for the smart task composer (Phase 4). */
export const DIFFICULTY_OPTIONS: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

/** Estimated-duration quick-picks (minutes). */
export const ESTIMATE_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: "15m" },
  { minutes: 30, label: "30m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
];

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
  theme: "light" as ThemeKey,
};

/** The three full application themes, for the Settings picker. Swatches mirror
 * the CSS-variable palettes defined in globals.css (canvas / card / ink). */
export const THEMES: {
  key: ThemeKey;
  label: string;
  description: string;
  swatch: { canvas: string; card: string; ink: string };
}[] = [
  {
    key: "light",
    label: "Blossom",
    description: "Soft, bright and calm.",
    swatch: { canvas: "#FCF4F7", card: "#FFFFFF", ink: "#141115" },
  },
  {
    key: "dark",
    label: "Charcoal",
    description: "Elegant dark, never pure black.",
    swatch: { canvas: "#17171B", card: "#202025", ink: "#ECECF0" },
  },
  {
    key: "paper",
    label: "Warm Paper",
    description: "Cream ground, soft brown ink.",
    swatch: { canvas: "#F4EDE0", card: "#FBF6EC", ink: "#3C2E22" },
  },
];

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

// ─── Workspace OS (Phase 5) ─────────────────────────────────────────────────

/** Seed id for the default workspace created on first run. */
export const DEFAULT_WORKSPACE_ID = "ws-default";

/** Emoji palette offered when creating a workspace. */
export const WORKSPACE_ICONS = [
  "🗂️", "🚀", "🎯", "🎓", "🌍", "💼", "🧪", "💡",
  "🏋️", "💰", "📚", "🏡", "🎨", "🧠", "⚡", "🌱",
];

/** Note-block kinds shown in the editor's insert menu. */
export const NOTE_BLOCK_OPTIONS: {
  type: NoteBlockType;
  label: string;
  hint: string;
}[] = [
  { type: "text", label: "Text", hint: "Plain paragraph" },
  { type: "heading", label: "Heading", hint: "Section title" },
  { type: "bullet", label: "Bullet", hint: "List item" },
  { type: "checkbox", label: "Checkbox", hint: "Task to tick off" },
  { type: "quote", label: "Quote", hint: "Callout / citation" },
  { type: "code", label: "Code", hint: "Monospace block" },
];

/** Resource kinds with a label and emoji glyph for the library. */
export const RESOURCE_KINDS: {
  kind: ResourceKind;
  label: string;
  icon: string;
}[] = [
  { kind: "link", label: "Link", icon: "🔗" },
  { kind: "article", label: "Article", icon: "📄" },
  { kind: "video", label: "Video", icon: "🎬" },
  { kind: "repo", label: "Repository", icon: "🐙" },
  { kind: "pdf", label: "PDF", icon: "📘" },
  { kind: "image", label: "Image", icon: "🖼️" },
  { kind: "book", label: "Book", icon: "📚" },
];

export const RESOURCE_KIND_MAP: Record<
  ResourceKind,
  { label: string; icon: string }
> = RESOURCE_KINDS.reduce(
  (acc, r) => ({ ...acc, [r.kind]: { label: r.label, icon: r.icon } }),
  {} as Record<ResourceKind, { label: string; icon: string }>,
);

/** Mood grades captured in the journal, worst→best ordering by score. */
export const MOOD_OPTIONS: {
  key: Mood;
  label: string;
  emoji: string;
  score: number;
}[] = [
  { key: "great", label: "Great", emoji: "🤩", score: 5 },
  { key: "good", label: "Good", emoji: "🙂", score: 4 },
  { key: "okay", label: "Okay", emoji: "😐", score: 3 },
  { key: "low", label: "Low", emoji: "😔", score: 2 },
  { key: "rough", label: "Rough", emoji: "😣", score: 1 },
];

export const MOOD_MAP: Record<Mood, { label: string; emoji: string; score: number }> =
  MOOD_OPTIONS.reduce(
    (acc, m) => ({ ...acc, [m.key]: { label: m.label, emoji: m.emoji, score: m.score } }),
    {} as Record<Mood, { label: string; emoji: string; score: number }>,
  );

/** Suggested habits offered when the user has none yet. */
export const SUGGESTED_HABITS: { name: string; color: TaskColor }[] = [
  { name: "Gym", color: "green" },
  { name: "Java", color: "amber" },
  { name: "DSA", color: "burgundy" },
  { name: "Read", color: "blue" },
  { name: "Meditate", color: "violet" },
  { name: "Sleep before midnight", color: "slate" },
];

// ─── Daily productivity (Phase 9) ────────────────────────────────────────────

/** Warm paper palette for quick notes and sticky notes (light-theme surfaces). */
export const STICKY_COLORS: Record<
  StickyColor,
  { label: string; bg: string; border: string; text: string; accent: string }
> = {
  yellow: { label: "Yellow", bg: "#FEF6D8", border: "#F4E4A6", text: "#7A5B12", accent: "#E9C349" },
  pink: { label: "Pink", bg: "#FCE4EF", border: "#F6C3DA", text: "#9C2A5C", accent: "#E06699" },
  blue: { label: "Blue", bg: "#E1F0FB", border: "#BFDFF4", text: "#1F5C86", accent: "#5AA6DC" },
  green: { label: "Green", bg: "#E1F5E7", border: "#BEE9CB", text: "#1F6B41", accent: "#5CB77E" },
  purple: { label: "Purple", bg: "#ECE6FB", border: "#D5C9F3", text: "#4F3A93", accent: "#8B72D8" },
  gray: { label: "Slate", bg: "#EEF1F5", border: "#DCE1E8", text: "#3C4653", accent: "#8A96A5" },
};

export const STICKY_COLOR_KEYS = Object.keys(STICKY_COLORS) as StickyColor[];

/** Default Pomodoro configuration (minutes + behaviour). */
export const POMODORO_DEFAULTS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  /** Long break after this many focus sessions. */
  longEvery: 4,
  autoNext: true,
} as const;

export const POMODORO_PHASES: Record<
  PomodoroPhase,
  { label: string; tone: string }
> = {
  focus: { label: "Focus", tone: "#8C1232" },
  "short-break": { label: "Short break", tone: "#3FA66B" },
  "long-break": { label: "Long break", tone: "#3B82C4" },
};

/** Duration quick-picks (minutes) offered for a countdown timer utility. */
export const COUNTDOWN_PRESETS = [1, 3, 5, 10, 15, 20, 30, 45, 60];

/** The lightweight tools listed in the Daily Utilities slide-out. */
export const DAILY_UTILITIES: {
  id: string;
  name: string;
  hint: string;
}[] = [
  { id: "shopping", name: "Shopping List", hint: "Quick checklist" },
  { id: "expenses", name: "Expense Notes", hint: "Jot spending" },
  { id: "countdown", name: "Countdown", hint: "Set a timer" },
  { id: "metronome", name: "Metronome", hint: "Keep tempo" },
  { id: "score", name: "Score Counter", hint: "Track points" },
  { id: "billsplit", name: "Bill Split", hint: "Divide a bill" },
  { id: "converter", name: "Time Converter", hint: "Zones & units" },
  { id: "stopwatch", name: "Stopwatch", hint: "Lap timing" },
];

/**
 * Smart recurring day templates (Phase 9, feature 6). Deliberately emoji-free —
 * minimal and elegant. Applying one drops its tasks onto a chosen day; each can
 * also be materialized as a recurring routine.
 */
export interface DayTemplateDef {
  id: string;
  name: string;
  description: string;
  suggested: RecurrenceRule;
  items: TemplateItem[];
}

export const DAY_TEMPLATES: DayTemplateDef[] = [
  {
    id: "day-morning",
    name: "Morning Routine",
    description: "A calm, repeatable start to the day.",
    suggested: "daily",
    items: [
      { title: "Hydrate", category: "Health", priority: "medium", color: "blue" },
      { title: "Stretch and breathe", category: "Health", priority: "low", color: "green" },
      { title: "Set three intentions", category: "Personal", priority: "high", color: "burgundy" },
      { title: "Review the calendar", category: "Personal", priority: "medium", color: "slate" },
    ],
  },
  {
    id: "day-university",
    name: "University Day",
    description: "Lectures, notes and steady progress.",
    suggested: "weekdays",
    items: [
      { title: "Attend lectures", category: "Learning", priority: "high", color: "burgundy" },
      { title: "Rewrite lecture notes", category: "Learning", priority: "medium", color: "blue" },
      { title: "Assignment progress", category: "Learning", priority: "high", color: "amber" },
      { title: "Read one chapter", category: "Learning", priority: "low", color: "violet" },
    ],
  },
  {
    id: "day-gym",
    name: "Gym Day",
    description: "Train, refuel, recover.",
    suggested: "weekly",
    items: [
      { title: "Warm up", category: "Health", priority: "medium", color: "green" },
      { title: "Main workout", category: "Health", priority: "high", color: "burgundy" },
      { title: "Protein and hydrate", category: "Health", priority: "low", color: "amber" },
      { title: "Cool down and stretch", category: "Health", priority: "medium", color: "blue" },
    ],
  },
  {
    id: "day-coding",
    name: "Coding Day",
    description: "Ship something small every day.",
    suggested: "weekdays",
    items: [
      { title: "Plan the one task", category: "Work", priority: "high", color: "burgundy" },
      { title: "Deep work block", category: "Work", priority: "high", color: "violet" },
      { title: "Commit and push", category: "Work", priority: "medium", color: "green" },
      { title: "Write down what's next", category: "Work", priority: "low", color: "slate" },
    ],
  },
  {
    id: "day-interview",
    name: "Interview Prep",
    description: "Sharpen fundamentals and delivery.",
    suggested: "daily",
    items: [
      { title: "Two practice problems", category: "Learning", priority: "high", color: "burgundy" },
      { title: "Review one core topic", category: "Learning", priority: "medium", color: "blue" },
      { title: "Rehearse a behavioural answer", category: "Work", priority: "medium", color: "amber" },
      { title: "Reflect on the mock", category: "Personal", priority: "low", color: "violet" },
    ],
  },
  {
    id: "day-weekend-reset",
    name: "Weekend Reset",
    description: "Tidy the week and prepare the next.",
    suggested: "weekends",
    items: [
      { title: "Clear the inbox", category: "Personal", priority: "medium", color: "blue" },
      { title: "Tidy the space", category: "Personal", priority: "low", color: "green" },
      { title: "Review the week", category: "Personal", priority: "high", color: "burgundy" },
      { title: "Plan the week ahead", category: "Personal", priority: "high", color: "violet" },
    ],
  },
  {
    id: "day-exam-week",
    name: "Exam Week",
    description: "Focused revision under pressure.",
    suggested: "daily",
    items: [
      { title: "Revise weakest topic", category: "Learning", priority: "high", color: "burgundy" },
      { title: "Timed practice paper", category: "Learning", priority: "high", color: "amber" },
      { title: "Active recall session", category: "Learning", priority: "medium", color: "blue" },
      { title: "Rest and sleep early", category: "Health", priority: "medium", color: "green" },
    ],
  },
];
