# Daily OS — Install Experience & Home‑Screen Widgets

This document is deliberately honest about what the web platform can and cannot
do, so expectations match reality. Nothing here is faked.

## Install experience by platform

| Platform | Install path | In‑app affordance | Standalone | Notes |
| --- | --- | --- | --- | --- |
| **Desktop Chrome** | `beforeinstallprompt` → in‑app **Install** banner, or the browser's install icon in the omnibox | ✅ banner appears when the browser deems the app installable | ✅ opens in its own window | Service worker + manifest + HTTPS required for the prompt. |
| **Desktop Edge** | Same as Chrome (Chromium) — banner or "Apps → Install this site" | ✅ | ✅ | Identical behaviour to Chrome. |
| **Android Chrome** | `beforeinstallprompt` → banner, or ⋮ → **Add to Home screen / Install app** | ✅ | ✅ launches like a native app; safe‑areas respected via `viewport-fit=cover` + `env(safe-area-inset-*)` | Back button navigates web history as normal. |
| **Android Edge** | Same as Chrome (Chromium) | ✅ | ✅ | — |
| **iOS Safari** | **Manual only:** Share → *Add to Home Screen*. iOS never fires `beforeinstallprompt`. | ✅ a **dismissible guidance hint** (not a dead button) — see `PwaController.tsx` | ✅ once added, launches full‑screen with `apple-mobile-web-app-capable` | We deliberately show guidance, never an Install button that would do nothing. |

### Why the iOS handling is what it is
Safari has no programmatic install API. Showing an "Install" button there is a
broken experience. `PwaController` detects iOS (`isIos()`), and when the app is
**not** already running standalone and the hint hasn't been dismissed, it shows a
one‑time, dismissible *"Tap Share → Add to Home Screen"* card. On every other
platform the real `beforeinstallprompt` flow is used.

### Service‑worker updates
`public/sw.js` is **network‑first for navigations** (fresh UI when online,
cached shell offline) and **cache‑first for hashed `/_next/` build assets**
(safe because their URLs change per build). The cache key is versioned
(`daily-os-vN`); the `activate` handler deletes every non‑current cache, so a new
version self‑purges old caches. `skipWaiting()` + `clients.claim()` make a new
worker take control promptly.

> **Gotcha (dev):** the service worker only registers in **production**
> (`PwaController` gates on `NODE_ENV === "production"`). If you previously ran a
> production build on `localhost:3000`, that worker keeps serving the cached app
> even under `npm run dev` on the same origin. Fix: unregister it (DevTools →
> Application → Service Workers → Unregister, then Clear site data), or run dev
> on a different port. This is browser state, not a code bug.

## Home‑screen widgets — the honest truth

**A true Android/iOS home‑screen widget cannot be built with a PWA.** There is
no web API that renders content into the OS home screen. This is a hard platform
limitation, not a Daily OS shortcoming:

- **iOS widgets** require a native app extension (WidgetKit / SwiftUI, App Group
  storage). A PWA/web view cannot register one.
- **Android widgets** require a native `AppWidgetProvider` + `RemoteViews` in an
  installed APK. A PWA has no access to the widget host.

We do **not** fake this. Instead, Daily OS ships the maximum the platform allows:

### What we actually deliver instead
- **Desktop:** installable PWA → standalone window → quick launch from the OS app
  list/taskbar/dock. Deep links work because navigation is standard URL routing
  under `start_url`/`scope` in `manifest.ts`.
- **Android:** installable PWA → standalone, native‑feeling launch, safe‑area
  aware. (Manifest `shortcuts` could add long‑press launcher actions on
  supported launchers — intentionally not added in this phase to avoid scope
  creep; it's a one‑object manifest addition when wanted.)
- **iOS:** proper Add‑to‑Home‑Screen support with full‑screen standalone launch
  and guidance, as above.

### If we want real widgets later: Daily OS Desktop (Tauri)
The desktop shell already exists (`src-tauri/`, Tauri 2). Desktop widgets are
feasible there, unlike in a browser. Required architecture:

1. **A second always‑on‑top, decoration‑less window** declared in
   `tauri.conf.json` (`decorations:false`, `transparent:true`,
   `alwaysOnTop:true`, `skipTaskbar:true`), sized like a widget.
2. **A dedicated lightweight route** (e.g. `/widget/today`) rendering only
   today's focus/tasks — reusing existing hooks, no new data model.
3. **Shared data via the same IndexedDB** the main window uses (both windows are
   the same web origin inside the shell), or a small Rust‑side cache exposed over
   the existing `invoke`/event bridge in `src/lib/native/`.
4. **OS‑specific placement:** on Windows, position above the desktop
   (`WorkerW`)—or simply a movable floating panel; on macOS, a Notification
   Centre widget would still need a native extension, so the cross‑platform
   answer is the floating Tauri window.
5. **Wake/refresh** driven by the existing Tauri event loop + the app's live
   Dexie queries; no polling.

This is documented, **not implemented** — it's out of scope for a
stabilization phase and would be a genuine feature.
