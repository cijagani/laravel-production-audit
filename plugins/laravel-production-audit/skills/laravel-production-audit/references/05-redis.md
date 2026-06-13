# §5 — Redis Audit

**Goal:** Redis backs cache, session, queue, rate-limiting, and locks. No
redundant round-trips. Proper TTLs. No key explosion. A cache without a TTL is a
memory leak with extra steps.

## 5.1 Cache usage

- `CACHE_STORE=redis`? 🔴 if not, in a non-trivial app. (Laravel 11+ renamed the
  env key from `CACHE_DRIVER` to `CACHE_STORE`; a stray `CACHE_DRIVER` is ignored,
  so flag that too — it's a silent no-op the user likely thinks is working.)
- `SESSION_DRIVER=redis`? 🟠 if file (file sessions don't scale horizontally)
- TTL set on every `Cache::put()` / `cache()->remember()`? 🔴 if TTL missing
- Cache keys namespaced per tenant? 🔴 if MT detected + missing (cross-tenant leak)
- `Cache::tags()` used on a store that supports it? 🟡 In Laravel 13 tags work on
  redis, memcached, dynamodb, array, and (since L11) database/file — but only on a
  *taggable* store. Confirm the configured store supports tags rather than assuming
  "Redis only."
- `Cache::lock()` used for mutexes instead of DB locks? 🟢 positive
- `Cache::forever()` calls without an invalidation strategy? 🟠

## 5.2 Session

- `SESSION_DRIVER=redis` confirmed? 🟠 if file
- `SESSION_LIFETIME` appropriate (not so long it drives memory growth)? 🟡
- `SESSION_ENCRYPT=true` for sensitive apps? 🟡

## 5.3 Rate limiting

- API routes using `throttle:` middleware backed by Redis? 🟡 (confirm driver)
- `RateLimiter::for()` defined in a provider? (note pattern)
- `Cache::lock()` + `block()` used for concurrency control? 🟢 positive if present

## 5.4 Redis connection efficiency

- `REDIS_CLIENT=phpredis` (C extension) vs `predis` (pure PHP)? 🟠 if predis —
  phpredis is significantly faster and uses less memory.
- Persistent connection used? (`REDIS_PERSISTENT=1` / phpredis persistent flag)
- Connection pooled via a single connection per worker? (note Horizon behavior)
- Multiple Redis databases for separation (queue db=0, cache db=1, session db=2)?
  🟡 suggestion if not separated.

## 5.5 Pub/Sub & Reverb (if present)

- Laravel Reverb present? Check `config/reverb.php`.
- Broadcast events dispatched inside the HTTP request path? 🔴 — must queue broadcast
- `ShouldBroadcastNow` used? 🟠 — prefer `ShouldBroadcast` (which queues)

## Output for §5

- Redis finding table
- Prescribe a `config/database.php` Redis stanza + recommended DB separation
