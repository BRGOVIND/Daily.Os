# Review and commit plan

Branch: `mobile-first-polish`. No files were staged or committed during this
review. Run these PowerShell commands from the repository root **only after**
reviewing the full working-tree diff. Each `git add` names reviewed paths; no
bulk add is used. Stop if `git diff --cached` shows an unexpected file or secret.
The eight groups below account for every modified or untracked source path at
the time of this plan.

The API and mail reliability changes share newly created source files. They
therefore form one backend commit with ordinary whole-file staging. Splitting
them into separate, independently buildable commits would require reconstructing
earlier file versions in the index. The commands below keep the complete backend
coherent; the owner can defer that commit until the email implementation is
reviewed.

## 1. Optional sync backend, contracts, dependencies, and durable mail

Includes the workspace and lockfile, shared protocol, Fastify API, Better Auth,
PostgreSQL migrations, encrypted mail outbox, worker, status command, and
integration tests.

```powershell
$group = @(
  '.gitignore','package.json','package-lock.json',
  'packages/contracts/package.json','packages/contracts/src/index.ts',
  'apps/api/package.json','apps/api/tsconfig.json',
  'apps/api/migrations/000_auth.sql','apps/api/migrations/001_sync.sql','apps/api/migrations/002_mail_outbox.sql',
  'apps/api/src/auth.config.ts','apps/api/src/auth.ts','apps/api/src/config.ts','apps/api/src/database.ts',
  'apps/api/src/mail-queue.integration.test.ts','apps/api/src/mail-queue.ts','apps/api/src/mail-status.ts',
  'apps/api/src/main.ts','apps/api/src/migrate.ts','apps/api/src/server.ts',
  'apps/api/src/sync-store.ts','apps/api/src/sync.integration.test.ts'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "feat: add optional sync API and durable authentication mail"
```

## 2. Local sync persistence

Includes Dexie v7, transactional outbox writes, sync data models, local
operations, timing counters, and migration tests.

```powershell
$group = @(
  'src/lib/db.ts','src/lib/db.migration.jsdom.test.ts','src/lib/commitTask.ts',
  'src/sync/model.ts','src/sync/outbox.ts','src/sync/local.jsdom.test.ts','src/sync/metrics.ts'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "feat: persist selected local changes for sync"
```

## 3. Sync client and account interface

Includes upload/download, conflict and link controls, account settings,
reset-password page, app-shell integration, and component tests.

```powershell
$group = @(
  'src/sync/api.ts','src/sync/client.ts','src/sync/client.jsdom.test.ts','src/sync/link.ts',
  'src/components/sync/SyncController.tsx','src/components/sync/SyncSection.tsx',
  'src/components/AppShell.tsx','src/components/AppShell.jsdom.test.tsx',
  'src/components/layout/SettingsModal.tsx','src/app/reset-password/page.tsx',
  'src/components/preloadAppShellDialogs.test-helper.ts'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "feat: add optional account sync controls"
```

## 4. Profile transitions and dashboard behavior

Includes safer profile switching/deletion, entry-flow feedback, layout
adjustments, and regression tests.

```powershell
$group = @(
  'src/components/entry/EntryFlow.tsx','src/components/entry/EntryFlow.jsdom.test.tsx',
  'src/components/profile/ProfileContext.tsx','src/components/profile/ProfilesSection.tsx',
  'src/components/dashboard-interaction.jsdom.test.tsx',
  'src/components/perf-rerender.jsdom.test.tsx'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "fix: make profile transitions and dashboard behavior safer"
```

## 5. Backup and restore

Includes backup format validation, atomic settings restore, and protection for
profiles with sync history.

```powershell
$group = @('src/lib/backup.ts','src/lib/backup.jsdom.test.ts','src/lib/constants.ts','src/components/layout/DataSection.tsx')
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "fix: validate backups and restore settings atomically"
```

## 6. Offline cache and desktop metadata

Includes service-worker restrictions for token-bearing URLs, static export
configuration, and accurate Tauri sync limitations.

```powershell
$group = @(
  'next.config.mjs','scripts/sw.template.js','src/pwa/service-worker.test.ts',
  'src-tauri/src/lib.rs','src-tauri/tauri.conf.json'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "fix: protect offline cache and clarify desktop sync scope"
```

## 7. Architecture and operations documentation

Includes protocol limits, mail operations, staging and desktop acceptance
checks, and current architecture.

```powershell
$group = @(
  'ARCHITECTURE.md','README.md','ROADMAP.md',
  'docs/ARCHITECTURE.md','docs/NATIVE_ARCHITECTURE.md','docs/WORKSPACE_OS.md',
  'docs/MASTER_PLAN.md','docs/SYNC.md','docs/EMAIL_OPERATIONS.md',
  'docs/STAGING.md','docs/DESKTOP_SYNC_VERIFICATION.md'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "docs: describe sync architecture and operational gates"
```

## 8. Quality, release notes, and collaboration guidance

Includes CI PostgreSQL/Mailpit testing, test timeout, release checklist,
changelog, and contributor guidance.

```powershell
$group = @(
  '.github/workflows/ci.yml','vitest.config.mts','CHANGELOG.md','CONTRIBUTING.md',
  'docs/COLLABORATION.md','docs/CONTRIBUTING.md','docs/RELEASE.md','docs/COMMIT_PLAN.md'
)
git add -- $group
git diff --cached --check
git diff --cached
git commit -m "chore: document release checks and run API integration in CI"
```

After the last commit, run `git status --short` and the release commands in
[RELEASE.md](RELEASE.md). Do not push or deploy until staging and installed-app
gates have been completed separately.
