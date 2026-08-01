# Release Guide

Preparing Daily OS for public release.

## Release checklist

Run and confirm each before tagging a release:

- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npx next lint` — no ESLint warnings or errors
- [ ] `npx next build` — production build succeeds
- [ ] **PWA** — installs; service worker registers; offline reload works
- [ ] **Mobile** — bottom sheets, safe-area insets, 44px touch targets
- [ ] **Desktop** — keyboard shortcuts (`⌘K`, `/`, `T`, `W`, `?`, `←/→`, `N`)
- [ ] **Offline** — create a task/note/journal with the network off; reload
- [ ] **Search** — `⌘K` finds tasks, notes, missions, resources, journal
- [ ] **Planner / Mission Mode / Timeline / Journal / Knowledge Graph** render
      with real data
- [ ] **Backup** — full & scoped export download; import Merge and Replace both
      behave; conflicts are reported
- [ ] **Accessibility** — keyboard-only pass; reduced-motion toggle; high zoom
- [ ] **Data safety** — a v3 (pre-Workspace-OS) database upgrades cleanly to v4
- [ ] Update `CHANGELOG.md` and the version number

## Known limitations

- **Single device.** No cloud sync by design — data lives in this browser's
  IndexedDB. Moving devices is a manual export → import.
- **No dark theme yet.** Tokens are CSS-variable-driven so it's straightforward
  to add; currently light-only.
- **Timeline milestone timestamps are approximate.** Milestones carry no
  completion time of their own, so completed ones anchor to their mission's
  `updatedAt`.
- **Knowledge graph is capped.** For legibility it shows a bounded number of
  missions/leaves/loose nodes rather than every entity.
- **Onboarding is light.** First-run explains the philosophy but does not yet
  hand-hold through creating a first workspace/mission/task.
- **Analytics are intentionally minimal.** Elegant over exhaustive.

## Roadmap

Conservative and optional — Daily OS is at feature maturity and should not become
a bloated suite. All items remain offline-first, private and backend-free.

1. **Dark theme** using the existing token system.
2. **Guided onboarding** that creates a first workspace, mission and task.
3. **Richer, still-subtle analytics** — mission & workspace trend lines, planner
   efficiency, journal activity heatmap.
4. **Optional AI layer behind the pure domain interfaces** — re-ranked search,
   suggested graph links, timeline summaries — never required, never online by
   default. See each domain doc's "Future AI integration points".

## Version notes

See `CHANGELOG.md`. This release ("Pro") adds no new product surface area; it
raises quality: reduced motion, keyboard-first UX, backup/recovery, settings and
documentation.
