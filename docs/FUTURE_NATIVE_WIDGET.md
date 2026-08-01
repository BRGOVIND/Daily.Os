# Future: a native home-screen widget for Daily OS

This document is an honest investigation of the request "add an Android
home-screen widget." The short answer for the current product is:

> **A true home-screen widget is not possible from a Progressive Web App.** It
> requires native (or hybrid-native) code. Daily OS is a pure PWA today, so the
> widget is documented here as a future, native-only capability — it is **not**
> shipped or faked in the app.

The rest of this doc explains why, how such a widget *would* work, how its data
would stay in sync with the PWA, and the concrete architectures and roadmap that
would deliver it.

---

## Why a PWA cannot ship a home-screen widget

Home-screen widgets are drawn and updated by the operating system's launcher,
not by a web page. They live entirely outside the browser sandbox:

- **Android** widgets are built with `AppWidgetProvider` + `RemoteViews` (or, on
  Android 12+, Jetpack Glance). The layout is a restricted, serializable view
  tree the launcher inflates in its own process. A website has no access to this
  API — there is no web platform surface for `AppWidgetProvider`.
- **iOS** widgets are WidgetKit extensions written in SwiftUI, compiled into a
  signed app bundle and distributed through the App Store. Safari/PWA code
  cannot register a WidgetKit timeline.
- The nearest web-platform feature, **`Widgets` via the Web App Manifest**
  (`widgets` member) targets *Windows 11 Widgets Board* dashboards through
  service-worker driven Adaptive Cards — **not** the Android or iOS home
  screen. Support is limited and it does not satisfy "an Android home-screen
  widget."

So anything that renders on the Android/iOS home screen must ship native code in
an installable package. That is the crux of the limitation.

What a PWA *can* do on a home screen — and what Daily OS already does — is place
an **app icon** that launches the standalone experience, plus (on some
launchers) long-press **app shortcuts** from the manifest `shortcuts` member.
Those are entry points, not live widgets.

---

## How the widget would work

A Daily OS widget's job is glanceable, not interactive-heavy: show *today* at a
glance and offer one or two quick actions.

Proposed surfaces (sizes as Android cells):

- **Small (2×1)** — date + "N of M tasks done" ring, matching the in-app
  activity ring.
- **Medium (4×1)** — the above plus today's top focus item.
- **Large (4×2)** — today's focus list (max 3) and next 2 tasks, each tappable.

Interaction model:

- Tapping the widget body deep-links into the app at today's day
  (`dailyos://day/2026-07-25` or an `https://` App Link / Universal Link).
- A checkbox tap on the large widget fires a broadcast/intent that toggles the
  task and asks the OS to refresh the widget.
- The widget refreshes on a schedule (Android `updatePeriodMillis` / WorkManager;
  iOS WidgetKit timeline entries) and on demand after a data change.

Crucially, the widget renders from a **local snapshot** of today's data, so it
works offline and is instant — consistent with Daily OS's offline-first design.

---

## How data would sync between the PWA and the widget

This is the hard part, because today the source of truth is **IndexedDB inside
the browser**, which native widget code cannot read directly. The data has to be
promoted to a store both sides can reach.

Three viable models, from least to most invasive:

1. **Shared local store (recommended for a hybrid wrapper).**
   Wrap the existing web app in a native shell (see Options below). The web
   layer writes a compact "today snapshot" (date, task counts, focus items) to a
   bridge the native side can read:
   - Android: a `SharedPreferences`/DataStore file or a small Room table, written
     via a JS bridge; the widget reads it and calls
     `AppWidgetManager.updateAppWidget`.
   - iOS: an **App Group** container shared between the app and the WidgetKit
     extension; the web layer writes JSON there, the widget reads it and reloads
     its timeline via `WidgetCenter.shared.reloadAllTimelines()`.
   No server required; stays fully local and private.

2. **Background sync via a service.**
   If the widget must update while the app is closed, a native background worker
   (WorkManager / BGTaskScheduler) periodically reads the shared snapshot and
   re-renders. Still local; just decouples refresh from the app being open.

3. **Optional cloud sync (only if accounts ever exist).**
   If Daily OS ever adds the roadmap's end-to-end-encrypted sync, the widget
   could hydrate from that same encrypted store. This is explicitly *not*
   required for a widget and is out of scope for the privacy-first core.

The snapshot the web app would export is tiny and derived — e.g.:

```json
{
  "date": "2026-07-25",
  "tasksDone": 3,
  "tasksTotal": 5,
  "focus": ["Ship Phase 3.5", "Gym", "Read 20 pages"]
}
```

Keeping the bridge to a derived snapshot (not the whole DB) keeps IndexedDB the
single source of truth and avoids two-way write conflicts.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Daily OS web app (Next.js PWA)              │
│  • IndexedDB (Dexie) — source of truth       │
│  • writes a "today snapshot" on each change  │
└───────────────┬─────────────────────────────┘
                │ JS ↔ native bridge (hybrid shell)
                ▼
┌─────────────────────────────────────────────┐
│  Native shell (Capacitor / TWA / RN / etc.)  │
│  • persists snapshot to shared store:        │
│      Android: DataStore / Room               │
│      iOS: App Group container                │
└───────────────┬─────────────────────────────┘
                │ read + refresh
                ▼
┌─────────────────────────────────────────────┐
│  OS widget process                           │
│  Android: Glance / RemoteViews AppWidget     │
│  iOS: WidgetKit SwiftUI extension            │
│  • renders snapshot, deep-links into app     │
└─────────────────────────────────────────────┘
```

The web codebase stays the product; the native shell is a thin host whose only
extra responsibility is mirroring a snapshot into OS-reachable storage and
hosting the widget extension.

---

## Technology options

| Option | Widget support | Reuse of current web app | Effort | Notes |
| --- | --- | --- | --- | --- |
| **Capacitor** (hybrid) | ✅ via a native plugin per platform | ✅ high — wraps the existing Next.js app in a WebView | Medium | Best balance; write a small widget plugin + snapshot bridge. Recommended. |
| **Trusted Web Activity (TWA)** (Android) | ⚠️ limited — TWA is Chrome-in-a-shell; widget needs added native module alongside it | ✅ high | Medium | Android-only; still need native widget + a way to share data out of the WebView. |
| **React Native / Expo** (with `react-native-android-widget`, `expo-apple-targets`) | ✅ good on both | ❌ low — UI would be rebuilt in RN | High | Strong widgets, but abandons the web UI; only worth it for a native rewrite. |
| **Fully native (Kotlin + Swift)** | ✅ best | ❌ none — full rewrite | Very high | Maximum fidelity, maximum cost; not justified for a calm side tool. |
| **Manifest `widgets` member** | ❌ not home-screen (Windows Widgets Board only) | ✅ | Low | Doesn't meet the requirement; note it, don't rely on it. |

---

## Recommended approach

**Wrap the existing PWA in Capacitor and add a thin, per-platform widget.**

Rationale:

- Keeps the current Next.js codebase as the single product — no UI rewrite.
- Adds exactly two small native pieces: a **snapshot bridge** (JS → shared
  store) and a **widget extension** (Android Glance + iOS WidgetKit).
- Preserves the offline-first, no-server, privacy-first character — the widget
  reads a local snapshot, nothing leaves the device.
- Ships to both Play Store and App Store from one shared web core.

Explicitly **not** recommended: faking a "widget" inside the web app (e.g. a
screenshot or a browser-tab pinned view), or claiming widget support the
platform can't deliver. Daily OS should not pretend to do something the runtime
forbids.

---

## Future roadmap

1. **Now (shipped):** PWA install, standalone launch, app icon on the home
   screen, and manifest `shortcuts` as quick entry points. No widget — honestly
   documented here.
2. **Phase A — hybrid shell:** wrap the app in Capacitor; verify parity, deep
   links (`dailyos://day/<date>`), and store readiness. No widget yet.
3. **Phase B — snapshot bridge:** on every data change, write the derived
   "today snapshot" to a shared store (Android DataStore / iOS App Group).
4. **Phase C — Android widget:** Glance-based small/medium/large widgets reading
   the snapshot, with tap-to-open and a WorkManager refresh.
5. **Phase D — iOS widget:** WidgetKit SwiftUI extension with the same surfaces,
   `reloadAllTimelines()` on change.
6. **Phase E — interactive actions:** toggle a task directly from the large
   widget (Android RemoteViews action / iOS App Intents).

Until Phase C/D land, the correct product behavior is exactly what Daily OS does
today: a fast, installable PWA with a proper home-screen **icon** — and this
document as the honest record of what a real widget would take.
