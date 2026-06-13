# How to use `laravel-production-audit`

A guide to running the Laravel production-readiness audit skill — both as a
whole, and one file at a time.

> **How it loads.** Installed as a plugin, the skill auto-triggers when your
> request matches its description — you don't type a path. You *can* invoke it
> explicitly with `/laravel-production-audit:laravel-production-audit`. The file
> paths in this guide (`references/…`, `assets/PERF_CONFIGS/…`) are **relative to
> the skill's own folder** — when you want a specific file, name it that way and
> Claude resolves it within the installed skill.

---

## 1. The normal way — run the whole skill

The skill is designed to run end-to-end: discover the project, work through 11
audit sections, then write two deliverables. You don't run a command — you ask
Claude, and the skill auto-triggers on the request.

**Just say what you want, in plain language.** Any of these pulls the skill in:

- "Audit my Laravel app for performance problems and give me the config files."
- "Why is my Laravel app slow under load? Dig in before we go live."
- "Tune Horizon — workers keep getting OOM-killed."
- "Get this Laravel project production-ready."
- "Review this PR — it loads all users with `->get()`, will it scale?"

**Point it at a project.** If your terminal is already inside the Laravel repo,
that's the target. If not, name the path:

> "Run a production-readiness audit on `/path/to/your-laravel-app`."

**What you get back** (the two deliverables, written into the audited project):

| Deliverable | What it is |
|---|---|
| `PERF_AUDIT_REPORT.md` | Findings grouped by severity (🔴/🟠/🟡/✅), every one citing `file:line`, plus a section-by-section breakdown. |
| `PERF_CONFIGS/` | A folder of complete, production-ready config files (`horizon.php`, `php-fpm-www.conf`, `opcache.ini`, `nginx-performance.conf`, `supervisor-laravel.conf`, `.env.production.example`, `deploy-cache.sh`, `INDEXES_TO_ADD.md`, …) populated from the findings. |

**Tip — keep the audit out of the repo.** If you don't want the report written
into the project, just say so: *"…and write the report and configs to a separate
folder, don't touch the project."* The skill will sandbox the output.

### The severity legend (used throughout the report)

- 🔴 **Critical** — fix before go-live (data leak, OOM, blocking request path)
- 🟠 **High** — fix within the sprint
- 🟡 **Medium** — fix within the month
- 🟢 / ✅ — minor / done correctly

---

## 2. Yes — you can use each file individually

The skill is deliberately built so **every reference file is self-contained**:
each has its own goal, its own checklist with severities, and its own
"Output for §N." So you can run a single slice of the audit without the rest.

This is useful when you don't need a full audit — e.g. you only care about
database N+1s today, or you just want the Horizon section, or you only want the
config templates and not the findings report.

### 2a. Run a single audit section

Point Claude at one reference file and the project. The file *is* the
instructions — Claude follows that section's checklist only.

> "Using this skill's `references/06-database.md`, audit just the database layer
> of this app — N+1, indexes, write patterns. Skip everything else."

Or even more directly:

> "Read `references/02-queue-horizon.md` and audit only my queue/Horizon setup."

**The individually-runnable sections:**

| File | Run it when you want to check only… |
|---|---|
| `references/00-discovery.md` | the project's stack/drivers/tenancy (the fact-finding pass — good first step before any single section) |
| `references/01-http-lifecycle.md` | middleware, controllers, listeners, mail in the request path |
| `references/02-queue-horizon.md` | job design, Horizon supervisors, failed jobs |
| `references/03-scheduler-cron.md` | task overlap, `runInBackground`, `onOneServer`, cron entry |
| `references/04-memory.md` | unbounded loads, chunking, worker memory, PHP 8.4 |
| `references/05-redis.md` | cache/session/rate-limit/locks, connection efficiency |
| `references/06-database.md` | N+1, query efficiency, missing indexes, write patterns |
| `references/07-php-fpm-opcache.md` | PHP-FPM pool + OPcache sizing |
| `references/08-supervisor.md` | Supervisor process management |
| `references/09-app-config.md` | config/route/view caching, providers, debug, HTTP cache |
| `references/10-concurrency.md` | dedup, race conditions, atomic ops |
| `references/11-multitenancy.md` | per-tenant cache/queue isolation **(only meaningful if the app is multi-tenant)** |

> **One dependency to know about:** the per-section files assume the facts from
> `00-discovery.md` (Laravel version, queue driver, whether Horizon/tenancy
> exist). If you skip discovery, just tell Claude the basics ("this is Laravel
> 13, redis queue, no Horizon, single-tenant") or let it do a quick read of
> `composer.json` first. §11 in particular is a no-op unless a tenancy package
> is present.

### 2b. Use a single config template (no audit at all)

The files under `assets/PERF_CONFIGS/` are **standalone, annotated templates**.
Each has inline `# reason:` comments and the sizing formula baked in. You can
grab one directly without running any audit:

> "Give me a production `opcache.ini` for PHP 8.4 — start from this skill's
> `assets/PERF_CONFIGS/opcache.ini` and fill it in for a 4 GB / 4-core box."

> "I need a Supervisor config for Horizon + Reverb — adapt
> `assets/PERF_CONFIGS/supervisor-laravel.conf`."

**Available templates:**

| Template | Produces |
|---|---|
| `horizon.php` | Production Horizon supervisors (small-box sized) |
| `php-fpm-www.conf` | PHP-FPM pool, sized by `floor(RAM / 100MB)` |
| `php-web.ini` / `php-cli.ini` | php.ini for web vs. queue workers |
| `opcache.ini` | OPcache settings (PHP 8.4, JIT) |
| `supervisor-laravel.conf` | Supervisor blocks for Horizon / `queue:work` / Reverb + cron |
| `nginx-performance.conf` | Nginx server block: gzip, cache headers, static bypass |
| `redis-separation.md` | Redis logical-DB separation + `config/database.php` stanza |
| `.env.production.example` | Hardened production env keys |
| `deploy-cache.sh` | Deploy-time artisan cache warmup in the correct order |
| `INDEXES_TO_ADD.md` | Migration stubs for missing indexes |

> These are **templates**, not final files — they contain placeholders like
> `<PROJECT NAME>`, `<DATE>`, and assumed hardware values (2 GB / 2 cores). Always
> recompute the sizing values against your real production box. Read
> `references/07-php-fpm-opcache.md` for the formulas.

### 2c. Run a custom subset

You can mix sections freely — just name the ones you want:

> "Audit only the request path and the database — use `references/01-http-lifecycle.md`
> and `references/06-database.md` — and skip writing the config folder, I only
> want the findings."

---

## 3. Quick reference

| I want to… | Do this |
|---|---|
| Full audit + configs | "Audit this Laravel app for performance and produce the config files." |
| One layer only | Name the section file: "use `references/06-database.md`, DB only." |
| Just a config file | Name the template: "adapt `assets/PERF_CONFIGS/opcache.ini` for my box." |
| Keep output out of the repo | Add: "write the report to a separate folder, don't modify the project." |
| Understand a severity | See the legend above, or `SKILL.md`. |

---

## 4. Known limitation

The audit reasons about **production** hardware, but usually runs on a **dev**
machine. When it can't read the real box (e.g. you're on Windows/macOS auditing
a Linux server), all PHP-FPM / OPcache / worker sizing is computed from an
assumed **2 GB / 2-core** baseline and flagged as an assumption in the report's
executive summary. Recompute those values on the real server before deploying —
`references/07-php-fpm-opcache.md` has the formulas.
