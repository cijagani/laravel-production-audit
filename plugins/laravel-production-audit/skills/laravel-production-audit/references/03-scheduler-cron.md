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

## Output for §3

- Per-command finding table
- Prescribe an annotated schedule block with all guards applied
