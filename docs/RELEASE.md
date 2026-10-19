# Release Guide

Preparing Daily OS for public release.

## Release checklist

Run and confirm each before tagging a release:

- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run lint` — no ESLint warnings or errors
- [ ] `npm test` — domain and UI tests pass
- [ ] `npm run build` — production build and offline service worker succeed
- [ ] `NEXT_OUTPUT_EXPORT=1 npm run build` — desktop static export succeeds
- [ ] **PWA** — installs; service worker registers; offline reload works
- [ ] **Mobile** — bottom sheets, safe-area insets, 44px touch targets
- [ ] **Desktop** — keyboard shortcuts (`⌘K`, `/`, `T`, `W`, `?`, `←/→`, `N`)
- [ ] **Offline** — create a task/note/journal with the network off; reload
- [ ] **Search** — `⌘K` finds tasks, notes, missions, resources, journal
- [ ] **Planner / Mission Mode / Timeline / Journal / Knowledge Graph** render
      with real data
- [ ] **Backup** — full & scoped export download, including quick notes, sticky
      notes, focus sessions and utilities; import Merge and Replace both behave;
      conflicts are reported
- [ ] **Accessibility** — keyboard-only pass; reduced-motion toggle; high zoom
- [ ] **Data safety** — a v3 (pre-Workspace-OS) database upgrades cleanly to v6
- [ ] Update `CHANGELOG.md` and the version number

## Known limitations

- **Single device.** No cloud sync by design — data lives in this browser's
  IndexedDB. Moving devices is a manual export → import.
- **Guest mode is temporary.** Guest data clears on reload. Use a local profile
  to keep it across visits.
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

1. **Guided onboarding** that creates a first workspace, mission and task.
2. **Richer, still-subtle analytics** — mission & workspace trend lines, planner
   efficiency, journal activity heatmap.
3. **Clearer planning summaries** — improve the existing offline statistics and
   workspace views without adding a backend.

## Version notes

See `CHANGELOG.md`. The current unreleased update adds phone navigation, faster
task capture and a more complete offline cache. It also raises quality in
accessibility, profile switching, backup/recovery and build checks.
