// All page copy and data in one place, so the JSX stays structural.

export const REPO = "corbital/corbital-laravel-plugins"
export const REPO_URL = `https://github.com/${REPO}`
export const MARKETPLACE = "corbital-laravel-plugins"
export const PLUGIN = "laravel-production-audit"

export const install = {
  cc: [
    `/plugin marketplace add ${REPO}`,
    `/plugin install ${PLUGIN}@${MARKETPLACE}`,
  ],
  cli: [
    `claude plugin marketplace add ${REPO}`,
    `claude plugin install ${PLUGIN}@${MARKETPLACE}`,
  ],
}

// The 11 audit sections — the § numbering is real, it encodes the actual workflow.
export const sections = [
  { n: 1, title: "HTTP request lifecycle", blurb: "Blocking work in the request path — sync HTTP calls, un-queued mail, heavy middleware." },
  { n: 2, title: "Queue & Horizon", blurb: "Job design, supervisor sizing, failed jobs, and queues nothing actually drains." },
  { n: 3, title: "Scheduler & cron", blurb: "Overlap guards, background runs, one-server locks, the cron entry itself." },
  { n: 4, title: "Memory & footprint", blurb: "Unbounded loads, chunking, per-worker RSS. Built for small hardware." },
  { n: 5, title: "Redis", blurb: "Cache / session / lock usage, TTL gaps, phpredis vs predis, DB separation." },
  { n: 6, title: "Database", blurb: "N+1 detection, missing indexes, query efficiency, write-in-loop patterns." },
  { n: 7, title: "PHP-FPM & OPcache", blurb: "Pool sizing to cores, OPcache for PHP 8.4 with JIT, worker recycling." },
  { n: 8, title: "Supervisor", blurb: "Process supervision, memory bounds, graceful restarts for every worker." },
  { n: 9, title: "App config", blurb: "Config/route/view/event caching, provider boot cost, debug & log hardening." },
  { n: 10, title: "Concurrency", blurb: "Duplicate jobs, TOCTOU races, atomic increments under real load." },
  { n: 11, title: "Multi-tenancy", blurb: "Per-tenant cache & queue isolation — where a missing prefix is a data leak." },
]

export const prompts = [
  "Audit my Laravel app for production readiness and give me the config files.",
  "Why is my Laravel app slow under load?",
  "Tune Horizon — workers keep getting OOM-killed.",
  "Get this Laravel project production-ready before we go live.",
]

export const configs = [
  "horizon.php", "supervisor-laravel.conf", "php-fpm-www.conf", "opcache.ini",
  "php-web.ini", "php-cli.ini", "nginx-performance.conf", "redis-separation.md",
  ".env.production.example", "deploy-cache.sh", "INDEXES_TO_ADD.md",
]

// The hero artifact: a faux audit-report card. Findings are illustrative.
export const reportLines: {
  glyph: "🔴" | "🟠" | "🟡" | "✅"
  tone: "critical" | "high" | "medium" | "ok"
  loc?: string
  text: string
}[] = [
  { glyph: "🔴", tone: "critical", loc: "app/Events/InvoicePaid.php:18", text: "event queues to 'broadcasts'; no worker drains it → never fires" },
  { glyph: "🔴", tone: "critical", loc: ".env.example:2,4", text: "ships APP_ENV=local, APP_DEBUG=true" },
  { glyph: "🟠", tone: "high", loc: "app/Http/Middleware/CompressResponse.php:34", text: "gzips full response in PHP — Nginx's job" },
  { glyph: "🟠", tone: "high", loc: "database/migrations/…invoices.php:19", text: "no index on `status`, filtered every request" },
  { glyph: "🟡", tone: "medium", loc: "app/Providers/AppServiceProvider.php:41", text: "config mutated in boot() on every request" },
  { glyph: "✅", tone: "ok", text: "Redis split into logical DBs — cache flush won't drop the queue" },
  { glyph: "✅", tone: "ok", text: "phpredis (C ext) + persistent connections" },
]
