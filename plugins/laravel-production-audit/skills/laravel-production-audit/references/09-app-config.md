# §9 — Laravel Application Configuration Audit

**Goal:** config cached, routes cached, views cached, events cached, no debug in
production, minimal service-provider boot overhead. An uncached config in
production is a tax paid on every single request.

## 9.1 Cache status

Check the production deploy pipeline for:

- `php artisan config:cache` 🔴 if not in deploy
- `php artisan route:cache` 🔴 if not in deploy
- `php artisan view:cache` 🟠 if not in deploy
- `php artisan event:cache` 🟡 if not in deploy
- `php artisan icons:cache` (if Blade Icons present) 🟡
- `php artisan optimize` (Laravel 13 shorthand) 🟡

## 9.2 Service providers

Read every provider's `boot()` and `register()`:

- Any **uncached** DB query inside `boot()` 🔴 — runs on every request, breaks
  the value of config caching
- File I/O inside `boot()` without caching 🟠
- Heavy computation inside `register()` 🟠
- Providers loading config via `Config::set()` from DB 🔴 — must cache the result

> **Read what the call actually does before rating it.** A settings/feature-flag
> lookup in `boot()` (e.g. `corbital/settings`, `spatie/laravel-settings`) *looks*
> like a per-request DB hit, but these packages cache aggressively (static
> in-request + Redis). Open the package and confirm: a genuinely uncached query
> on every request is 🔴; a cached settings lookup is 🟡 at most (note the cache
> dependency) or ✅. Rating it 🔴 without reading the cache layer is exactly the
> "no assumption" rule failing. The same applies to `HandleInertiaRequests::share()`
> (audited in full in §14) and other per-request hooks in §1.

## 9.3 Debug & logging

- `APP_DEBUG=false` in production? 🔴 if true
- `APP_ENV=production`? 🔴 if not
- Log level `error` or `warning` in production? 🟠 if `debug`/`info`
- `LOG_CHANNEL=stack`? Daily rotation kept ≤7 days? 🟡
- Async logging available? Flag a `single` synchronous channel at high volume.

## 9.4 Response & HTTP cache

- `Compress` / Gzip middleware applied? 🟡
- Static assets served by Nginx directly (not PHP)? 🔴 if PHP handles assets
- Heavy read API endpoints using `Cache::remember()` with a TTL? 🟡
- `ETag` / `Last-Modified` on cacheable endpoints? 🟡

## 9.5 Package overhead

Read `composer.json` `require` (not `require-dev`) and check each package's
real runtime cost — verify usage with a search before calling anything unused:

- Telescope enabled in production with broad watchers 🔴 — it writes DB rows
  for requests, queries, jobs, and cache hits on every request. Laravel Pulse /
  Nightwatch sample instead; if Telescope must stay, filter hard and prune.
- Debugbar / Clockwork / Ray in `require` (not `require-dev`) or enabled by
  config in production 🔴
- A package registering **global** middleware, observers, or listeners on hot
  models that the app doesn't need 🟠 — opt out via its config, or
  `extra.laravel.dont-discover` in `composer.json`
- A package with zero usages in `app/`, `config/`, `routes/`, `resources/` 🟡 —
  its provider still boots on every request. Confirm before recommending
  removal; some are used only from config or Blade.
- Two packages doing the same job, or a package for something Laravel now
  ships (e.g. HTTP retries, rate limiting, `Concurrency`, `defer()`) 🟡

## Output for §9

- Finding table per item
- Prescribe an annotated `.env.production.example` with all perf-relevant keys set
- Prescribe a `deploy.sh` snippet. On Laravel 13 a single `php artisan optimize`
  rebuilds config + route + view + event caches, so prefer that one command over
  running the four individually (running both just caches everything twice).
  Order: `optimize` (rebuild — it overwrites the old cache files) → restart
  workers so they pick up new code.

> **Don't put a bare `optimize:clear` in a deploy.** It runs `cache:clear` too —
> Laravel docs: it removes the cached files "as well as all keys in the default
> cache driver". Every deploy then flushes the application cache (cold-cache
> stampede on the DB right after release), plus unique-job locks, rate-limiter
> counters and `onOneServer` locks — and, if cache shares a Redis DB with the
> queue, the queued jobs. 🟠 if found in a deploy script (🔴 if cache and queue
> share a DB). If a clear step is really wanted:
> `php artisan optimize:clear --except=cache`.

- `php artisan reload` runs `queue:restart` plus the reload hooks of packages
  like Reverb/Octane in one command — fine to use. Multi-node:
  `horizon:terminate` only terminates Horizon on the host it runs on; other
  worker hosts must restart their own Horizon (§12.3).
