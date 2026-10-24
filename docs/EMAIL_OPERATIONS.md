# Authentication email operations

The API queues verification and password-reset mail in PostgreSQL. The API's
`200` response means the request was processed and, for an existing eligible
account, the mail intent was committed. It does **not** mean SMTP accepted the
message or that the recipient received it. The reset response is the same for
known and unknown addresses. Queue failures return a generic `503` for both.

Signup creates the account through Better Auth, then waits for its mail callback
to commit an outbox row. If that write fails, the API returns `503`; the account
may already exist. The user should use **Resend verification** when service
returns. Password reset uses a dedicated API route because Better Auth otherwise
creates the reset token before calling the mail callback. That route creates the
verification row and outbox row in one PostgreSQL transaction. Better Auth still
validates and consumes reset tokens, hashes the new password, and revokes old
sessions. Verification links are signed by Better Auth and expire after one hour;
reset tokens also expire after one hour.

The outbox encrypts recipient, subject, and URL with AES-256-GCM. `MAIL_QUEUE_KEY`
must be a separately generated 32-byte key encoded as 64 hexadecimal characters.
Keep this key in the deployment secret manager and backed up securely: losing it
makes pending mail undecryptable. Retain the same key across API replicas and
restarts. Key rotation needs an explicit drain or re-encryption procedure; do not
rotate it by simply changing the environment variable. Better Auth's own reset
verification table still stores its token identifier under its normal database
access controls. Limit database and backup access accordingly.

Run migration `002_mail_outbox.sql` through `npm run migrate:sync -w @daily-os/api`
before starting the new API. Startup requires `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `MAIL_QUEUE_KEY`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`,
`SMTP_URL`, and `MAIL_FROM`. Local-only use of the frontend needs none of them.
The API's `/ready` route checks access to the outbox table.

The API starts one polling worker per process after the HTTP listener starts.
Workers claim due rows with `FOR UPDATE SKIP LOCKED` and a 90-second lease, so
multiple API replicas can share the queue. A graceful SIGINT/SIGTERM stops
polling and waits for the current send attempt. A crashed worker's lease can be
reclaimed. SMTP timeouts are shorter than the lease. A crash after SMTP accepts
a message but before PostgreSQL marks it sent may cause a duplicate delivery;
this queue provides **at-least-once** SMTP submission, not exactly once.

Transient failures retry up to five attempts with jittered exponential delay,
starting near 10 seconds and capped near 30 minutes. SMTP 5xx, authentication,
envelope, and message errors are terminal. Expired links are never submitted.
Terminal jobs and sent jobs have their encrypted payload cleared. Logs contain
only `mail queued`, `mail smtp_accepted`, `mail retry_scheduled`,
`mail terminal_failure`, `mail worker_error`, or `mail reset_request_failed`.
SMTP acceptance is not inbox delivery. No token, URL, body, or address is logged.

Deleting an account removes its live sync and user rows. Already queued mail is
not linked to those rows, so a previously queued message may still reach the
mailbox before its one-hour expiry; its verification or reset action will fail
after account deletion. Account-deletion acceptance checks should verify this
behavior and keep queue retention short.

To inspect the queue without exposing content:

```powershell
npm run mail:status -w @daily-os/api
```

It prints counts and oldest age by state. Alert on queued jobs older than 10
minutes, any growing failed count, or repeated worker errors. Investigate SMTP
provider logs separately, without copying message content into application
logs. Do not manually retry expired reset links; request a fresh link instead.
Keep old terminal rows only as long as the incident retention policy requires,
then delete them with a reviewed maintenance procedure.

For local tests use an isolated PostgreSQL database and Mailpit or the test fake
sender. Do not use a production `DATABASE_URL`. Generate temporary secrets for
the test session, migrate, then run `npm test -w @daily-os/api`. Tests cover
crash/restart pickup, transient and terminal SMTP errors, duplicate claims,
expiry, queue failures, signup, verification, and password reset. A local SMTP
sink does not verify real provider delivery or spam placement.
