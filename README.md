# Daily OS

**A Daily Operating System — not another to-do app.**

![License: MIT](https://img.shields.io/badge/license-MIT-8C1232)
![Next.js](https://img.shields.io/badge/Next.js-14-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Offline First](https://img.shields.io/badge/offline-first-3FA66B)
![PWA](https://img.shields.io/badge/PWA-installable-C13E6B)

Every day has its own workspace. Instead of opening a list of tasks, you open a
calendar. Click any day and its full dashboard slides open: today's focus,
tasks, habits and notes. Everything revolves around dates. The calendar _is_ the
homepage.

Calm, minimal, offline-first. No account. No server. No AI. Your data never
leaves your device.

> There's a marketing landing page at `/welcome`, and the app itself lives at `/`.

<!-- Hero image — add docs/hero.png (a screenshot of the calendar home). -->
<p align="center">
  <img src="docs/hero.png" alt="Daily OS — the calendar is the homepage" width="820">
</p>

---

## Screenshots

Add images to a `docs/` folder and they'll render here:

| Calendar home | Day workspace | Growth journal |
| ------------- | ------------- | -------------- |
| ![Calendar](docs/calendar.png) | ![Day](docs/day.png) | ![Stats](docs/stats.png) |

| Hero / entry | Daily review | Install (PWA) |
| ------------ | ------------ | ------------- |
| ![Hero](docs/hero-screen.png) | ![Review](docs/review.png) | ![PWA](docs/pwa.png) |

> Tip: capture at a 16:10 viewport in light mode for a consistent, editorial set.

---

## Design philosophy

Huge whitespace · large editorial typography · rounded corners · very subtle
shadows · a soft baby-pink canvas · a single blossom-rose accent · elegant,
restrained motion. Closer in spirit to Apple Calendar, Apple Notes, Linear and
Arc than to a productivity dashboard.

| Token          | Value     |
| -------------- | --------- |
| Background     | `#FCF4F7` |
| Cards          | `#FFFFFF` |
| Primary text   | `#141115` |
| Secondary text | `#6B646A` |
| Borders        | `#F0E6EB` |
| Accent         | `#C13E6B` |
| Hover          | `#D1547E` |
| Completed      | `#3FA66B` |
| Warning        | `#F0B429` |

The accent is a runtime CSS variable, so it can be re-themed from Settings
(Blossom, Burgundy, Plum, Forest, Indigo, Slate).

## Tech stack

- **Next.js** (App Router) + **TypeScript** (strict, no `any`)
- **TailwindCSS** with a bespoke token layer
- **shadcn/ui**-style primitives on **Radix** (accessible dialogs, labels)
- **Framer Motion** for all animation
- **Lucide** icons
- **Dexie.js** (IndexedDB) — offline-first local storage
- **React Hook Form** + **date-fns**

No backend. Everything is stored locally in IndexedDB.

## Features

**Plan** — a calendar homepage where each day opens its own full-screen
workspace: Today's Focus (max 3 intentions), tasks, habits and autosaving notes.

**Tasks** — priority, category, color and notes; completion animates and
finished tasks sink to the bottom. Filter by priority, category or state.

**Templates** — spin up a whole task group in one tap (Placement Prep, Coding,
Gym, University, Hackathon, Deep Work, Morning/Night routines) and create your
own.

**Habits** — global daily habits with streak counters and per-day check-off.

**Recurring tasks** — daily, weekdays, weekends, weekly or monthly; instances
appear automatically on matching days.

**Reminders** — optional browser notifications, in 5/15/30/60 minutes or at a
specific time.

**Daily review** — a calm 10 PM reflection with completion stats and four
prompts, then _Plan Tomorrow_ to jump straight into the next day.

**Insights** — a small, non-dashboard view: current streak, weekly tasks &
habits, completion %, and a calendar heatmap.

**Search** — instant cross-day search over titles, notes and categories.

**Yours to keep** — export/import your entire database as JSON; re-theme the
accent color; everything stays on your device.

### Keyboard shortcuts

| Key      | Action              |
| -------- | ------------------- |
| `N`      | New task            |
| `/`      | Search              |
| `← / →`  | Previous/next month |
| `Ctrl+S` | Save (autosaves)    |
| `Esc`    | Close a modal       |

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

> **Install note:** if `registry.npmjs.org` is blocked on your network, install
> once via a mirror: `npm install --registry=https://registry.npmmirror.com/`.
>
> No environment variables are required — there is no backend to configure.

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Architecture

```
src/
  app/                 # App Router entry (calendar is the homepage)
  components/
    calendar/          # Calendar hero: header, animated grid, day cells, today preview
    day/               # Full-day workspace modal
    tasks/             # Task list/item, filter bar, add-task modal + form
    habits/            # Global habits with streaks
    templates/         # Template manager
    review/            # Today's Focus + the 10 PM Daily Review
    stats/             # Insights modal with heatmap
    search/            # Cross-day search overlay
    notes/             # Autosaving markdown notes
    layout/            # Top nav, floating action button, settings
    ui/                # Reusable primitives (button, input, modal, ring, toast…)
  hooks/               # Live-bound data + behavior (useDay, useHabits, useStats, …)
  lib/                 # db (Dexie), date/recurrence/status helpers, constants
  types/               # Domain types
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design.

The unit of state is a **day** — a self-contained record keyed by its ISO date
(`yyyy-MM-dd`) holding its tasks, focus items, habits and notes. The UI never
touches Dexie directly; all reads flow through live queries and all writes
through transactional helpers, so every open view stays in sync.

## Deliberately not built

No authentication, no backend, no AI, no chat, no projects, no Kanban, no
sidebar, no telemetry. Daily OS is a calm, single-purpose tool — the fewer
things it does, the better it does them.

## PWA & offline

Daily OS is a fully installable Progressive Web App:

- **Web manifest** (`app/manifest.ts`) with standalone display, themed splash,
  and `192` / `512` / maskable icons.
- **Service worker** (`public/sw.js`) caches the app shell — network-first for
  navigations, cache-first for static assets — so the app opens with no
  connection. Your data already lives locally in IndexedDB.
- **Install prompt** — a calm, dismissible banner appears when the browser
  offers installation (Chrome, Edge, and other Chromium browsers). On iOS,
  use Safari → Share → *Add to Home Screen*.

The service worker registers in production builds only, so local development
never serves stale assets.

## Deployment

Daily OS is a static-friendly Next.js app with no backend, so it deploys almost
anywhere:

- **Vercel** — import the repo; zero configuration.
- **Netlify** — use the official Next.js runtime; build `npm run build`.
- **Any static/Node host** — `npm run build` then `npm run start`.

There are **no environment variables** to configure. For the service worker and
install prompt to work, serve over **HTTPS** (all the above do by default).

## FAQ

**Where is my data stored?**
Entirely in your browser's IndexedDB. Nothing is sent anywhere — there is no
server and no account. Back it up any time from Settings → Export.

**Does it work offline?**
Yes. Daily OS is offline-first and installable as a PWA. Once loaded (or
installed), it runs with no connection.

**How do I move my data to another device/browser?**
Settings → Export a JSON backup, then Settings → Import it on the other device.

**Will there be sync / accounts?**
Not in a way that compromises privacy. Optional end-to-end-encrypted sync is on
the [roadmap](./ROADMAP.md); accounts and tracking are explicitly out of scope.

**Is it really free?**
Yes — MIT licensed and open source.

## Known limitations

- Data is per-browser and per-device; clearing site data erases it (export to
  keep a backup).
- Reminders fire via the Notification API while the app is open; scheduling that
  survives a fully closed app is on the roadmap.
- Monthly recurrences on the 29th–31st skip months without that date.
- Install icons are currently SVG; PNG/maskable variants are a planned addition.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for what's shipped, what's being considered, and
what is deliberately out of scope.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and
[ARCHITECTURE.md](./ARCHITECTURE.md). Please keep changes aligned with the calm,
calendar-native philosophy.

## License

[MIT](./LICENSE) © Daily OS contributors.
