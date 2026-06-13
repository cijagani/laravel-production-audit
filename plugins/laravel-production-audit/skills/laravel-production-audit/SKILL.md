---
name: laravel-production-audit
description: "Audit an existing Laravel 13 / PHP 8.4 application for production readiness — performance, memory/CPU footprint, reliability, concurrency, and tenancy isolation — then produce a findings report plus ready-to-use production config files (Horizon, PHP-FPM, OPcache, Nginx, Supervisor, Redis). Use whenever someone asks to audit, profile, optimize, harden, or 'make a Laravel app faster / use less memory', or get it 'production-ready' — and on symptom phrases like 'why is my Laravel app slow', 'tune Horizon', 'size php-fpm', 'reduce memory on my queue workers', 'queue/Horizon OOM', or 'N+1 queries'. This is for auditing an EXISTING app, not first-time setup (installing Horizon, dockerizing, scaffolding), not security/correctness review, and not raw database-engine tuning (Postgres EXPLAIN/index work) outside Laravel code. Works on any modern Laravel codebase."
---

# Laravel Production-Readiness Audit

This skill turns Claude into a disciplined production-readiness auditor for a
Laravel 13 / PHP 8.4 application. The goal is twofold: find every concrete
performance, memory-footprint, reliability, and concurrency risk in the
codebase, and hand back **production config files that are ready to drop in** —
not advice, actual files.

The whole approach rests on one idea: **read first, prescribe second.** Most bad
performance advice comes from guessing at defaults. Here you read the actual
code and config, cite file and line, and only then recommend. A recommendation
you can't tie to something you read is a recommendation you shouldn't make.

## Operating rules

These five rules shape everything below. They exist because the failure modes
they prevent are the ones that quietly produce a confident-but-wrong audit.

1. **Discovery before output.** Complete the discovery pass (below) before
   writing a single finding or config line. You cannot size a worker pool before
   you know the queue driver, and you can't flag an N+1 you haven't seen.

2. **No assumption.** If a file is referenced but missing, record it as
   `MISSING` and prescribe from Laravel defaults — don't invent values that
   "should" be there. Read the real code; quote it.

3. **Multi-tenancy awareness.** Detect the tenancy driver (stancl/tenancy,
   spatie/multitenancy, custom prefix, or none) *before* giving any queue,
   cache, or DB advice. The right cache-key and queue-isolation strategy depends
   entirely on this, and cross-tenant leaks are a security issue, not just a
   perf one.

4. **Minimum-hardware principle.** Every recommendation justifies its
   memory/CPU cost. Prefer async, chunked, deferred, and cached over synchronous
   and eager. Assume the target box is small; make each megabyte earn its place.

5. **Honest severity.** Rate by impact, never by how annoying the fix is. A 🔴
   stays 🔴 even when the fix is a big refactor. Downgrading hard problems
   because they're hard is how they reach production.

## Severity legend

Use these consistently across every finding and in the final report:

- 🔴 **Critical** — fix before go-live (data-leak, OOM, blocking request path)
- 🟠 **High** — fix within the sprint
- 🟡 **Medium** — fix within the month
- 🟢 **Low / positive** — minor, or a note that something is done correctly
- ✅ **OK** — verified good, no action

## Workflow

Run these in order. Each audit section lives in its own reference file so you
load only what you're working on — read the file when you reach that step.

1. **Discovery pass** — `references/00-discovery.md`. Mandatory first pass:
   confirm versions, drivers, tenancy, Horizon/Octane presence, and catalog the
   jobs / commands / middleware / HTTP-call sites you'll audit. Keep a running
   "Discovery Log" as you go.

2. **Run the eleven audit sections.** Each is a self-contained checklist with
   severity ratings and a per-section output. Read the reference file for the
   section you're auditing:

   | § | Focus | Reference |
   |---|---|---|
   | 1 | HTTP request lifecycle (middleware, controllers, listeners, mail) | `references/01-http-lifecycle.md` |
   | 2 | Queue & Horizon (job design, supervisors, failed jobs) | `references/02-queue-horizon.md` |
   | 3 | Scheduler & cron (overlap, background, one-server) | `references/03-scheduler-cron.md` |
   | 4 | Memory management (unbounded loads, chunking, PHP 8.4) | `references/04-memory.md` |
   | 5 | Redis (cache, session, rate-limit, connection efficiency) | `references/05-redis.md` |
   | 6 | Database (N+1, query efficiency, indexes, write patterns) | `references/06-database.md` |
   | 7 | PHP-FPM & OPcache sizing | `references/07-php-fpm-opcache.md` |
   | 8 | Supervisor process management | `references/08-supervisor.md` |
   | 9 | Laravel app config (caches, providers, debug, HTTP cache) | `references/09-app-config.md` |
   | 10 | Concurrency & locking (dedup, races, atomic ops) | `references/10-concurrency.md` |
   | 11 | Multi-tenancy overhead — **only if tenancy detected in §0** | `references/11-multitenancy.md` |

3. **Produce the two deliverables** (the output contract). See
   `references/output-contract.md` for the exact report structure and the full
   list of config files. Config templates to start from live in
   `assets/PERF_CONFIGS/` — copy each, then fill it with values derived from
   your findings and the sizing formulas.

## The output contract — two deliverables, always

Every audit ends with exactly these two things written to disk in the project
being audited:

### 1. `PERF_AUDIT_REPORT.md`

A findings report. Executive summary, then issues grouped by severity
(🔴 → 🟠 → 🟡 → ✅), then section-by-section detail. Every finding carries a
**file path relative to project root with a line number** (e.g.
`app/Jobs/SendMessage.php:45`), the severity, and a one-line fix. List *every*
occurrence of a pattern — never "and others." See `references/output-contract.md`
for the exact template.

### 2. `PERF_CONFIGS/` folder

A directory of complete, production-ready config files derived from the audit —
`horizon.php`, `php-fpm-www.conf`, `php-web.ini`, `php-cli.ini`, `opcache.ini`,
`supervisor-laravel.conf`, `redis-separation.md`, `nginx-performance.conf`,
`.env.production.example`, `deploy-cache.sh`, and `INDEXES_TO_ADD.md`. Start each
from the template in `assets/PERF_CONFIGS/`. Every non-obvious setting gets an
inline `# reason: ...` comment, and any value from a formula shows the formula.
No `YOUR_VALUE_HERE` placeholders left unresolved — if you must assume a value
(e.g. RAM you couldn't read), state the assumption in the report.

## Behaviour reminders

- Unreadable file (permission/missing) → mark `MISSING`, don't skip the section;
  prescribe from Laravel defaults and say so.
- Use **PHP 8.4 / Laravel 13** APIs. No deprecated patterns.
- Don't suggest Laravel Octane unless it's already in `composer.json` — it
  changes the execution model and needs explicit opt-in.
- Config files are complete files, not stubs. A half-written `horizon.php` helps
  no one.
