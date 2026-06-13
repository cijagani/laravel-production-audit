# §10 — Concurrency & Locking Audit

**Goal:** no race conditions, no double-processing, atomic increments via Redis,
DB transactions tight and short. The bugs here are the ones that only show up
under load — exactly when you can least afford them.

## 10.1 Duplicate job processing

- `ShouldBeUnique` on jobs that must run once per model/ID? 🔴 if missing on
  obvious cases
- `uniqueId()` returning a meaningful key? 🟠 if generic
- `uniqueFor()` set to an appropriate TTL? 🟡

## 10.2 Race conditions in controllers/services

- `find-then-update` patterns without a DB transaction or lock 🟠
- `Cache::has()` + `Cache::put()` without an atomic lock 🔴 — TOCTOU race.
  → Prescribe `Cache::lock($key)->block($seconds, fn)`.
- `->increment()` used correctly vs `$model->count += 1; $model->save()` in a
  concurrent context 🔴

## 10.3 Queue concurrency

- Horizon `balance_max_shift` and `balance_cooldown` configured? 🟡
- Separate queues for tenant-specific work so one tenant can't flood all
  workers? 🟠 in MT apps

## Output for §10

- Concurrency risk table
- Code prescription for the atomic-lock pattern
