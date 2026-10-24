# Optional sync staging runbook

Status: **NOT VERIFIED on hosted infrastructure.** Keep the production frontend
without `NEXT_PUBLIC_SYNC_API_URL` until every acceptance check below passes.
The local-only app remains usable.

## Prepare staging

1. Use a separate HTTPS API origin and a same-site HTTPS frontend origin, such
   as `api.staging.example.com` and `app.staging.example.com`. Set
   `NEXT_PUBLIC_SYNC_API_URL` only in the staging frontend build. Cross-site
   cookies are not verified by this app.
2. Provision a staging PostgreSQL database and a restricted application role.
   Configure at least daily encrypted backups with 30-day retention and point-in-
   time recovery if available. Record the provider's actual schedule, retention,
   encryption, and restore instructions. Set connection limits so each API replica's 10-connection pool
   fits below the database limit with headroom for migrations and monitoring.
3. Inject `DATABASE_URL`, `BETTER_AUTH_SECRET`, `MAIL_QUEUE_KEY`,
   `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `SMTP_URL`, and `MAIL_FROM` through the
   host's secret manager. Generate distinct staging secrets. Never bake them
   into the frontend, logs, repository, or container image. `BETTER_AUTH_URL`
   must be the public API origin. `CLIENT_ORIGINS` must list exact frontend
   origins. Set `API_HOST=0.0.0.0` only behind the trusted proxy and set `PORT`.
4. Require HTTPS at the proxy and confirm forwarded scheme/host, `Secure` and
   same-site session-cookie behavior in the browser. Confirm CORS only allows
   listed origins and credentialed requests. Confirm wrong or missing Origin on
   writes receives `403`; CSRF/origin checks must remain enabled. Check the
   120-request/minute API limit, the tighter authentication/reset limits, and
   the 2 MB body limit against staging traffic.
5. Build with `npm ci`, `npm run build:api`; run
   `npm run migrate:sync -w @daily-os/api` against staging before starting
   `npm run start -w @daily-os/api`. Migrations are versioned, idempotent, and
   guarded by an advisory transaction lock. Take a database snapshot first.
   There is no destructive down migration: on failure, stop rollout and restore
   the pre-migration snapshot to an isolated database, inspect it, then plan a
   forward fix. Do not claim restore readiness until one isolated restore and
   application readback have succeeded.
6. Start one API process, then scale replicas if needed. Each process owns one
   mail polling loop. Use SIGTERM for graceful shutdown. Check `/health` for
   process liveness and `/ready` for database/outbox access. Use
   `npm run mail:status -w @daily-os/api` from a restricted operator shell.

## Acceptance checks

All items below are **NOT VERIFIED** until executed on staging with disposable
accounts and a staging mail domain. Do not use real user data.

- Sign up; check that the API returns after a queued intent exists. Confirm
  verification mail reaches the test mailbox, link verifies once, and the
  account can sign in. Confirm an expired link fails.
- Request password reset for known and unknown addresses; compare public status,
  body, and approximate timing. Use the known link once, then confirm old
  sessions are revoked. Repeat while staging SMTP is temporarily unavailable:
  queue must retain the job and retry. Distinguish SMTP acceptance from inbox
  delivery in monitoring.
- With the staging SMTP provider, send verification and reset links to two
  controlled mailboxes on different domains. Check delivery, spam placement,
  sender authentication, and provider bounce/deferral records. Force a temporary
  4xx failure and a permanent 5xx failure in a test provider or SMTP sink;
  confirm retry and terminal queue states.
- Link exactly one test profile. Upload selected tasks, notes, focus items, and
  reviews; open another browser and pull them. Confirm excluded data stays
  local. Take a JSON backup before link.
- Edit offline, restart the browser, reconnect, and confirm queued operations
  upload once. Simulate concurrent edits and inspect the conflict choices.
  Confirm account isolation across two disposable accounts.
- Unlink and confirm local data remains and no further upload occurs. Delete the
  cloud account with confirmation and check server cascades; confirm local data
  remains. Test a stranded-device reset with a backup.
- Verify logging contains no passwords, addresses, reset URLs, tokens, note
  text, or task text. Alert on unavailable `/ready`, sustained mail backlog,
  terminal mail failures, and API errors. Limit log retention and access.
- Restore a fresh staging backup to an **isolated** database and check selected
  test account and sync records before calling recovery tested. Repeat this
  restore drill monthly once live.

Account deletion removes live account-scoped sync rows by database cascade;
local data stays on devices. A previously queued mail may still be submitted
before its one-hour expiry, but its account action will fail after deletion.
Queued payloads and content-free terminal records need a retention policy.
Database backups retain
deleted data until their documented expiry, so publish that schedule before
accepting real accounts.

## Rollback and release gate

If a serious issue appears, remove `NEXT_PUBLIC_SYNC_API_URL` from the next web
build and disable the hosted API ingress; stop workers cleanly and retain the
database for investigation. Already-linked clients keep local data and pending
outbox entries. Do not erase the database or IndexedDB as a rollback shortcut.

Production sync stays disabled until staging acceptance, provider mail delivery,
backup restoration, security checks, and a rollback drill are signed off. The
installed Windows desktop app needs its own gate in
[DESKTOP_SYNC_VERIFICATION.md](DESKTOP_SYNC_VERIFICATION.md).
