# Contributing

Daily OS is a personal, offline-first project. These notes keep the codebase
consistent for anyone (including future-you) working on it.

## Ground rules

- **Offline-first, always.** No backend, no auth, no cloud sync, no AI, no RAG,
  no chat. Every feature must work fully offline.
- **Don't bloat it.** Daily OS is at feature maturity. Prefer polishing existing
  surfaces over adding new ones.
- **Type safety is non-negotiable.** `strict` TypeScript, **no `any`**. Model
  new domain shapes in `src/types/index.ts`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Quality gate — all three must pass before a change is done:

```bash
npx tsc --noEmit   # types
npx next lint      # eslint
npx next build     # production build
```

## Conventions

- **Pure domains stay pure.** Code in `src/engine/` and `src/workspace/` must not
  import React, Dexie or components — only `@/types`, `@/lib` leaf helpers, each
  other's pure exports and date-fns. Put a plain data snapshot in, get typed
  outputs out.
- **UI never touches Dexie.** All persistence goes through `lib/db.ts` helpers
  and the hooks in `src/hooks/`.
- **One motion language.** Import from `src/lib/motion.ts`; don't hand-tune
  transitions. New animation must be reducible via `MotionProvider`.
- **One design language.** Use the tokens and primitives in `DESIGN_SYSTEM.md`
  and `src/components/ui/`. Match surrounding spacing, radius and state styles.
- **Migrations are additive.** Bump the Dexie version in `lib/db.ts`, keep new
  fields optional, and extend `lib/backup.ts` so export/import round-trips them.
- **Naming.** Hooks `useThing`; pure builders `buildThing` / `computeThing`;
  types are nouns; files match their default export.
- **Comments** explain *why*, not *what*. Keep them where a decision is
  non-obvious (derived-vs-stored, migration intent, focus management).

## Adding a domain feature (checklist)

1. Add/extend types in `src/types/index.ts` (optional, back-compatible fields).
2. Add DB helpers + a migration in `lib/db.ts`; update `lib/backup.ts`.
3. Implement the logic as **pure functions** in the relevant domain folder.
4. Bridge to the UI with a hook in `src/hooks/`.
5. Build the UI from `ui/` primitives with proper empty/loading/error states.
6. Run the quality gate; update the relevant `docs/`.

## Git

Changes are reviewed and committed **manually** by the repository owner. Do not
add co-author or AI-attribution trailers. Leave work unstaged unless asked.
