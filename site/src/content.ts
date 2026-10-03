// All page copy and data in one place, so the JSX stays structural.

export const VERSION = "1.1.0"
export const REPO = "cijagani/laravel-production-audit"
export const REPO_URL = `https://github.com/${REPO}`
export const MARKETPLACE = "laravel-production-audit"
export const PLUGIN = "laravel-production-audit"
const REF_URL = `${REPO_URL}/blob/main/plugins/${PLUGIN}/skills/${PLUGIN}/references`
export const SAMPLE_URL = `${REPO_URL}/blob/main/docs/SAMPLE_REPORT.md`
export const RELEASES_URL = `${REPO_URL}/releases`

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

export const stack = ["Laravel 13", "PHP 8.4", "Horizon 5", "Inertia v3", "Livewire 4", "PostgreSQL · PgBouncer"]

// The workflow really is a sequence — the skill runs these in order.
export const steps = [
  { title: "Discover", text: "Reads lockfiles and config: versions, drivers, tenancy, worker topology, frontend stack." },
  { title: "Map hot paths", text: "Finds the routes, jobs, and tasks that run most and traces each one end to end." },
  { title: "Run the sections", text: "Ten always run. Four run only when discovery finds what they audit." },
  { title: "Write two files", text: "A report where every finding cites file:line, and a folder of production config." },
]

export type Section = {
  n: number
  title: string
  blurb: string
  when?: string
  goal: string
  checks: string[]
  file: string
}

// § numbering is real: it matches the skill's reference files.
export const sections: Section[] = [
  {
    n: 1, title: "HTTP request lifecycle", file: "01-http-lifecycle.md",
    blurb: "Blocking work in the request path, un-queued mail, heavy middleware, outbound APIs without timeouts.",
    goal: "Nothing slow happens before the response is sent.",
    checks: [
      "Middleware that queries the database or calls an API on every request",
      "Mail and notifications sent synchronously; heavy listeners and observers inline",
      "Outbound HTTP without explicit timeouts (Laravel waits 30s by default)",
      "Retries without backoff, POSTs without idempotency keys, calls that could use Http::pool",
    ],
  },
  {
    n: 2, title: "Queue & Horizon", file: "02-queue-horizon.md",
    blurb: "The timeout → retry_after chain, fan-out size, retry storms, L13 job attributes, undrained queues.",
    goal: "Jobs run once, finish in time, and every queue has a worker.",
    checks: [
      "Timeout chain: job timeout < worker timeout < retry_after < stop grace period",
      "Fan-out of one job per row, retry storms, heavy payloads",
      "Laravel 13 attributes (#[Tries], #[Timeout], #[DebounceFor]) and Queue::route",
      "Horizon priorities — auto balancing ignores queue order — plus recycling, alerts, pruning",
    ],
  },
  {
    n: 3, title: "Scheduler & cron", file: "03-scheduler-cron.md",
    blurb: "Duration vs frequency per task, overlap, one-server locks, full-table rescans, housekeeping.",
    goal: "Every task finishes before its next run, on exactly one server.",
    checks: [
      "A table per task: frequency, duration, database, Redis, and queue impact",
      "withoutOverlapping and onOneServer backed by one shared cache",
      "Tasks that rescan whole tables instead of resuming from a checkpoint",
      "Housekeeping scheduled: horizon:snapshot, queue:prune-failed, queue:prune-batches",
    ],
  },
  {
    n: 4, title: "Memory & footprint", file: "04-memory.md",
    blurb: "Unbounded loads, chunking, per-worker RSS, state that outlives a job.",
    goal: "Worker memory stays flat across thousands of jobs.",
    checks: [
      "Unbounded get() / all(); where chunkById, lazy, or cursor belongs",
      "File imports read fully into memory instead of streamed",
      "static arrays and singletons that grow per job (scoped() bindings reset; singletons don't)",
      "Worker recycling by job count, time, and memory",
    ],
  },
  {
    n: 5, title: "Redis", file: "05-redis.md",
    blurb: "TTL gaps, caches that save nothing, an eviction policy that drops queued jobs.",
    goal: "Redis holds the right data, with TTLs, and never evicts a job.",
    checks: [
      "A TTL on every cache write; caches that cost more than they save",
      "maxmemory-policy: allkeys-* silently evicts queued jobs",
      "Queue, cache, and session separated — including SESSION_CONNECTION",
      "phpredis with retry and backoff; Cache::flexible, memo, and touch where they fit",
    ],
  },
  {
    n: 6, title: "Database", file: "06-database.md",
    blurb: "N+1, hidden model work, justified indexes, short transactions, PgBouncer, connection budget.",
    goal: "Fewer queries, smaller results, short transactions.",
    checks: [
      "N+1, totals computed in PHP, and hidden work from $with, $appends, and observers",
      "Each index justified: the query it serves, column order, selectivity, partial or composite",
      "Transactions free of HTTP calls and wide locks; retries that repeat side effects",
      "PgBouncer transaction pooling hazards and a connection budget across every host",
    ],
  },
  {
    n: 7, title: "PHP-FPM & OPcache", file: "07-php-fpm-opcache.md",
    blurb: "Pool sizing to RAM and cores, OPcache for PHP 8.4, worker recycling.",
    goal: "The pool fits the machine, and code compiles once.",
    checks: [
      "pm.max_children from available RAM and measured worker RSS",
      "OPcache memory, file count, and validate_timestamps=0 in production",
      "JIT only when the workload is CPU-bound",
      "Separate php.ini limits for web and CLI workers",
    ],
  },
  {
    n: 8, title: "Supervisor", file: "08-supervisor.md",
    blurb: "Every long-running process supervised, with stopwaitsecs longer than the longest job.",
    goal: "Every long-running process restarts on failure and stops gracefully.",
    checks: [
      "A program block for Horizon or queue:work, Reverb, and the SSR server",
      "stopwaitsecs longer than the longest job; stopasgroup and killasgroup",
      "queue:work flags: --timeout, --max-jobs, --max-time, --memory",
      "The scheduler run by cron or schedule:work — never both",
    ],
  },
  {
    n: 9, title: "App config", file: "09-app-config.md",
    blurb: "Caching, provider boot cost, deploys that flush the cache, debug tools left on.",
    goal: "Production does no work it could have cached.",
    checks: [
      "php artisan optimize in the deploy, without a bare optimize:clear (it flushes the cache)",
      "Uncached database queries in service-provider boot()",
      "APP_DEBUG, log level, and log channel for production volume",
      "Telescope or Debugbar enabled in production; packages that boot but aren't used",
    ],
  },
  {
    n: 10, title: "Concurrency", file: "10-concurrency.md",
    blurb: "Unique vs overlap vs debounce, check-then-set races, idempotent side effects.",
    goal: "No double charges and no lost updates under load.",
    checks: [
      "Cache::has then put, and read-modify-write counters without atomic operations",
      "ShouldBeUnique vs WithoutOverlapping vs #[DebounceFor], used for the right job",
      "Locks that expire if a worker crashes",
      "Side effects that are safe to repeat when a job retries",
    ],
  },
  {
    n: 11, title: "Multi-tenancy", file: "11-multitenancy.md", when: "tenancy package",
    blurb: "Tenant isolation and noisy neighbours — where a missing prefix is a data leak.",
    goal: "One tenant can't see another's data, or slow everyone else down.",
    checks: [
      "Tenant-prefixed cache keys and tenant context restored for every job",
      "Large tenants filling shared queues ahead of everyone else",
      "Indexes that lead with tenant_id; queries that bypass the tenant scope",
      "Schema-per-tenant behind PgBouncer: search_path leaking between tenants",
    ],
  },
  {
    n: 12, title: "Distributed workers", file: "12-distributed-workers.md", when: "multiple worker hosts",
    blurb: "Extra worker servers and containers: shared state, version skew, graceful drain.",
    goal: "Any node can run any job, and any node can be drained safely.",
    checks: [
      "Files written to local disk that another node or the web server needs",
      "One shared cache for locks, unique jobs, and restart signals",
      "horizon:terminate only reaches its own host; containers need pcntl and a long stop grace period",
      "Healthchecks scoped to the host; per-node queues via HORIZON_ENV",
    ],
  },
  {
    n: 13, title: "Livewire", file: "13-livewire.md", when: "Livewire",
    blurb: "Per-request component cost: computed vs public properties, polling, lazy loading.",
    goal: "Each component round trip stays cheap at full concurrency.",
    checks: [
      "Queries in render() vs #[Computed], memoized per request",
      "Large public properties sent on every round trip; #[Locked] where users mustn't edit",
      "wire:poll counted as users × ticks × queries per minute",
      "#[Lazy] and #[Defer] for below-the-fold components, bundled when there are many",
    ],
  },
  {
    n: 14, title: "Inertia v3", file: "14-inertia.md", when: "Inertia",
    blurb: "HandleInertiaRequests, eager vs once or deferred props, payload size, request count.",
    goal: "Less work per request, and fewer requests.",
    checks: [
      "share() values computed eagerly vs closures vs Inertia::once",
      "Full models in auth.user; version() values that force full reloads",
      "Every source of extra requests: polls, prefetch, deferred groups, layouts that re-fetch",
      "SSR only where it pays off; page splitting; Vue 3 and React 19 rendering cost",
    ],
  },
].map((s) => ({ ...s, file: `${REF_URL}/${s.file}` }))

export const discovery = {
  goal: "Ground every later finding in something actually read.",
  checks: [
    "Versions from composer.lock and the JS lockfile — Laravel, Horizon, Inertia, Livewire",
    "Queue driver, retry_after, cache store, tenancy package, worker topology",
    "Every job, command, middleware, and outbound HTTP call site",
    "A hot-path map: the routes, jobs, and tasks that matter most",
  ],
  file: `${REF_URL}/00-discovery.md`,
}

export const prompts = [
  "Audit my Laravel app for production readiness and give me the config files.",
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

// The skill's own severity legend (SKILL.md), shown as the report shows it.
export const severities = [
  { glyph: "🔴", label: "Critical", tone: "critical", when: "Fix before go-live", text: "Data leaks, out-of-memory crashes, a blocked request path, jobs that run twice." },
  { glyph: "🟠", label: "High", tone: "high", when: "Fix this sprint", text: "Real cost on a hot path: N+1 queries, eager shared props, missing timeouts." },
  { glyph: "🟡", label: "Medium", tone: "medium", when: "Fix this month", text: "Measurable waste off the hot path, or a cache that saves nothing." },
  { glyph: "✅", label: "Leave as is", tone: "ok", when: "No action", text: "Verified good — listed so nobody “optimizes” it later." },
] as const

export type Severity = "critical" | "high" | "medium"
export const glyph: Record<Severity, string> = { critical: "🔴", high: "🟠", medium: "🟡" }

// The hero animation: real-looking files, the line the audit stops on, and the
// finding it writes. Illustrative, but each is a check the skill really runs.
export const auditRuns: {
  file: string
  start: number
  lines: string[]
  hit: number // line number (not index) the finding cites
  severity: Severity
  section: string
  finding: string
}[] = [
  {
    file: "deploy/supervisor/worker.conf",
    start: 1,
    lines: [
      "[program:laravel-worker]",
      "process_name=%(program_name)s_%(process_num)02d",
      "numprocs=4",
      "command=php artisan queue:work redis --timeout=120",
      "autorestart=true",
      "stopasgroup=true",
      "stopwaitsecs=3600",
    ],
    hit: 4,
    severity: "critical",
    section: "§2",
    finding: "--timeout=120 outlives retry_after (90). Jobs longer than 90s run twice.",
  },
  {
    file: "app/Http/Middleware/HandleInertiaRequests.php",
    start: 34,
    lines: [
      "public function share(Request $request): array",
      "{",
      "    return [",
      "        ...parent::share($request),",
      "        'plans' => Plan::with('features')->get(),",
      "        'auth.user' => $request->user(),",
      "    ];",
      "}",
    ],
    hit: 38,
    severity: "high",
    section: "§14",
    finding: "Runs on every Inertia request, polls and prefetches included. Use Inertia::once().",
  },
  {
    file: "app/Services/CampaignService.php",
    start: 86,
    lines: [
      "public function processRecipients(Campaign $campaign): void",
      "{",
      "    $recipients = $campaign->recipients()->get()",
      "        ->filter(fn ($r) => $r->subscribed);",
      "",
      "    foreach ($recipients as $recipient) {",
      "        SendCampaignEmail::dispatch($recipient);",
    ],
    hit: 88,
    severity: "high",
    section: "§6",
    finding: "Loads every recipient, then filters in PHP. Filter in SQL and chunkById(1000).",
  },
]
