# §0 — Project Discovery (mandatory first pass)

Run these reads and searches before any audit section. The point is to ground
every later finding in something you actually saw. Keep a running **Discovery
Log** — when a later section needs "the queue driver" or "the list of jobs,"
it's already here.

> **Skeleton matters.** Laravel 11+ (and 13) dropped the old `app/Http/Kernel.php`
> and `app/Console/Kernel.php`, and a fresh skeleton ships with **no** `app/Jobs/`
> or `app/Console/Commands/` directories at all. If a path below is absent, that's
> normal — it's not a finding, it's the modern structure. Look in the new homes:
>
> | Old (≤10) | New (11+/13) |
> |-----------|--------------|
> | `app/Http/Kernel.php` (middleware) | `bootstrap/app.php` → `->withMiddleware(...)` |
> | `app/Console/Kernel.php` (schedule) | `routes/console.php` **or** a `*ServiceProvider` calling `Schedule::command()` |
> | `app/Jobs/` | may not exist — search `implements ShouldQueue` instead |
> | `app/Console/Commands/` | may not exist — search `extends Command` instead |
>
> Mark a genuinely-absent path `MISSING` only when its *content* should exist
> somewhere and doesn't (e.g. no scheduling anywhere). An empty `app/Jobs/` in a
> new skeleton is just `0 jobs`, not a problem.

## Reads

```
READ:  composer.json                  → PHP version, Laravel version, key packages
READ:  composer.lock                  → Exact versions of spatie/*, horizon, octane, etc.
READ:  .env.example                   → Available env keys (never read .env directly)
READ:  config/app.php                 → timezone, locale, providers
READ:  config/database.php            → connections, pool sizes, sticky, persistent
READ:  config/queue.php               → default driver, connections, retry_after
READ:  config/horizon.php             → environments, supervisors, balance strategy
READ:  config/cache.php               → default store, Redis config
READ:  config/session.php             → driver, lifetime, encrypt
READ:  config/logging.php             → channels (async? sync? stack depth?)
READ:  config/filesystems.php         → local vs cloud, visibility defaults
READ:  bootstrap/app.php              → middleware stack, service providers
READ:  app/Http/Kernel.php            → global middleware chain (if Laravel ≤11 structure)
READ:  routes/web.php                 → total route count, grouping, middleware usage
READ:  routes/api.php                 → rate limiting, auth middleware
READ:  app/Providers/                 → all service providers (boot() side effects?)
READ:  app/Jobs/                      → all job classes
READ:  app/Console/Commands/          → all artisan commands
READ:  app/Console/Kernel.php         → schedule() definitions (or bootstrap/schedule.php)
READ:  app/Http/Middleware/           → all middleware files
READ:  app/Models/                    → all Eloquent models (relations, scopes, casts)
```

## Globs

```
GLOB:  app/Http/Controllers/**/*.php  → controller methods (N+1 risk, sync HTTP calls)
GLOB:  app/Services/**/*.php          → service classes (blocking calls, large loops)
GLOB:  app/Listeners/**/*.php         → event listeners (queued? sync?)
GLOB:  app/Observers/**/*.php         → model observers (queued? heavy logic?)
GLOB:  app/Notifications/**/*.php     → notification classes (queued? channels?)
GLOB:  app/Mail/**/*.php              → mailables (queued? sync send?)
GLOB:  database/migrations/           → migration count, index presence, FK constraints
```

## Searches

```
SEARCH: "Http\Client\Client"          → identify all raw HTTP client usage
SEARCH: "Http::get|Http::post|Http::put|Http::patch|Http::delete"
SEARCH: "file_get_contents|curl_init|Guzzle"
SEARCH: "sleep(|usleep("              → artificial delays
SEARCH: "ShouldQueue"                 → jobs/listeners/notifications that DO implement it
SEARCH: "implements ShouldBeUnique"   → unique job implementations
SEARCH: "withoutOverlapping"          → schedule overlap guards
SEARCH: "->chunk(|->cursor(|->lazy("  → chunked queries
SEARCH: "DB::transaction"             → transaction usage
SEARCH: "->with(|->load("             → eager loading presence
SEARCH: "->get()|->all()"             → potential unbounded collection loads
SEARCH: "cache()|Cache::"             → cache usage patterns
SEARCH: "Redis::|redis()->"           → direct Redis usage
SEARCH: "dispatch(|dispatchSync("     → job dispatch patterns (sync vs async)
SEARCH: "Queue::fake|Bus::fake"       → test-only patterns (skip)
SEARCH: "artisan schedule:run"        → cron entry presence
SEARCH: "php artisan|Process::"       → spawning sub-processes from code
SEARCH: "Log::info|Log::debug|Log::error" → log volume risk
SEARCH: "->paginate|->simplePaginate|->cursorPaginate"
SEARCH: "->select(|->addSelect("      → column selection (SELECT * risk)
SEARCH: "withCount|withSum|withAvg"   → aggregate eager loads
SEARCH: "unique()|duplicates()"       → in-memory collection dedup (memory risk)
```

## Discovery Log — record these before moving on

- Laravel version confirmed
- PHP version confirmed
- Tenancy package detected (if any): stancl/tenancy, spatie/multitenancy,
  custom prefix, or none
- Database driver: mysql / pgsql
- Queue driver: redis (expected) / sync / database
- Horizon: present / missing
- Octane: present / missing
- Total job classes count
- Total scheduled commands count
- Total middleware count
- Any blocking HTTP-call locations (file + line)

If §0 finds **no tenancy package**, skip §11 entirely. Everything else runs
regardless.
