# Changelog

All notable changes to the `laravel-production-audit` plugin are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

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
