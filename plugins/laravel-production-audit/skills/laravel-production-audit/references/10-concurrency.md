# §10 — Concurrency & Locking Audit

**Goal:** no race conditions, no double-processing, atomic increments via Redis,
DB transactions tight and short. The bugs here are the ones that only show up
under load — exactly when you can least afford them.

## 10.1 Duplicate job processing

- `ShouldBeUnique` on jobs that must run once per model/ID? 🔴 if missing on
  obvious cases
- `uniqueId()` returning a meaningful key? 🟠 if generic
- `uniqueFor()` / `#[UniqueFor]` set to an appropriate TTL? 🟡 — without one, a
  worker crash can leave the lock held until it's manually cleared.
- Right tool for the job? 🟡 if mismatched:
  - `ShouldBeUnique` — don't even *queue* a duplicate while one is pending/running
  - `ShouldBeUniqueUntilProcessing` — allow a new one to queue once processing starts
  - `WithoutOverlapping($key)` job middleware — queue freely, never *run* two at
    once for the same key (add `->expireAfter()` so a crashed worker can't hold
    the lock forever)
  - `#[DebounceFor(30)]` (L13) — burst of dispatches, only the **latest** runs
    (search reindex, cache rebuild). Mutually exclusive with `ShouldBeUnique`.
- All of the above lock through the cache store — with workers on more than
  one host, every host must share it (§12.2) 🔴 if not.
- Jobs with external side effects (payment, email, webhook) idempotent under
  at-least-once delivery — an idempotency key or "already done?" check
  before the side effect? 🟠 (see §2.1)

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
