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

// The audit sections — the § numbering is real, it encodes the actual workflow.
// `when` marks sections that only run if discovery detects the trigger.
export const sections: { n: number; title: string; blurb: string; when?: string }[] = [
  { n: 1, title: "HTTP request lifecycle", blurb: "Blocking work in the request path, un-queued mail, heavy middleware, outbound APIs without timeouts or idempotency." },
  { n: 2, title: "Queue & Horizon", blurb: "The timeout → retry_after chain, fan-out size, retry storms, L13 job attributes, queues nothing drains." },
  { n: 3, title: "Scheduler & cron", blurb: "Per-task duration vs frequency, overlap, one-server locks, full-table rescans, housekeeping tasks." },
  { n: 4, title: "Memory & footprint", blurb: "Unbounded loads, chunking, per-worker RSS, static/singleton state that outlives a job." },
  { n: 5, title: "Redis", blurb: "TTL gaps, caches that save nothing, maxmemory-policy that evicts queued jobs, DB separation." },
  { n: 6, title: "Database", blurb: "N+1, hidden $with/$appends work, justified indexes, short transactions, PgBouncer, connection budget." },
  { n: 7, title: "PHP-FPM & OPcache", blurb: "Pool sizing to cores, OPcache for PHP 8.4 with JIT, worker recycling." },
  { n: 8, title: "Supervisor", blurb: "Process supervision, memory bounds, stopwaitsecs longer than your longest job." },
  { n: 9, title: "App config", blurb: "Caching, provider boot cost, deploys that flush the cache, Telescope/Debugbar left on." },
  { n: 10, title: "Concurrency", blurb: "Unique vs overlap vs debounce, TOCTOU races, idempotent side effects under retries." },
  { n: 11, title: "Multi-tenancy", blurb: "Per-tenant isolation and noisy neighbours — where a missing prefix is a data leak.", when: "tenancy package" },
  { n: 12, title: "Distributed workers", blurb: "Extra worker servers & containers: shared state, version skew, graceful node drain.", when: ">1 worker host" },
  { n: 13, title: "Livewire", blurb: "Per-request cost of components: computed vs public props, polling arithmetic, lazy loading.", when: "Livewire" },
  { n: 14, title: "Inertia v3", blurb: "HandleInertiaRequests, eager vs once/deferred props, payload size, request count, SSR, Vue/React bundles.", when: "Inertia" },
]

export const prompts = [
  "Audit my Laravel app for production readiness and give me the config files.",
  "Why is my Laravel app slow under load?",
  "Tune Horizon — workers keep getting OOM-killed.",
  "Get this Laravel project production-ready before we go live.",
  "Our jobs sometimes run twice — find out why.",
  "We're adding a second queue-worker server. What breaks?",
  "Our Inertia pages feel slow — audit HandleInertiaRequests and our props.",
]

export const configs = [
  "horizon.php", "supervisor-laravel.conf", "php-fpm-www.conf", "opcache.ini",
  "php-web.ini", "php-cli.ini", "nginx-performance.conf", "redis-separation.md",
  ".env.production.example", "deploy-cache.sh", "INDEXES_TO_ADD.md",
  "docker-compose.worker.yml",
]

// The hero artifact: a faux audit-report card. Findings are illustrative.
export const reportLines: {
  glyph: "🔴" | "🟠" | "🟡" | "✅"
  tone: "critical" | "high" | "medium" | "ok"
  loc?: string
  text: string
}[] = [
  { glyph: "🔴", tone: "critical", loc: "app/Events/InvoicePaid.php:18", text: "event queues to 'broadcasts'; no worker drains it → never fires" },
  { glyph: "🔴", tone: "critical", loc: "deploy/supervisor/worker.conf:4", text: "--timeout=120 ≥ retry_after 90 → long jobs run twice" },
  { glyph: "🔴", tone: "critical", loc: ".env.example:2,4", text: "ships APP_ENV=local, APP_DEBUG=true" },
  { glyph: "🟠", tone: "high", loc: "app/Http/Middleware/CompressResponse.php:34", text: "gzips full response in PHP — Nginx's job" },
  { glyph: "🟠", tone: "high", loc: "database/migrations/…invoices.php:19", text: "no index on `status`, filtered every request" },
  { glyph: "🟡", tone: "medium", loc: "app/Providers/AppServiceProvider.php:41", text: "config mutated in boot() on every request" },
  { glyph: "✅", tone: "ok", text: "Redis split into logical DBs — cache flush won't drop the queue" },
  { glyph: "✅", tone: "ok", text: "phpredis (C ext) + persistent connections" },
]
