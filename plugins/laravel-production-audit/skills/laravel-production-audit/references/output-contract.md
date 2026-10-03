# §Final — Output Contract

After completing all sections, write exactly two deliverables to disk in the
project being audited.

## Deliverable 1: `PERF_AUDIT_REPORT.md`

Use this structure:

```markdown
# Performance Audit Report
## Project: [detected name from composer.json]
## Date: [today]
## Laravel: [version] | PHP: [version] | DB: [driver] | Tenancy: [detected/none] | Workers: [single host / N hosts / containers]

---

## Executive Summary
[3–5 sentences on the biggest risks found]

## Architecture & Hot Paths
[5–10 lines: how requests, jobs, and the scheduler actually flow; then the
hot-path map from §0 — each hot route/job/task with its frequency or volume]

## Critical Issues (🔴) — Fix Before Go-Live
[table: Section | File | Issue | Fix]

## High Priority (🟠) — Fix Within Sprint
[table]

## Medium Priority (🟡) — Fix Within Month
[table]

## Leave As Is (✅)
[things done correctly AND things that look optimizable but shouldn't be
touched — each with one line on why. This stops the next person from
"optimizing" them.]

---

## Section-by-Section Findings

### §1 HTTP Request Lifecycle
...
### §2 Queue & Horizon
...
[continue for all sections run]

---

## Implementation Roadmap
### Phase 1 — Quick wins (low risk, config/one-line changes)
### Phase 2 — High-impact code changes (hot paths)
### Phase 3 — Queue / worker / scheduler topology
### Phase 4 — Database (indexes, query rewrites, transactions, connections)
### Phase 5 — Architectural (only changes with large long-term payoff)
[each item: finding ref → change → expected gain. Mark items that need a
migration on a large table, a data backfill, or a behaviour change as
**High-risk** with the rollback plan.]

## Benchmark Plan
[table: Finding | Metric | How to measure | Baseline (if measurable now) | Target]
```

Rules for 🔴 and 🟠 findings — in the section detail, each one gets this
block (🟡 and below stay as one table row):

```markdown
#### [Short title] — 🔴 `path/to/File.php:88`
- **Now:** what the code actually does (quote the line if short)
- **Cost:** why it matters, with numbers where possible (rows, queries,
  MB, ms, requests/min, connections) and on which hot path
- **Change:** the smallest effective fix, specific to this code
- **Expected gain:** what should drop, and roughly by how much
- **Risk / trade-off:** what could break or get worse
- **Benchmark:** metric to capture before and after
```

Benchmark metrics to choose from (pick what proves *this* finding):
p95/p99 route latency; queries per request or per job (`DB::listen` count,
Telescope/Debugbar locally); peak memory (`memory_get_peak_usage(true)` in the
job, or worker RSS); job runtime and throughput, queue wait time (Horizon
metrics); PostgreSQL `pg_stat_statements` (`calls`, `mean_exec_time`) and
`EXPLAIN (ANALYZE, BUFFERS)` for a specific query; Redis ops/sec and memory
(`INFO`); load test on staging (k6 / wrk / ab) for request-path changes.
Never invent a baseline number — if it can't be measured from the audit, say
"measure before change".

Rules for the report:

- Every finding cites a **file path relative to project root with a line
  number** (e.g. `app/Jobs/SendMessage.php:45`).
- If a pattern appears in multiple files, **list every occurrence** — never "and
  others."
- Severity ratings are non-negotiable; don't downgrade a 🔴 because the fix is
  hard.
- **A finding that spans sections is listed once, not duplicated.** Some issues
  touch more than one section — e.g. an undrained `notifications` queue is both a
  §2 (queue) gap and a correctness bug. Record it in the section where the *root
  cause* lives, give it the higher of the applicable severities, and cross-
  reference the other section in the fix line ("see §2") rather than repeating
  the whole finding. Double-listing inflates the counts and makes the report
  look more alarming than it is.

## Deliverable 2: `PERF_CONFIGS/` folder

Produce all of these, populated from the audit. Templates to start from live in
`assets/PERF_CONFIGS/` — copy each and fill it in.

```
PERF_CONFIGS/
├── horizon.php              ← Complete production Horizon config
├── php-fpm-www.conf         ← PHP-FPM pool config
├── php-web.ini              ← php.ini for web workers
├── php-cli.ini              ← php.ini for queue workers / CLI
├── opcache.ini              ← OPcache settings
├── supervisor-laravel.conf  ← Supervisor config for all processes
├── redis-separation.md      ← Redis DB separation strategy + connection snippet
├── nginx-performance.conf   ← Nginx server block: gzip, cache headers, static bypass
├── .env.production.example  ← All perf-relevant env keys with production values
├── deploy-cache.sh          ← Deploy-time artisan cache commands in correct order
└── INDEXES_TO_ADD.md        ← Migration stubs for every missing index found
```

Plus, **only when §12 ran and containers were detected**:

```
└── docker-compose.worker.yml ← Worker-node service: pinned tag, grace period, limits, healthcheck
```

Every file must have:

1. A header comment naming the project and the audit date.
2. Every non-obvious setting explained with an inline `# reason: ...` comment.
3. Any value derived from a formula showing the formula in a comment.

Never leave a `YOUR_VALUE_HERE` placeholder unresolved. If you had to assume a
value (e.g. RAM you couldn't read), make the assumption obvious in the report's
executive summary so the operator knows what to double-check.
