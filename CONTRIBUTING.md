# Contributing to Daily OS

Thanks for your interest in improving Daily OS! This project aims to feel like a
premium, handcrafted product — contributions should uphold that bar for both
code quality and design restraint.

## Philosophy

- **Calm over clever.** Whitespace, large type and subtle motion. When in doubt,
  remove rather than add.
- **The calendar is the homepage.** Features hang off days; we don't add
  dashboards, sidebars, or navigation sprawl.
- **Offline-first.** No backend, no accounts, no telemetry. All data lives in the
  browser (IndexedDB via Dexie).
- **Strongly typed.** `any` is disallowed by lint. Model the domain in
  `src/types`.

## Getting started

```bash
git clone <your-fork-url>
cd daily-os
npm install
npm run dev        # http://localhost:3000
```

> **Note on installs:** the default registry is npmjs.org. If it's blocked on
> your network, you can use a mirror for a single install:
> `npm install --registry=https://registry.npmmirror.com/`

## Scripts

| Command             | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | ESLint (next/core-web-vitals + TS)   |
| `npm run typecheck` | `tsc --noEmit`                       |

Before opening a PR, make sure **`npm run typecheck`, `npm run lint` and
`npm run build` all pass.**

## Project layout

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a full tour. In short:

- `src/app` — App Router entry (the calendar).
- `src/components/<feature>` — feature UIs (calendar, day, tasks, habits,
  templates, review, stats, search, layout) + reusable `ui/` primitives.
- `src/hooks` — all data access and cross-cutting behavior (live queries,
  reminders, shortcuts, the daily review).
- `src/lib` — Dexie database, date/recurrence/status helpers, constants.
- `src/types` — the domain model.

## Conventions

- **Data flows through hooks.** UI never touches Dexie directly; add a hook or a
  helper in `src/lib/db.ts` instead.
- **One write path per concept.** e.g. task creation lives in `lib/tasks.ts` /
  `lib/commitTask.ts`. Don't inline duplicate logic.
- **Animation via Framer Motion.** Keep durations short and springs gentle.
  Prefer `layout` animations over manual choreography.
- **Accessibility is not optional.** Modals trap focus (Radix), everything is
  keyboard reachable, and interactive elements carry `aria-*` labels.
- **Match the palette.** Use the Tailwind tokens (`accent`, `ink`, `line`,
  `success`, …), never raw hex in components except for per-item colors.

## Commit & PR

- Keep commits focused and describe the _why_.
- Include before/after screenshots or a short clip for any visual change.
- Small, reviewable PRs are preferred over large ones.

## Reporting bugs / ideas

Open an issue describing what you expected, what happened, and steps to
reproduce. For features, explain how it fits the "calendar-native, calm"
philosophy — that framing helps a lot.
