# Redis DB Separation Strategy — TEMPLATE
# Project: <PROJECT NAME>   Audit date: <DATE>

Use separate logical Redis databases so a `cache:clear` (which `FLUSHDB`s the
cache connection's DB) can't flush the queue, and so each concern can be
monitored independently.

| DB | Purpose | Why separate |
|----|---------|--------------|
| 0  | Queue (Horizon) | A cache flush must never drop pending jobs |
| 1  | Cache | Highest churn; `cache:clear` only touches this DB |
| 2  | Session | Long-lived keys; survive a cache flush |

> Logical DBs do **not** get separate eviction policies — `maxmemory` and
> `maxmemory-policy` are per Redis *instance*. See the server section below.
> Redis Cluster only has DB 0 (and Horizon doesn't support Cluster at all).

## `config/database.php` Redis changes

Edit the app's existing `redis` array — don't replace it. Laravel 13's stock
config already has the connection keys (`url`, `host`, `port` and the rest,
plus `max_retries` and `backoff_*`); leave them exactly as they are. Only the
keys below change, plus one new `session` connection.

```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'), // reason: C ext, faster + lower memory than predis

    'options' => [
        // ...stock `cluster` and `prefix` keys unchanged
        'persistent' => env('REDIS_PERSISTENT', true), // reason: reuse connections per worker
    ],

    'default' => [   // queue + Horizon
        // ...stock connection keys unchanged
        'database' => env('REDIS_DB', '0'),
    ],

    'cache' => [
        // ...stock connection keys unchanged
        'database' => env('REDIS_CACHE_DB', '1'),
    ],

    // reason: new connection for sessions. Copy every key from `default`
    // (same host and auth), then change only `database`.
    'session' => [
        // ...same keys as `default`
        'database' => env('REDIS_SESSION_DB', '2'),
    ],
],
```

Common mistake this avoids: a hand-written Redis stanza that drops stock
connection and retry keys connects fine on a laptop and then fails against a
protected production Redis.

And in `.env`: `SESSION_CONNECTION=session` — without it the session driver
uses the `default` (queue) connection regardless of the stanza above.

## Redis server (`redis.conf` / managed-Redis settings)

Eviction is per instance, so pick by what the instance holds:

```conf
# Single instance holding queue + cache + sessions:
maxmemory 1gb                    # reason: <RECOMPUTE> ~50–70% of the Redis box's RAM; never unbounded
maxmemory-policy volatile-lru    # reason: only TTL'd keys are evictable — queued jobs (no TTL) survive.
                                 #         Requires a TTL on every cache write (§5.1).

# Better, two instances:
#   cache instance  → maxmemory-policy allkeys-lru   (pure cache, evict anything)
#   queue instance  → maxmemory-policy noeviction    (never silently drop a job)
```

Never `allkeys-*` on an instance that holds queues: under memory pressure Redis
silently deletes queued jobs and Horizon state, with no failed-job record.

> If multi-tenancy was detected (§11): also prefix cache keys per tenant
> (`tenant:{id}:`) so one tenant can never read another's cached data.
