# §3 — Scheduler & Cron Audit

**Goal:** scheduled tasks never overlap, never hog CPU, run at the right
frequency, and never block the scheduler process itself. A scheduler blocked on
one long task silently delays every other task behind it.

## 3.1 Schedule definitions

Read every `->command()`, `->job()`, `->call()`, `->exec()` in the schedule.
For each entry:

- [ ] `->withoutOverlapping()` present? 🔴 if missing on any task >1s runtime
- [ ] `->runInBackground()` present? 🔴 if missing on tasks that take >5s
- [ ] `->onOneServer()` present in multi-server setup? 🔴 if missing
- [ ] Frequency: running more often than it needs to? 🟠
- [ ] Uses `->between()` / `->when()` to skip off-hours? 🟡 (suggestion)
- [ ] `->call(fn)` doing heavy work inline? 🟠 — move to a dispatched job
- [ ] Any `->exec()` spawning shell processes? 🟠 (document)
- [ ] Cron entry present? `* * * * * php artisan schedule:run >> /dev/null 2>&1`
      — check for double-scheduling or a missing entry. 🔴 if missing entirely.

Then build **one row per task** — this table goes in the report:

| Task | Frequency | Work per run | Typical duration | Overlap risk | DB impact | Redis impact | Jobs dispatched |
|---|---|---|---|---|---|---|---|

Duration close to (or above) frequency means it never catches up 🔴. A task
that scans the **whole table every run** to find a few new rows 🟠 → process
incrementally from a checkpoint (last processed ID / timestamp stored in
cache or a table) with `chunkById`.

## 3.2 Artisan commands used in the schedule

For each Command in `app/Console/Commands/`:

- Unbounded Eloquent queries without `->chunk()` / `->cursor()`? 🔴
- Outbound HTTP calls synchronously? 🟠 — move to a job
- Holds DB connections open for its full runtime? 🟠
- Logs excessively (every row processed)? 🟡
- Respects `$this->option('--tenant')` for multi-tenant runs? (note if MT)

## 3.3 Multi-server scheduling

- A cache store that supports atomic locks is configured (required for
  `->onOneServer()`)? 🔴 if not. The env key is `CACHE_STORE` in Laravel 11+
  (not the old `CACHE_DRIVER`). `redis` and `database` both provide atomic locks;
  `file`/`array` do **not** — those break `onOneServer()`.
- `cache.lock_store` points to an atomic store (redis or database, not file/array)? 🟠
- Every server points at the **same** central cache server? 🔴 if not — Laravel
  docs require it for `withoutOverlapping()` and `onOneServer()`; per-host
  Redis means each host takes its own lock and the task runs N times.
- Worker-only nodes (extra queue servers, worker containers) also running
  `schedule:run`? 🟠 — run the scheduler on one designated host (or rely on
  `onOneServer()` for every task, not just some).

## 3.4 Housekeeping tasks that should be scheduled

Check the schedule for these; each missing one is 🟡 (cross-ref §2):

- `horizon:snapshot` every five minutes (if Horizon) — metrics are empty without it
- `queue:prune-failed --hours=…` daily
- `queue:prune-batches --hours=48 --unfinished=72 --cancelled=72` daily (if batches used)
- `queue:monitor <conn:queue>,… --max=N` every minute, unless Horizon `waits`
  notifications cover alerting
- `model:prune` daily, if any model uses `Prunable` / `MassPrunable`

## Output for §3

- Per-command finding table
- Prescribe an annotated schedule block with all guards applied
