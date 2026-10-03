# Sample output (excerpt)

This is a **trimmed, anonymized** example of what the skill produces, so you can
see the shape and quality before installing. A real run is longer, cites your
actual files, and is accompanied by a populated `PERF_CONFIGS/` folder. File
paths, line numbers, and findings below are illustrative.

---

# Performance Audit Report
## Project: acme/billing-api
## Date: 2026-06-14
## Laravel: 13.x | PHP: 8.4 | DB: mysql | Tenancy: none

## Executive Summary

The app is broadly healthy but has one architectural risk that will bite under
load: a broadcast event is dispatched to a queue that no worker drains, so those
notifications silently never deliver. Two synchronous operations in the request
path (a config rebuild in a provider `boot()` and full-response gzip in PHP)
add avoidable latency. PHP-FPM/OPcache sizing below assumes a **2 GB / 2-core**
box — the audit host was a dev machine, so recompute against production.

Total findings: **3 🔴 Critical, 3 🟠 High, 4 🟡 Medium.**

## Critical Issues (🔴) — Fix Before Go-Live

| Section | File | Issue | Fix |
|---|---|---|---|
| §2 | `app/Events/InvoicePaid.php:18` | Event sets `queue = 'broadcasts'` but the only worker runs `--queue=default` → the `broadcasts` queue is never drained; broadcasts silently never fire. | Add `broadcasts` to the worker's queue list (or Horizon supervisor). See §2 cross-ref. |
| §2 | `deploy/supervisor/worker.conf:4` | `queue:work --timeout=120` but `config/queue.php:68` has `retry_after` 90 → any job running past 90s is handed to a second worker while the first is still running. | `--timeout=80`; long exports on their own connection. Detail in §2. |
| §9 | `.env.example:2,4` | Ships `APP_ENV=local`, `APP_DEBUG=true`. If prod `.env` derives from this, debug mode leaks stack traces in production. | Hardened keys in `PERF_CONFIGS/.env.production.example`. |

## High Priority (🟠) — Fix Within Sprint

| Section | File | Issue | Fix |
|---|---|---|---|
| §1 | `app/Http/Middleware/CompressResponse.php:34` | Buffers the full response into PHP and gzips at level 6 on every request — work Nginx should do. | Remove; let Nginx `gzip` handle it (`PERF_CONFIGS/nginx-performance.conf`). |
| §6 | `database/migrations/...create_invoices_table.php:19` | No index on `status`, filtered by `where('status', …)` in `InvoiceController@index:52`. Full scan as the table grows. | `index('status')` — stub in `PERF_CONFIGS/INDEXES_TO_ADD.md`. |
| §1 | `app/Providers/AppServiceProvider.php:41` | `configureMailFromDatabase()` mutates config in `boot()` on every request, even ones that never send mail. | Defer to a lazy mailer resolver. |

## Leave As Is (✅)

- Redis split into logical DBs (queue/cache/session) — a cache flush won't drop the queue.
- `REDIS_CLIENT=phpredis` (C extension), persistent connections enabled.
- `UserTableController` uses explicit `->select([...])`, `->paginate()`, capped `per_page`, whitelisted sort columns — textbook.

---

### §2 Queue & Horizon (section detail excerpt)

- **Horizon: not installed.** Recommending it is the right call, but the current
  state still needs a real answer: the queue is drained by a Supervisor-managed
  `queue:work`. Audited that as the live setup.
- 🔴 `broadcasts` queue undrained (see Critical table). This spans §2 and
  correctness — recorded once here at the root cause, cross-referenced from §10.
- ✅ `failed_jobs` migrated; `QUEUE_FAILED_DRIVER=database-uuids`.

#### Long jobs run twice — 🔴 `deploy/supervisor/worker.conf:4`
- **Now:** `queue:work redis --timeout=120`; `config/queue.php:68` sets
  `retry_after` to 90.
- **Cost:** `ExportInvoices` (`app/Jobs/ExportInvoices.php`, typically ~100s)
  is released back to the queue at 90s and picked up by a second worker while
  the first still runs. The result is duplicate export files and twice the
  report-query load.
- **Change:** `--timeout=80` on this worker. Move `ExportInvoices` to a `long`
  Redis connection (`retry_after` 330) drained by a separate worker with
  `--timeout=300` and `stopwaitsecs=360`.
- **Expected gain:** no duplicate runs for jobs longer than 90s.
- **Risk / trade-off:** an export taking more than 300s now fails instead of
  running twice. Check real runtimes before choosing the number.
- **Benchmark:** duplicate `ExportInvoices` runs per day (from the export
  table); p95 job runtime.
