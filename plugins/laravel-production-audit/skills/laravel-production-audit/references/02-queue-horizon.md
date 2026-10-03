# §2 — Queue & Horizon Audit

**Goal:** Horizon never OOMs. Jobs are small, fast, retryable, and deduplicated.
Queues are sized to drain faster than they fill. A worker pool that can't keep up
is just a slower outage.

> **First: is Horizon even installed?** Check §0 — `laravel/horizon` in
> `composer.json`. The audit branches on the answer:
> - **Horizon present** → audit §2.2 against the real `config/horizon.php` and
>   prescribe a tuned one.
> - **Horizon absent** → do *not* invent a `config/horizon.php` as if it were
>   live config. Recommending Horizon is fine (it's the right answer for most
>   queue-heavy apps), but say so explicitly: the prescribed `horizon.php` is
>   only valid *after* `composer require laravel/horizon`. The actual current
>   state still needs a real answer — how is the queue drained **today**? Look
>   for a Supervisor `queue:work` block, or a scheduled `queue:work
>   --stop-when-empty` (a common but fragile pattern — high latency, no memory
>   supervision, and easy to miss a non-default queue). Audit *that* as the live
>   setup and flag its gaps, then offer Horizon as the upgrade. Skip §2.2's
>   per-supervisor checks when there's no Horizon config to check.
>
> **Watch for orphaned queues.** Whatever drains the queue (`queue:work` or
> Horizon supervisors), confirm it covers **every** queue name that jobs and
> broadcast events actually dispatch to. A worker bound to `--queue=default`
> while an event sets `queue=notifications` means that queue is never drained —
> a silent 🔴 that no amount of worker tuning fixes.

## 2.1 Job design

For every Job class, check:

> **Laravel 13 attributes count as "defined".** Job settings may be declared as
> class attributes instead of properties: `#[Tries(5)]`, `#[Timeout(120)]`,
> `#[Backoff([1, 5, 10])]`, `#[FailOnTimeout]`, `#[MaxExceptions(3)]`,
> `#[UniqueFor(3600)]`, `#[DeleteWhenMissingModels]`, `#[WithoutRelations]`,
> `#[DebounceFor(30)]`. Search `#\[(Tries|Timeout|Backoff|MaxExceptions)` before
> flagging a property as missing. Also check for `Queue::route(...)` in a service
> provider — L13 can set a job's queue/connection centrally, so a job with no
> `onQueue()` isn't necessarily on `default`.

- [ ] `$tries` / `#[Tries]` defined? 🟠 if missing (defaults to 1 or infinite per
      config). Jobs using `WithoutOverlapping` / `RateLimited` middleware use up
      an attempt each time they're released — `tries` set too low makes them
      fail while merely waiting (Horizon docs) 🟠
- [ ] `$timeout` / `#[Timeout]` defined? 🔴 if missing on any job making HTTP/DB calls
- [ ] `$backoff` / `#[Backoff]` on jobs calling external APIs? 🟡 — immediate
      retries hammer an upstream that's already struggling
- [ ] `$maxExceptions` / `#[MaxExceptions]` defined? 🟡
- [ ] `retryUntil()` used for time-based retry? (note if relevant)
- [ ] `ShouldBeUnique` on jobs that must not duplicate? 🟠 if obvious dedup missing
- [ ] `ShouldBeEncrypted` on jobs with PII payload? 🟡
- [ ] Payload carries full Eloquent models? 🔴 — use model IDs only
- [ ] `handle()` re-queries with proper null-checks? 🟠
- [ ] `$deleteWhenMissingModels = true` set? 🟡
- [ ] `handle()` does more than one logical unit of work? 🟡 (split suggestion)
- [ ] `Bus::chain()` used where sequential dependency exists? (note)
- [ ] `Bus::batch()` used where parallel fan-out exists? (note) — or `Bus::bulk()`
      when no batch tracking/callbacks are needed: one push per queue instead
      of one per job
- [ ] Dispatching many jobs in a loop (`foreach … dispatch()`)? 🟡 — `Bus::bulk()`
- [ ] **Fan-out size** 🟠 (🔴 if unbounded): one request / command / event
      producing one job **per row** (1 campaign → 100k jobs, each querying the
      DB and calling an API). Count it from the code. Prefer one job per
      *chunk* (e.g. 500 IDs) dispatched from a `chunkById` loop, or a staged
      pipeline (select IDs → chunk jobs → per-chunk bulk write). 100k tiny
      jobs cost 100k payloads in Redis, 100k bootstraps, and DB connection
      pressure from every worker at once.
- [ ] **Retry storm** 🟠: many jobs failing on the same upstream outage with a
      fixed `backoff` all retry at the same moment. Use growing `backoff`
      arrays and `ThrottlesExceptions` so an outage backs off instead of
      hammering.
- [ ] **Payload weight** 🟡: arrays/collections of data in the constructor
      instead of IDs; models with relations loaded at dispatch time — they're
      serialized and **re-queried with those relations** on the worker. Use
      `#[WithoutRelations]` / IDs.
- [ ] Job dispatched **inside** `DB::transaction()` with neither `after_commit`
      on the connection nor `->afterCommit()` on the dispatch? 🟠 — a fast worker
      runs it before the commit and hits `ModelNotFoundException` / stale data
- [ ] Job **idempotent**? 🟠 if it charges, sends, or increments without a guard.
      Delivery is at-least-once: a worker crash, timeout, or `retry_after`
      expiry re-runs a job that may already have done its side effect
- [ ] Long-running job (import/export, minutes+) implements
      `Illuminate\Contracts\Queue\Interruptible` to checkpoint on `SIGTERM`? 🟡
- [ ] Same job re-dispatched for the same entity in bursts (search reindex,
      cache rebuild) without `#[DebounceFor]` / `ShouldBeUnique`? 🟡 (see §10)
- [ ] Small post-response work sent to a real queue when
      `->onConnection('deferred')` / `'background'` would do? (note — these
      drivers run in-process after the response is sent; no worker needed)

## 2.2 Queue connection & the timeout chain

Read `config/queue.php` (the `redis` connection). This applies with or without
Horizon:

- **Timeout chain** 🔴 if violated — the most common cause of jobs "running
  twice":

  ```text
  job $timeout  <  worker --timeout / Horizon 'timeout'  <  retry_after  <  stopwaitsecs
  ```

  Laravel docs: `--timeout` "should always be at least several seconds shorter
  than your `retry_after`… If your `--timeout` option is longer than your
  `retry_after` configuration value, your jobs may be processed twice." Stock
  `retry_after` is **90**, so any worker/supervisor timeout ≥ ~85 on a stock
  config is 🔴. Write the chain out with the project's real numbers.
- **PCNTL** loaded for CLI PHP? 🔴 if not — job timeouts aren't enforced without
  it (Laravel docs). Usually only missing in containers (§12).
- **`block_for`**: `0` 🟠 — the worker blocks forever and can't handle `SIGTERM`
  until a job arrives (Laravel docs). `null` polls every `sleep` seconds; a
  small value like `5` is the efficient middle ground.
- **`after_commit`**: `false` while jobs are dispatched inside transactions 🟠
  (see 2.1).
- **Failover driver** (`'driver' => 'failover'`): if its list includes
  `database`, a `queue:work database` process must run alongside Horizon —
  Horizon only drains Redis. 🔴 if missing.
- `Queue::withoutInterruptionPolling()` / `Worker::$restartable = false` 🟠 —
  workers then ignore `queue:restart` and `queue:pause`, so deploys can't reach
  them. OK only if the deploy restarts workers some other way.

## 2.3 Horizon configuration

Read `config/horizon.php` and audit:

- **Balance strategy:** `auto` or `smart`? Prefer `auto` for low-hardware.
- **`minProcesses` / `maxProcesses`:** set per supervisor? Warn if `maxProcesses`
  is unbounded relative to RAM (each worker ≈ 50–80MB PHP RSS).
- **`memory` limit per worker:** default 128MB — flag if not explicitly lower.
- **`timeout` per supervisor:** must exceed the longest job `$timeout` on its
  queues **and** sit several seconds below `retry_after` (2.2). With `auto`
  balancing, Horizon force-kills busy workers past this timeout when it scales
  down, so too low kills jobs mid-run.
- **Queue priority:** with `balance => 'auto'` (the default) the order of the
  `queue` array is **ignored**. Horizon docs: "the high queue is not prioritized
  over the default queue, despite appearing first in the list." 🟠 if the config
  relies on array order for priority under `auto`. Fix: one supervisor per
  priority tier with its own `maxProcesses`, or `balance => false` (which does
  honour order). Resource-heavy queues get their own supervisor with a low
  `maxProcesses` cap.
- **`autoScalingStrategy`:** `time` (default), `size`, or `log` (stops one huge
  queue from taking every worker). Note which and why.
- **`maxJobs` / `maxTime`:** both `0` (never recycle) 🟠 — Horizon docs recommend
  restarting long-running workers periodically to contain leaks, e.g.
  `maxJobs => 1000`, `maxTime => 3600`.
- **`backoff`** at supervisor level when jobs don't set their own? 🟡
- **`tries` default at supervisor level:** present?
- **`sleep`:** 0 only on high-throughput queues; 1–3 on low-volume.
- **`nice`:** 0 on critical, 10 on batch/background queues (CPU niceness).
- **`environments`:** is `production` explicitly configured? If a `'*'`
  wildcard exists, check it isn't silently running full production pools on
  staging. Multi-node: see §12.7 (`HORIZON_ENV`).
- **`force`:** supervisors that must keep draining during `php artisan down`
  (payment webhooks, mail) have `'force' => true`? 🟡 — otherwise maintenance
  mode stops all processing, including the deploy's own downtime window.
- **`horizon:snapshot`** scheduled every five minutes? 🟡 — without it the
  metrics dashboard and wait-time history are empty.
- **Notifications:** `waits` thresholds set per `connection:queue` **and**
  `Horizon::routeMailNotificationsTo` / `routeSlackNotificationsTo` called in
  `HorizonServiceProvider::boot()`? 🟠 if `waits` exist but nothing is routed —
  `LongWaitDetected` fires into the void.

## 2.4 Failed jobs

- `failed_jobs` table migrated? 🔴 if not
- `QUEUE_FAILED_DRIVER` set to `database-uuids`? 🟡
- Any job missing `failed()` for cleanup/alerting? 🟡
- `queue:prune-failed --hours=…` scheduled? 🟡 — each row holds the full payload
  and exception trace; the table grows without bound.

## 2.5 Job batching

- `job_batches` table migrated? (note — needed if `Bus::batch()` used)
- `queue:prune-batches --hours=48 --unfinished=72 --cancelled=72` scheduled
  daily? 🟡 — Laravel docs: the table "can accumulate records very quickly".

## 2.6 Queue monitoring (with or without Horizon)

- Something alerts on backlog: `queue:monitor redis:default,… --max=N`
  scheduled every minute with a listener for `Illuminate\Queue\Events\QueueBusy`,
  or Horizon `waits` with routed notifications? 🟠 if neither — a stuck queue
  gets found by customers instead of by you.

## Output for §2

- Per-job finding table (job class | issue | severity | fix)
- The timeout chain with real numbers (job → worker → `retry_after` → stop grace)
- Prescribe an exact production `config/horizon.php` based on findings, plus the
  `config/queue.php` redis-connection values it depends on (`retry_after`,
  `block_for`, `after_commit`)
- Schedule lines for `horizon:snapshot`, `queue:prune-failed`,
  `queue:prune-batches`, `queue:monitor` where missing (cross-ref §3)
