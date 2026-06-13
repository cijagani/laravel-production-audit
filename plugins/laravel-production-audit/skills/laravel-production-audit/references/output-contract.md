# §Final — Output Contract

After completing all sections, write exactly two deliverables to disk in the
project being audited.

## Deliverable 1: `PERF_AUDIT_REPORT.md`

Use this structure:

```markdown
# Performance Audit Report
## Project: [detected name from composer.json]
## Date: [today]
## Laravel: [version] | PHP: [version] | DB: [driver] | Tenancy: [detected/none]

---

## Executive Summary
[3–5 sentences on the biggest risks found]

## Critical Issues (🔴) — Fix Before Go-Live
[table: Section | File | Issue | Fix]

## High Priority (🟠) — Fix Within Sprint
[table]

## Medium Priority (🟡) — Fix Within Month
[table]

## Already Good (✅)
[bullet list of things done correctly]

---

## Section-by-Section Findings

### §1 HTTP Request Lifecycle
...
### §2 Queue & Horizon
...
[continue for all sections run]
```

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

Every file must have:

1. A header comment naming the project and the audit date.
2. Every non-obvious setting explained with an inline `# reason: ...` comment.
3. Any value derived from a formula showing the formula in a comment.

Never leave a `YOUR_VALUE_HERE` placeholder unresolved. If you had to assume a
value (e.g. RAM you couldn't read), make the assumption obvious in the report's
executive summary so the operator knows what to double-check.
