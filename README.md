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
/plugin marketplace add corbital/corbital-laravel-plugins
/plugin install laravel-production-audit@corbital-laravel-plugins
```

Or via the CLI:

```bash
claude plugin marketplace add corbital/corbital-laravel-plugins
claude plugin install laravel-production-audit@corbital-laravel-plugins
```

> Replace `corbital/corbital-laravel-plugins` with the actual `owner/repo` you
> push this to. The marketplace name (`corbital-laravel-plugins`, after the `@`)
> is fixed by the manifest and does not change with the repo path.

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
corbital-laravel-plugins/
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
                ├── references/     ← 12 self-contained audit sections + output contract
                └── assets/PERF_CONFIGS/  ← 11 annotated config templates
```

## Homepage

A landing page lives at [`docs/index.html`](docs/index.html), served via GitHub
Pages at <https://corbital.github.io/corbital-laravel-plugins/>.

To enable it: in the GitHub repo, **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, then select branch `main` and folder `/docs`.
The page is a single self-contained HTML file — no build step.

> If you publish under a different `owner/repo`, update the install commands
> above, the `homepage` URLs in both manifests, and the GitHub links in
> `docs/index.html` to match.

## License

MIT — see [LICENSE](LICENSE).
