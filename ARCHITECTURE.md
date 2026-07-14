# Architecture

Daily OS is a single-page, offline-first Next.js (App Router) application. There
is no server or API — the browser _is_ the backend, with all state persisted in
IndexedDB through [Dexie](https://dexie.org/). This document explains how the
pieces fit together.

## Mental model

The unit of state is a **day**: a self-contained workspace keyed by its ISO date
(`yyyy-MM-dd`). A day holds its tasks, focus items, per-day habit completion,
notes and (optionally) a review. **Global** entities — habit definitions,
templates, recurring-task definitions and settings — live in their own tables
and _project into_ each day.

```
DayRecord (days table)                Global tables
├─ tasks: Task[]                       ├─ habits:    HabitDef[]
├─ focus: FocusItem[]                  ├─ templates: Template[]
├─ habitLog: { [habitId]: boolean }    ├─ recurring: RecurringTask[]
├─ recurringApplied: string[]          └─ settings:  AppSettings (single row)
├─ notes: string
└─ review: DailyReview | null
```

## Data flow

```
 IndexedDB ── Dexie (src/lib/db.ts)
     ▲                │
     │ transactional  │ useLiveQuery (reactive reads)
     │ writes         ▼
 helpers ◄──── hooks (src/hooks/*) ──► components (src/components/*)
```

- **`src/lib/db.ts`** owns the schema (versioned, with a v1→v2 migration),
  seeding of default templates/settings, and all transactional read-modify-write
  helpers. Nothing else touches Dexie tables directly.
- **Hooks** are the only way components read or mutate data. They wrap
  `useLiveQuery` so every open view stays in sync automatically:
  - `useDay(dateKey)` — a single day's live workspace + mutations; also
    materializes due recurring tasks on open.
  - `useHabits(today)` — global habits with today's completion and streaks.
  - `useMonthSummary(month)` — per-day task tallies powering calendar rings.
  - `useTemplates`, `useRecurring`, `useSettings` — global entities.
  - `useSearch(query)` — instant cross-day task search.
  - `useStats(today)` — streak, weekly totals, completion %, heatmap.
  - `useReminders`, `useDailyReview`, `useKeyboardShortcuts`,
    `useDebouncedCallback` — cross-cutting behavior.
- **Components** are presentational and compose hooks. The root
  `AppShell` owns _navigation_ state (which month/day/modal is open) and wires
  global concerns; it holds no domain data of its own.

## Key design decisions

### Days are documents, not rows of tasks

Storing each day as one record keeps reads/writes atomic and makes the calendar
trivially fast (one `between` query per visible month). Tasks are an array
inside the day, mutated via `updateDay(date, fn)` inside a transaction so
concurrent edits (toggling a task while notes autosave) never clobber.

### Recurrence is materialized, idempotently

Recurring tasks are stored once as definitions. When a day is opened,
`materializeRecurring(dateKey)` adds any due instances and records their ids in
`recurringApplied`, so re-opening never duplicates them and deleting an instance
doesn't resurrect it. Matching lives in `src/lib/recurrence.ts`.

### The accent color is a CSS variable

Tailwind's `accent` token is `rgb(var(--accent) / <alpha-value>)`. Settings
writes new RGB channels to `:root`, so re-theming is instant and alpha modifiers
(`bg-accent/10`) keep working.

### Rendering is client-gated

`AppShell` resolves "today" and mounts only after hydration, avoiding SSR/CSR
date drift and keeping Dexie strictly client-side. Occasional modals (search,
stats, settings, review) are lazy-loaded via `next/dynamic` and mounted on first
open.

## Folder reference

```
src/
  app/
    layout.tsx          Root layout, metadata, global styles
    page.tsx            Renders <AppShell/> — the calendar is the homepage
    icon.svg            Favicon (Next metadata convention)
    globals.css         Tailwind layers + base tokens
  components/
    AppShell.tsx        Root client shell: navigation state + global wiring
    calendar/           Month header, animated grid, day cells, today preview
    day/                Full-day workspace modal
    tasks/              Task list/item, filter bar, add-task modal + form
    habits/             Global habits with streaks
    templates/          Template manager (used in settings)
    review/             Today's Focus + the 10 PM Daily Review modal
    stats/              Insights modal with heatmap
    search/             Cross-day search overlay
    layout/             Top nav, floating action button, settings modal
    ui/                 Reusable primitives (button, input, modal, ring, toast…)
  hooks/                All data access + cross-cutting behavior
  lib/
    db.ts               Dexie database, schema, seeding, write helpers
    date.ts             date-fns wrappers + calendar grid builder
    recurrence.ts       Recurrence matching
    recurringApply.ts   Idempotent per-day materialization
    status.ts           Day status (grey/green/yellow/red) + ratio
    tasks.ts            Task factories (draft / template / recurring)
    commitTask.ts       Task + recurring-definition write path
    backup.ts           Export / import (validated JSON)
    notifications.ts    Notification API wrapper
    constants.ts        Palette, templates, options, defaults
    utils.ts            cn(), id generation
  types/                Domain model
```

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · TailwindCSS ·
Radix primitives (shadcn/ui style) · Framer Motion · Dexie.js · React Hook Form ·
date-fns · Lucide icons.
