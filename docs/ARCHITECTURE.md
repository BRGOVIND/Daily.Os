# Architecture

Daily OS is an **offline-first, single-user, no-backend** personal operating
system. Everything runs in the browser; all data lives in IndexedDB. There is no
server, no authentication, no cloud sync and no AI.

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript, `strict` (no `any`) |
| Styling | Tailwind CSS + design tokens (see `DESIGN_SYSTEM.md`) |
| Persistence | Dexie.js over IndexedDB (per-profile database) |
| Reactivity | `dexie-react-hooks` `useLiveQuery` |
| Animation | Framer Motion, governed by one `MotionConfig` |
| Icons | lucide-react |
| Dates | date-fns |

The app is a **PWA**: installable, offline-capable via a service worker, with
safe-area-aware, mobile-first layout.

---

## Folder structure

```
src/
  app/                 # Next.js routes: layout, page, welcome, manifest, icons
  components/
    calendar/          # the calendar-first home
    day/               # the day workspace (tasks, planner, habits, notes)
    tasks/ habits/ templates/ review/
    missions/          # Mission Mode surface
    workspace/         # Workspace OS hub + tabs + command palette
    stats/             # statistics & intelligence panels
    layout/            # TopNav, Settings, Data, KeyboardHelp, Fab
    providers/         # MotionProvider (and future providers)
    profile/ pwa/ ui/  # profiles, PWA controller, primitive components
  engine/              # Intelligence Engine — pure domain (Phase 4)
  workspace/           # Workspace OS — pure domain (Phase 5)
  hooks/               # React hooks bridging domains ↔ IndexedDB
  lib/                 # db, backup, constants, dates, motion, shortcuts, utils
  types/               # the single source of truth for domain types
docs/                  # this folder
```

### Two pure domains

The heart of the app is two **UI-agnostic, offline, deterministic** domains:

- **`src/engine/`** — the Intelligence Engine (priority, planner, workload,
  productivity, energy, burnout, weekly coach, estimation, mission progress).
  See `INTELLIGENCE_ENGINE.md`.
- **`src/workspace/`** — Workspace OS (notes, journal, resources, timeline,
  universal search, knowledge graph, stats, dashboard). See `WORKSPACE_OS.md`.

Both depend only on `@/types`, small `@/lib` leaf helpers, each other's *pure*
exports and date-fns — **never** on React, Dexie or components. They take a plain
data snapshot and return typed outputs. This is what keeps the app fast, testable
and impossible to break from the UI layer.

```
IndexedDB ──(hooks: useLiveQuery)──▶ snapshot ──(pure domain fns)──▶ view models ──▶ React
```

---

## State management

There is no global store. State lives in three tiers:

1. **Persistent** — IndexedDB via Dexie. All reads flow through helpers in
   `lib/db.ts`; the UI never touches Dexie directly. A `Proxy` over the active
   database lets every call site import a single `db` while the underlying
   instance swaps on profile switch.
2. **Reactive** — `useLiveQuery` subscribes components to the exact slices they
   need; writes are transactional read-modify-write so concurrent edits never
   clobber each other.
3. **Ephemeral** — `useState` in `AppShell` owns navigation (which month, which
   day, which modal). Occasional surfaces are code-split with `next/dynamic` and
   latched open so their chunk loads on demand but keeps its exit animation.

### Migrations

The database is versioned in `lib/db.ts` (currently **v4**). Every schema bump is
additive and every new field is optional, so older data and JSON backups load
untouched. `ensureSeeded` idempotently seeds default templates, settings and the
default workspace on every start.

---

## Rendering & performance

- Domain outputs are computed in a single memoized pass per surface (`useMemo`
  keyed on the underlying arrays); components never recompute them.
- Hooks are **inert** while their host surface is closed.
- Heavy surfaces (stats, missions, workspaces, command palette, keyboard help)
  are code-split; the calendar home's first-load JS stays ~90 kB.
- `MotionProvider` centralises Framer Motion and honours reduced-motion.

---

## Future roadmap

Deliberately conservative — Daily OS is at feature maturity and will not become a
bloated suite. Candidate directions, all optional and all offline:

- Dark theme (tokens already CSS-variable-driven).
- Richer analytics (mission/workspace trend lines, planner efficiency).
- An optional AI layer *behind* the existing pure interfaces (see each domain's
  "Future AI integration points"). It would never be required; the app must
  always work fully offline.
- Guided first-run onboarding that creates a first workspace, mission and task.

See `../docs/INTELLIGENCE_ENGINE.md` and `../docs/WORKSPACE_OS.md` for the two
domains, and `DESIGN_SYSTEM.md` for the visual language.
