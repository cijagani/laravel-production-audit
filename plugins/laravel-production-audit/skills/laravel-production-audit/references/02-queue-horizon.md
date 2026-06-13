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

- [ ] `$tries` defined? 🟠 if missing (defaults to 1 or infinite per config)
- [ ] `$timeout` defined? 🔴 if missing on any job making HTTP/DB calls
- [ ] `$maxExceptions` defined? 🟡
- [ ] `retryUntil()` used for time-based retry? (note if relevant)
- [ ] `ShouldBeUnique` on jobs that must not duplicate? 🟠 if obvious dedup missing
- [ ] `ShouldBeEncrypted` on jobs with PII payload? 🟡
- [ ] Payload carries full Eloquent models? 🔴 — use model IDs only
- [ ] `handle()` re-queries with proper null-checks? 🟠
- [ ] `$deleteWhenMissingModels = true` set? 🟡
- [ ] `handle()` does more than one logical unit of work? 🟡 (split suggestion)
- [ ] `Bus::chain()` used where sequential dependency exists? (note)
- [ ] `Bus::batch()` used where parallel fan-out exists? (note)

## 2.2 Horizon configuration

Read `config/horizon.php` and audit:

- **Balance strategy:** `auto` or `smart`? Prefer `auto` for low-hardware.
- **`minProcesses` / `maxProcesses`:** set per supervisor? Warn if `maxProcesses`
  is unbounded relative to RAM (each worker ≈ 50–80MB PHP RSS).
- **`memory` limit per worker:** default 128MB — flag if not explicitly lower.
- **`timeout` per supervisor:** must match or exceed the longest job `$timeout`.
- **Queue priority order:** high-priority queues listed first in `queue` array?
- **`tries` default at supervisor level:** present?
- **`sleep`:** 0 only on high-throughput queues; 1–3 on low-volume.
- **`nice`:** 0 on critical, 10 on batch/background queues (CPU niceness).
- **`environments`:** is `production` explicitly configured?

## 2.3 Failed jobs

- `failed_jobs` table migrated? 🔴 if not
- `QUEUE_FAILED_DRIVER` set to `database-uuids`? 🟡
- Any job missing `failed()` for cleanup/alerting? 🟡

## 2.4 Job batching

- `job_batches` table migrated? (note — needed if `Bus::batch()` used)

## Output for §2

- Per-job finding table (job class | issue | severity | fix)
- Prescribe an exact production `config/horizon.php` based on findings
