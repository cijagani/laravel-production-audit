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
> and other per-request hooks in §1.

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

## Output for §9

- Finding table per item
- Prescribe an annotated `.env.production.example` with all perf-relevant keys set
- Prescribe a `deploy.sh` snippet. On Laravel 13 a single `php artisan optimize`
  rebuilds config + route + view + event caches, so prefer that one command over
  running the four individually (running both just caches everything twice).
  Order: `optimize:clear` (drop stale caches) → `optimize` (rebuild) → restart
  workers so they pick up new code.
