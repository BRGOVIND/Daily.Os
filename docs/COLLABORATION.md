# Collaboration

Phase 8 turns Daily OS into a **collaborative platform — additively**. Personal,
offline, single-user mode is untouched: every collaboration table starts empty
and every capability check passes for the local owner, so the app behaves exactly
as it did before. Collaboration only *activates* when a workspace gains members.

> **Design stance.** Daily OS is offline-first with no backend, no cloud and no
> auth by product mandate. This phase therefore builds the full collaboration
> **architecture and abstractions** with a **local/offline default transport and
> auth provider** — real-time across windows of one device via BroadcastChannel,
> with **no server**. A networked backend (self-hosted sync relay / SSO) is the
> documented plug-in point behind the same interfaces; it is intentionally *not*
> wired, because doing so would break the offline/no-backend guarantee.

## Architecture

```
UI (Share tab · CommentsThread · activity feed)
        │  depends only on interfaces
        ▼
src/collab/                       ← pure domain + abstractions
  identity/auth.ts     AuthProvider  →  LocalAuthProvider (guest, offline)
  permissions/         can(), role capability matrix, canAssignRole
  sync/transport.ts    SyncTransport →  LocalTransport | BroadcastChannelTransport
  sync/queue.ts        Lamport clock, resolveConflict, orderMutations (pure)
  activity/  comments/ formatting & mention parsing (pure)
        │
        ▼
hooks (useIdentity · useCollab · useComments · useActivity · useSyncStatus)
        │
        ▼
Dexie v5: identity · members · comments · activity · outbox
```

The domain layer imports only `@/types` and its own modules — never React or
Dexie — mirroring the Intelligence Engine and Workspace OS. The UI depends on the
`AuthProvider` and `SyncTransport` **interfaces**, never on a concrete provider
(Module 1: "do not tightly couple UI to any provider").

## Data model (Dexie v5, additive)

| Table | Shape | Notes |
| --- | --- | --- |
| `identity` | one `"me"` row: `actorId`, `name`, `handle` | per-device actor id for authorship & conflict resolution |
| `members` | `workspaceId`, `actorId`, `role`, `status`, `inviteCode` | a workspace with >1 member is `shared` |
| `comments` | `workspaceId`, `[targetType+targetId]`, `body`, `mentions` | threads on task / mission / workspace / journal |
| `activity` | `workspaceId`, `kind`, `actor`, `summary` | the activity feed |
| `outbox` | `Mutation` with `lamport`, `status` | the offline sync queue |

Existing entities gained optional, back-compatible fields: `Task.assigneeId`,
`Workspace.shared` / `Workspace.ownerId`. Every new field is optional, so
pre-Phase-8 data and older JSON backups load untouched; export/import round-trips
members, comments and activity.

## Permission model (Modules 2 & 10)

Four roles, a pure capability matrix (`can(role, cap)`):

| Capability | viewer | editor | admin | owner |
| --- | :-: | :-: | :-: | :-: |
| view · comment | ✓ | ✓ | ✓ | ✓ |
| edit content · assign | | ✓ | ✓ | ✓ |
| invite · manage roles · remove member | | | ✓ | ✓ |
| delete workspace · transfer ownership | | | | ✓ |

`canAssignRole` prevents privilege escalation — you can never grant a role at or
above your own rank. Every mutating collaboration action in the UI is gated
through `can(...)`. **In personal mode there are no members, so the local user is
treated as `owner` and all checks pass.**

Client-side checks are a UX guardrail, **not** a trust boundary — see Security.

## Sync model (Modules 3 & 9)

- **Transport abstraction.** `SyncTransport` = `connect / disconnect / send /
  subscribe / status`. Ships with `LocalTransport` (no-op, offline) and
  `BroadcastChannelTransport` (real-time across same-device windows/tabs — main
  window ⇄ Quick Capture ⇄ other tabs — with no server). `useSyncStatus`
  connects on mount and reconnects automatically.
- **Live data today.** Comments, members and activity already propagate across
  windows *live* because Dexie's `useLiveQuery` observes shared IndexedDB — so
  multi-window collaboration is real right now, offline.
- **Ordering & conflicts.** The `outbox` is the queue; each mutation carries a
  **Lamport clock** for a deterministic total order across actors without a
  server. Conflicts on the same entity resolve **last-write-wins** by
  `(lamport, timestamp, actorId)` — commutative and associative, so every peer
  converges regardless of delivery order (`resolveConflict`, `mergeById`).
- **Offline queue & recovery.** Mutations enqueue as `pending`; on (re)connect a
  transport flushes `pending(...)` oldest-first and marks them `synced`. Nothing
  is lost across restarts because the queue is persisted in IndexedDB.
- **Optimistic UI.** Local writes apply immediately (the write is the source of
  truth locally); remote mutations merge via the conflict resolver.

## Security model (Module 11)

- **Data ownership.** Everything is local to the device; `Workspace.ownerId` and
  the per-device `actorId` record authorship. Users own and can export their data
  at any time (full or scoped export from Settings).
- **Encryption.** At rest, data sits in the browser/OS-profile-protected
  IndexedDB (and, in the Tauri shell, the app-data directory). A networked
  transport is the layer that would add **transport encryption (TLS)** and,
  ideally, **end-to-end encryption** of mutation payloads — designed for but not
  implemented, since no transport ships.
- **Session handling.** The local provider is sessionless (a guest identity). A
  networked `AuthProvider` owns tokens/refresh via `signIn/signOut/onChange`; the
  UI never sees provider internals.
- **Permission boundaries.** Client `can(...)` checks gate the UI, but the
  **authoritative** boundary must live in the sync backend: a real server
  re-validates every mutation against the actor's role before accepting it. Until
  a backend exists, all peers are same-device and trusted.

## Migration strategy

Dexie **v5** adds five tables; no existing table is touched. `ensureSeeded`
idempotently creates the local `identity`. All added entity fields are optional.
A pre-Phase-8 database upgrades cleanly and keeps working with zero collaboration
data. Backups from earlier phases import fine (collaboration arrays default to
empty).

## What's wired vs. designed

| Wired now (offline) | Designed, needs a backend |
| --- | --- |
| Identity, members, roles, invite codes | Cross-device accounts / SSO (`AuthProvider`) |
| Comments (workspace + mission + drop-in `CommentsThread` for task/journal) | — |
| Activity feed | Server-authored activity fan-out |
| Real-time across same-device windows (BroadcastChannel + live queries) | Cross-device real-time (`SyncTransport` over WebSocket/CRDT) |
| Offline outbox, Lamport ordering, LWW conflict resolution | Server-side conflict authority + E2E encryption |
| Role-based UI gating (`can`) | Server-side permission enforcement |

## Future scaling

The abstractions are the scaling seam:

1. **Add a `SyncTransport`** (WebSocket to a self-hosted relay, or a CRDT/Yjs
   provider) — the mutation queue, Lamport ordering and conflict resolver already
   speak its language; the UI and domain don't change.
2. **Add an `AuthProvider`** for real accounts/orgs; `setAuthProvider(...)` swaps
   it in. The `AccountKind` tiers (guest / personal / shared / organization) are
   already modelled.
3. **Server-authoritative permissions** re-use the same capability matrix on the
   backend.
4. **E2E encryption** wraps mutation payloads before `transport.send`, keeping the
   relay zero-knowledge — consistent with Daily OS's privacy-first stance.

Nothing above changes single-user Daily OS, which remains fully functional,
offline and private.
