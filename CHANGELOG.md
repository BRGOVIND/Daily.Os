# Changelog

All notable changes to Daily OS. Dates are release-day snapshots; the app is
offline-first with no telemetry, so "release" means a reviewed local build.

## v3.1.0 — "Pro" (polish)

Feature-complete already; this release is about making Daily OS feel like premium
commercial software.

### Added
- **Reduced motion** — a global `MotionProvider` routes all Framer Motion through
  one `MotionConfig`; follows the OS `prefers-reduced-motion` and can be forced on
  from **Settings → Accessibility**.
- **Keyboard-first UX** — expanded global shortcuts (`T` today, `W` workspaces,
  `?` cheat-sheet) alongside `⌘/Ctrl+K`, `/`, `N`, `←/→`, `⌘S`; a new keyboard
  help overlay lists them all, kept in sync via `lib/shortcuts.ts`.
- **Backup & recovery** — scoped export (whole app, a single workspace, missions
  only, or journal only); an import flow that previews a file's contents, flags
  conflicts, and offers **Merge** (upsert, keep everything else) or **Replace**.
- **Settings** — reorganised with a dedicated Data console and an Accessibility
  section.
- **Docs** — `ARCHITECTURE.md`, `CONTRIBUTING.md`, `DESIGN_SYSTEM.md`, this
  changelog, and `RELEASE.md`.

### Changed
- `downloadExport` names files by scope; `AppSettings` gained `reducedMotion`.

### Removed
- Dead code: the pre-Phase-5 `SearchOverlay` + `useSearch` (superseded by the
  universal command palette).

### Fixed
- Workspace deletion no longer queries an unindexed field when detaching missions.

## v3.0.0 — Workspace OS
Workspaces as top-level containers; project notes (block editor), resource
library, structured journal, auto-built timeline, knowledge graph, per-workspace
dashboard & stats, and universal `⌘K` search. Dexie **v4** migration.

## v2.0.0 — Intelligence Engine
Isolated `src/engine/` domain: automatic priority, planner, workload analyzer,
productivity score, energy analysis, burnout detection, weekly coach, time
estimation and Mission Mode. Dexie **v3** migration.

## v1.0.0 — Initial release
Calendar-first planner, tasks, habits, templates, daily review, statistics,
productivity tree, mobile-first PWA.
