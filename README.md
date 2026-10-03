# Corbital Laravel Plugins — Claude Code Marketplace

A [Claude Code](https://claude.com/claude-code) plugin marketplace for Laravel
development, performance, and operations. Currently ships one plugin:

## `laravel-production-audit`

Audits an existing **Laravel 13 / PHP 8.4** application for **production
readiness** — performance, memory footprint, reliability, concurrency, and
tenancy isolation — then generates **production-ready config files**: Horizon,
PHP-FPM, OPcache, Nginx, Supervisor, Redis separation, hardened `.env`, deploy
script, and missing-index migration stubs.

It produces two deliverables: a `PERF_AUDIT_REPORT.md` (findings by severity, each
citing `file:line`) and a `PERF_CONFIGS/` folder of complete config files.

## Install

In Claude Code:

```
/plugin marketplace add cijagani/laravel-perf-audit-marketplace
/plugin install laravel-production-audit@corbital-laravel-plugins
```

Or via the CLI:

```bash
claude plugin marketplace add cijagani/laravel-perf-audit-marketplace
claude plugin install laravel-production-audit@corbital-laravel-plugins
```

> `cijagani/laravel-perf-audit-marketplace` is the GitHub repo; `corbital-laravel-plugins`
> (after the `@`) is the marketplace name from `.claude-plugin/marketplace.json`.
> They're different on purpose — the marketplace name doesn't change if the repo moves.

## Use

Once installed, just ask Claude in plain language — the skill auto-triggers:

- "Audit my Laravel app for production readiness and give me the config files."
- "Why is my Laravel app slow under load?"
- "Tune Horizon — workers keep getting OOM-killed."
- "Get this Laravel project production-ready."

You can also run a single audit section or grab a single config template — see
the skill's `HELP.md` for individual-file usage.

See [`docs/SAMPLE_REPORT.md`](docs/SAMPLE_REPORT.md) for a trimmed, anonymized
example of the output before you install.

## What's inside

```
laravel-perf-audit-marketplace/
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    └── laravel-production-audit/
        ├── .claude-plugin/
        │   └── plugin.json
        └── skills/
            └── laravel-production-audit/
                ├── SKILL.md        ← agent-facing instructions
                ├── HELP.md         ← human usage guide
                ├── references/     ← 15 self-contained audit sections + output contract
                └── assets/PERF_CONFIGS/  ← 12 annotated config templates
```

## Homepage

The landing page is served via GitHub Pages at
<https://cijagani.github.io/laravel-perf-audit-marketplace/>. The built output lives in
[`docs/`](docs/); the source is a Vite + React + Tailwind + shadcn/ui project in
[`site/`](site/) (see [`site/README.md`](site/README.md) to rebuild).

To enable it: in the GitHub repo, **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, then select branch `main` and folder `/docs`.
No GitHub Action is needed — the build is committed under `docs/`.

> If you publish under a different `owner/repo`, update the install commands
> above, the `homepage` URLs in both manifests, the `base` in
> `site/vite.config.ts`, and the `REPO` constant in `site/src/content.ts`, then
> rebuild.

## License

MIT — see [LICENSE](LICENSE).
