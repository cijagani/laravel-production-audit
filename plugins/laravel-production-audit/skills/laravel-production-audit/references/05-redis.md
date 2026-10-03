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
- **Is each cache worth it?** For every `remember`/`put` on a hot path, note:
  what it saves (a 2ms PK lookup isn't worth a Redis round-trip), hit rate
  (keyed so narrowly it's never re-read?), how often it's invalidated
  (busted on every write = pure overhead), value size (whole collections or
  models serialized per key 🟡), and the tenant/user in the key. A cache that
  saves nothing is a 🟡 finding — remove it. Prefer making the work cheaper
  over caching it.
- Cache reads/writes inside loops 🟠 — `Cache::many()` / `putMany()` or one
  key for the set
- `Cache::tags()` used on a store that supports it? 🟡 In Laravel 13 tags work on
  redis, memcached, dynamodb, array, and (since L11) database/file — but only on a
  *taggable* store. Confirm the configured store supports tags rather than assuming
  "Redis only."
- `Cache::lock()` used for mutexes instead of DB locks? 🟢 positive
- `Cache::forever()` calls without an invalidation strategy? 🟠
- Hot keys rebuilt with `Cache::remember()` where an expiry causes a stampede of
  identical slow queries? 🟡 — `Cache::flexible($key, [$fresh, $stale], fn)`
  serves stale data while one request recomputes.
- The same key read many times per request/job? 🟡 — `Cache::memo()->get()`
  memoizes it in-process (one Redis round-trip instead of N).
- `get` + `put` just to extend a TTL? 🟡 — L13 `Cache::touch($key, $ttl)` does it
  without transferring the value.

## 5.2 Session

- `SESSION_DRIVER=redis` confirmed? 🟠 if file
- `SESSION_CONNECTION` set when `SESSION_DRIVER=redis`? 🟡 — if it's unset, the
  session handler uses the **`default`** Redis connection, which is the one the
  queue uses. Sessions then share the queue's DB (and any `FLUSHDB` on it), no
  matter what a `session` connection in `database.php` says.
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
  🟡 suggestion if not separated. Separation stops a `cache:clear` (which
  `FLUSHDB`s the cache connection's DB) from wiping queued jobs. It does **not**
  give each DB its own eviction policy — see 5.5.
- Hand-written Redis stanza dropped the stock keys? 🟡 — Laravel 13's
  `database.php` ships the full set of connection keys plus `max_retries`,
  `backoff_algorithm`, `backoff_base`, `backoff_cap` on each connection. A
  custom stanza that drops any of the stock connection keys fails against a
  protected Redis; without the retry keys it loses reconnect-with-backoff.
- Redis Cluster in use? Cluster only supports DB 0, so DB separation becomes
  prefix separation — and Horizon "is not compatible with Redis Cluster"
  (Horizon docs) 🔴 if both are configured.

## 5.5 Redis server memory policy

Ask for (or read, if present in the repo/infra) the server's `redis.conf` /
managed-Redis settings. `maxmemory` and `maxmemory-policy` are **per instance**,
shared by every logical DB:

- No `maxmemory` set 🟠 — Redis grows until the OS OOM-kills it, taking queue,
  cache, sessions, and locks down together.
- `allkeys-lru` / `allkeys-lfu` / `allkeys-random` on an instance that also
  holds queues 🔴 — under memory pressure Redis silently evicts **queued jobs**,
  Horizon state, and locks. Jobs vanish with no failure record.
- `noeviction` on an instance whose main load is cache 🟡 — when full, every
  write (including job pushes) errors with `OOM command not allowed`.
- Workable single-instance setting: `volatile-lru` / `volatile-ttl` — only keys
  with a TTL are evictable, so queue keys (no TTL) survive. This only works if
  every cache write has a TTL (5.1). Best: a separate Redis instance for cache
  with `allkeys-lru`, and `noeviction` on the queue/session instance.

> Can't see the Redis server config? Mark it `MISSING`, state the assumption, and
> put the recommended `maxmemory` / `maxmemory-policy` lines in
> `redis-separation.md` for the operator to verify.

## 5.6 Pub/Sub & Reverb (if present)

- Laravel Reverb present? Check `config/reverb.php`.
- Broadcast events dispatched inside the HTTP request path? 🔴 — must queue broadcast
- `ShouldBroadcastNow` used? 🟠 — prefer `ShouldBroadcast` (which queues)

## Output for §5

- Redis finding table
- Prescribe a `config/database.php` Redis stanza + recommended DB separation
