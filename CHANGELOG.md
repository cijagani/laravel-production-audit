# Changelog

All notable changes to the `laravel-production-audit` plugin are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-10-03

Re-checked against the Laravel 13, Horizon 5, Inertia v3, and Livewire 4 docs and source.

### Fixed
- `horizon.php` template: `supervisor-default` had `timeout => 120` against the
  stock `retry_after` of 90, so long jobs could run twice. Lowered it to 80 and
  documented the timeout chain in the header.
- `horizon.php` template: top-level `memory_limit` is the **master**
  supervisor's cap, not a per-worker cap. `maxJobs`/`maxTime` changed from `0`
  to 1000/3600, so the template no longer fails its own §4.5 check.
- §2: the "high-priority queues listed first" check was wrong. Under
  `balance => 'auto'` Horizon ignores queue order. The check now calls for one
  supervisor per priority tier.
- `deploy-cache.sh` / §9: removed the bare `optimize:clear`. It also runs
  `cache:clear`, so every deploy flushed the app cache and its locks.
- `.env.production.example`: `REDIS_DB=1` put the queue in the cache DB, so
  `cache:clear` wiped queued jobs. It is now `0`. Added `SESSION_CONNECTION`
  (without it, sessions use the queue connection), plus `REDIS_PASSWORD` and
  `REDIS_QUEUE_RETRY_AFTER`.
- `redis-separation.md`: removed the false claim that logical DBs can have
  different eviction policies. The stanza now keeps the stock `password` and
  retry/backoff keys.

### Added
- §12 Distributed & containerized workers (conditional): shared state,
  central cache requirement, version skew (`horizon:terminate` and
  `horizon:pause` only reach the local host), the timeout chain, container
  signals/pcntl/limits, connection budgets across nodes, per-node supervisors
  via `HORIZON_ENV`, and burst-node scaling.
- `docker-compose.worker.yml` template (emitted only when §12 detects
  containers).
- §2: Laravel 13 job attributes (`#[Tries]`, `#[Timeout]`, `#[Backoff]`,
  `#[DebounceFor]`…), `Queue::route`, `Bus::bulk`, `deferred`/`background`
  connections, `after_commit`, `block_for`, PCNTL, failover driver,
  `Interruptible`, `force`, `horizon:snapshot`, routed `waits` notifications,
  pruning, `queue:monitor`.
- §5: `maxmemory-policy` audit, `SESSION_CONNECTION` gotcha, Redis Cluster
  limits, `Cache::flexible` / `memo` / `touch`.
- §3: central-cache requirement and a housekeeping-schedule checklist.
- §8: `stopwaitsecs` rule and a `queue:work` fallback block.
- §10: choosing between unique, overlap, and debounce; idempotency.
- Operating rules: "specific, never generic" (with a worked example), a fix
  order (do less, then later, then in batches, then closer to the data, and
  only then cache or scale), no inflated severity, and read-only on app code.
- Discovery ends with a **hot-path map**: each hot route, job, and task is
  traced end to end, and audit effort is weighted towards them.
- Report: architecture and hot-path section; 🔴/🟠 findings now state current
  behaviour, cost, change, expected gain, risk, and benchmark; "Already Good"
  becomes "Leave As Is" (with reasons); added a 5-phase roadmap with
  high-risk items marked, a benchmark plan, and a P0–P3 mapping.
- §6: PHP-side aggregation, `toBase()`/`simplePaginate`/`cursorPaginate`,
  hidden per-model work (`$with`, `$appends`, scopes, observers,
  `preventLazyLoading`), justification required for every index (column
  order, selectivity, partial indexes, `->online()` +
  `$withinTransaction = false`), redundant indexes, `pg_trgm`, transaction
  hygiene, PgBouncer transaction-pooling hazards (runtime `SET`, advisory
  locks, prepared statements), and a connection-budget formula.
- §1: outbound API calls (timeouts vs the 30s default, retry storms,
  idempotency keys, `Http::pool`, shared rate limits).
- §2: fan-out sizing, retry storms, payload weight.
- §3: per-task table (frequency, duration, DB/Redis/queue impact) and
  checkpoint-based incremental processing.
- §4: state that outlives a job (`static`, `singleton` vs `scoped`, query log).
- §5: a cache-worthiness test; a cache that saves nothing is itself a finding.
- §9: package overhead (Telescope or Debugbar in production, global
  middleware from packages, unused packages, `dont-discover`).
- §11: noisy-neighbour tenants, tenant-leading indexes, and the risk of
  schema-per-tenant behind PgBouncer.
- §13 Livewire (conditional, baseline Livewire 4): `#[Computed]`,
  public-property payloads, `#[Locked]`, the cost of `wire:poll` across many
  users, `#[Lazy]`/`#[Defer]` with bundling.
- §14 Inertia v3 (conditional): `HandleInertiaRequests` audit (eager vs
  closure vs `once` shared props, the `auth.user` payload, `version()`
  pitfalls that cause 409 reload loops, DevTools in production), deferred
  groups, `optional`/`once`/`scroll`, payload size, a per-source table of
  extra requests (poll `mode: 'rest'`, prefetch `cacheFor`/tags, `WhenVisible`,
  persistent layouts), SSR per route (`$withoutSsr`), bundle splitting,
  Ziggy vs Wayfinder, and Vue 3 / React 19 rendering. Inertia v2 is flagged
  (bug fixes ended 2026-09-26).
- Version baseline: Laravel 13, Horizon 5.x, Inertia v3, Livewire 4.

## [1.0.0] — 2026-06-14

Initial public release.

### Added
- `laravel-production-audit` skill: a disciplined production-readiness auditor
  for Laravel 13 / PHP 8.4 apps.
- 11-section audit workflow (HTTP lifecycle, queue/Horizon, scheduler, memory,
  Redis, database, PHP-FPM/OPcache, Supervisor, app config, concurrency,
  multi-tenancy) with progressive disclosure — each section is a self-contained
  reference file.
- Two deliverables: a severity-rated `PERF_AUDIT_REPORT.md` (every finding cites
  `file:line`) and a `PERF_CONFIGS/` folder of 11 production-ready config
  templates (Horizon, PHP-FPM, OPcache, Nginx, Supervisor, Redis separation,
  hardened `.env`, deploy script, index migration stubs).
- `HELP.md` documenting whole-skill use, single-section use, and single-template
  use.
- A sanitized [sample report excerpt](docs/SAMPLE_REPORT.md) so the output is
  visible before installing.

### Notes
- Verified against current Laravel 13 / PHP 8.4 APIs (e.g. `CACHE_STORE` env key,
  `bootstrap/app.php` middleware, `php artisan optimize`, PHP 8.4 OPcache JIT).
- Config templates assume a 2 GB / 2-core baseline and are clearly marked
  RECOMPUTE — always size against your real production host.
