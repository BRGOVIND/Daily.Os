# Workspace OS

Phase 5 turns Daily OS from a planner into a **personal operating system**. The
organising idea changes from *"plan your day"* to *"manage your entire life and
work from one application"* — and everything now revolves around **workspaces**.

The same three principles that shaped the Intelligence Engine hold here:

1. **Offline, private, deterministic.** No AI, no chat, no cloud sync, no auth,
   no RAG. Every workspace view is computed locally from IndexedDB and produces
   the same output for the same input.
2. **Logic isolated from UI.** The workspace domain lives entirely under
   `src/workspace/` and depends only on `@/types`, small `@/lib` leaf helpers,
   the Intelligence Engine's pure exports and `date-fns`. It imports nothing from
   React, Dexie or any component. The UI *consumes* its outputs.
3. **Derive, don't duplicate.** Timelines, graphs, search results and statistics
   are computed on read from the data that already exists — never stored — so
   they can't drift.

---

## What is a workspace?

A **Workspace** is the top-level container everything else can belong to — a
life or work area like *Daily OS*, *RedForge*, *Placement Prep*, *Germany*,
*Research Paper*, *Personal Finance*, *Gym* or *Startup*.

Each workspace owns (or gathers) **tasks, missions, notes, journal entries,
resources, a timeline and statistics**. Switching workspace is a pure in-memory
filter on `workspaceId`, so it is instant.

```
Workspace
  ├── Tasks        (Task.workspaceId)
  ├── Missions     (Mission.workspaceId)
  ├── Notes        (WorkspaceNote.workspaceId)
  ├── Journal      (JournalEntry.workspaceId)
  ├── Resources    (Resource.workspaceId)
  ├── Timeline     (derived from all of the above)
  └── Statistics   (derived)
```

---

## Architecture

```
src/workspace/
  index.ts                 # public API barrel — the only import surface the app uses
  models/
    types.ts               # every input/output shape (WorkspaceSnapshot, TimelineEvent, …)
    constants.ts           # tunable limits (recent counts, search & graph caps)
  utils/
    scope.ts               # belongsTo / scopeSnapshot — the "does this belong here?" rule
  notes/
    notes.ts               # block model helpers (makeBlock, plain text, checklist)
  journal/
    journal.ts             # streaks, mood average, ordering
  resources/
    resources.ts           # filtering, tag extraction, tag parsing
  timeline/
    timeline.ts            # Module 5 — build a workspace's chronological history
  search/
    search.ts              # Module 4 — universal search across all entities
  graph/
    graph.ts               # Module 9 — deterministic knowledge-graph layout
  stats/
    stats.ts               # Module 12 — per-workspace statistics
  dashboard/
    dashboard.ts           # Module 8 — dashboard aggregate
```

The UI reaches the domain through a small set of hooks:

- `useWorkspaces()` — live workspace list, CRUD and the active workspace (the
  active id is persisted in settings and falls back to the default workspace).
- `useWorkspaceSnapshot(enabled)` — folds every table into one
  `WorkspaceSnapshot`, memoized on the underlying arrays.
- `useWorkspaceData(workspace, todayKey, enabled)` — the scoped snapshot plus the
  dashboard, timeline, graph and stats, all in one memoized pass.
- `useUniversalSearch(query, enabled)` — grouped results across everything.
- `useNotes` / `useResources` / `useJournal` — live, workspace-scoped CRUD.

### The snapshot & scoping

Everything the domain reasons over is a **`WorkspaceSnapshot`** — a read-only
bundle of workspaces, dated tasks, missions, notes, resources, journal entries,
review marks, habits and templates. Pure functions take a snapshot and return
data; they never touch the database.

Scoping to a single workspace is one rule (`utils/scope.ts`):

> A task, mission or journal entry with a **null** `workspaceId` resolves to the
> **default workspace**.

This means all pre-Phase-5 data has a home the instant Workspace OS turns on, and
nothing is ever orphaned.

---

## Relationships

Workspace OS connects everything:

```
Workspace → Mission → Milestone
                   ↘ Task
Workspace → Note
Workspace → Resource
Workspace → Journal → Timeline
```

- **Tasks** link up to a **Mission** (`Task.missionId`) and to a **Workspace**
  (`Task.workspaceId`).
- **Missions** own **milestones** and belong to a workspace.
- **Notes**, **resources** and **journal entries** belong to a workspace.
- The **Timeline** and **Knowledge Graph** read these links to weave the
  workspace's story and map, respectively.

---

## Module 1 — Workspaces

A `Workspace` has an id, name, icon, colour, description, `archived` flag,
`order` and timestamps. Tasks and missions gained an optional `workspaceId`; both
default to null (= the default workspace). A default **"Daily OS"** workspace is
seeded on first run so existing data is immediately at home.

## Module 2 — Project Notes

A note is an ordered list of typed **blocks**: `heading`, `text`, `bullet`,
`checkbox`, `quote`, `code`. This is a lightweight, offline block model — no
Markdown parsing and no external editor dependency. The editor keeps blocks in
local state and **autosaves** (debounced); Enter splits into a new block,
Backspace on an empty block removes it, and a per-block menu changes type.

## Module 3 — Resource Library

Each workspace has a searchable **Resource** library: links, articles, videos,
repositories, PDFs, images (metadata) and books. Resources carry tags, a
category, and `pinned` / `favorite` flags. `filterResources` applies the search /
kind / tag / favourites filter and sorts pinned-first, newest-first.

## Module 4 — Universal Search

`universalSearch(snapshot, query)` scans **every** entity type — workspaces,
tasks, missions, notes, resources, journal, habits, templates — and returns
results grouped by category, each capped for speed. In the UI it is a
**⌘/Ctrl + K** command palette with ↑/↓ navigation and Enter to open.

## Module 5 — Timeline

`buildTimeline(snapshot, workspace)` derives a chronological history from data
that already exists: workspace created, missions started, milestones reached,
tasks completed, journal entries, resources saved, notes updated and daily
reviews. Events sort newest-first and group by day in the UI.

> Milestones carry no timestamp of their own, so completed milestones are
> anchored to their mission's `updatedAt` (best-effort, documented).

## Module 6 — Journal

Each day's free-text notes are complemented by a structured **journal**: a mood
grade plus highlights, challenges, lessons and a free reflection, scoped to a
workspace and date. There is at most one entry per (date, workspace) — saving
**upserts**. Entries feed the Timeline and contribute the journalling streak.

## Module 7 — Relationships

See [Relationships](#relationships). Every surface shows related information —
the dashboard links tasks to their days, the timeline threads journal/resource/
task events together, and the graph visualises the whole web.

## Module 8 — Dashboard

`buildDashboard(snapshot, workspace, todayKey)` aggregates the workspace into
headline stats, the active-task queue, recent notes and resources, active
missions and a recent timeline slice. Every strip links deeper into the relevant
tab.

## Module 9 — Knowledge Graph

`buildGraph(snapshot, workspace)` produces a lightweight relationship map — **no
AI, no embeddings**. The workspace sits at the centre, missions on an inner ring,
each mission's milestones and linked tasks orbiting it, and loose knowledge
(notes, resources, journal) on an outer ring. Coordinates are deterministic and
normalized to a `[-1, 1]` square; the SVG view highlights a node's neighbours on
click. Counts are capped so the graph stays legible.

## Module 12 — Statistics

`computeWorkspaceStats(snapshot, todayKey)` returns task throughput and
completion rate, mission completion, note/resource/journal counts, the
journalling streak, **time invested** (summed estimated minutes of completed
tasks) and a **seven-day activity** sparkline.

---

## Performance

- **One snapshot, memoized.** `useWorkspaceSnapshot` reads each table once and
  folds them into a single object memoized on the arrays; `useWorkspaceData`
  computes the dashboard, timeline, graph and stats in one `useMemo`.
- **Inert when closed.** The snapshot and search hooks build nothing while their
  host surface is closed (`enabled` / `open` is false).
- **Code-split.** The Workspaces hub and command palette load via `next/dynamic`,
  so the calendar home stays light — its first-load JS moved only ~2 kB.
- **Indexed queries.** Notes, resources and journal are queried by their indexed
  `workspaceId` / `date`; cross-field cleanups use collection `modify` rather
  than unindexed `where`.
- **Autosave, debounced.** Note and journal editors persist on a 500–600 ms
  debounce, so typing never blocks on a write.

---

## Migration strategy

The database moved to **v4**:

- Four new tables — `workspaces`, `notes`, `resources`, `journal` — are created.
  No existing table is touched.
- Tasks and missions gained an **optional** `workspaceId`; existing rows keep
  `null`, which resolves to the default workspace via `belongsTo`.
- `ensureSeeded` (idempotent, every start) seeds the default **"Daily OS"**
  workspace when none exist.
- Export / import round-trips the new tables and tolerates their absence in
  older bundles; `activeWorkspaceId` is carried in settings.

Nothing about pre-Phase-5 data breaks: every new field is optional and every new
table is additive.

---

## Future AI integration points

Every module is a pure function behind a typed contract, so a model could later
sit *behind* these interfaces without changing output shapes or the offline
default:

- **Search** — `universalSearch` could be re-ranked by semantic similarity while
  still returning the same `SearchGroup[]`.
- **Graph** — edges are currently structural; a model could add *suggested*
  relationships (related notes, similar resources) as extra `GraphEdge`s.
- **Timeline** — an optional summariser could fold a day's events into a
  sentence, layered on top of the derived `TimelineEvent[]`.
- **Notes / Journal** — writing assistance could be offered inside the editor
  without changing the stored block / entry shapes.

An AI layer would remain entirely optional. Workspace OS must always function
fully offline, exactly as it does today.
