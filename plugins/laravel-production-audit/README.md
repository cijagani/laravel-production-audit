# laravel-production-audit

A Claude Code skill that audits an **existing Laravel application** for
production readiness — performance, memory footprint, reliability,
concurrency, and tenancy isolation — and then writes production config files
tailored to what it found.

It reads the code before it recommends anything. Every finding cites a real
`file:line` in your project, carries a severity (🔴 critical, 🟠 high,
🟡 medium, ✅ leave as is), and critical or high findings also state the
current behaviour, its cost, the fix, the expected gain, the risk, and what to
benchmark.

Baseline: Laravel 13, PHP 8.3+, Horizon 5, Inertia v3, Livewire 4, with
PostgreSQL / PgBouncer and multi-host worker checks where they apply.

## What it checks

Discovery runs first and maps the app's hot paths. Then up to 14 sections run:
HTTP request lifecycle, queues and Horizon, scheduler, memory, Redis,
database, PHP-FPM and OPcache, Supervisor, app config, and concurrency always
run; multi-tenancy, distributed or containerized workers, Livewire, and
Inertia run only when discovery finds them.

## How to use it

Ask in plain language, for example "Audit my Laravel app for production
readiness and give me the config files", "Our jobs sometimes run twice — find
out why", or "Audit HandleInertiaRequests and our Inertia props". You can also
ask for a single section. See `skills/laravel-production-audit/HELP.md`.

## What it reads, writes, and sends

- **Reads** files in the project you run it in: `composer.json` / lockfiles,
  `config/`, `bootstrap/`, `routes/`, `app/`, `database/migrations/`, deploy
  and container files. It reads `.env.example`, never `.env`.
- **Writes** two things into that project: `PERF_AUDIT_REPORT.md` and a
  `PERF_CONFIGS/` folder of config files. It does not edit your application
  code or config unless you explicitly ask.
- **Sends nothing anywhere.** The plugin contains only Markdown instructions
  and text templates: no hooks, no MCP servers, no scripts, no network calls,
  and no credentials.

## License

MIT — see the repository's `LICENSE` file. Homepage:
<https://cijagani.github.io/laravel-production-audit/>
