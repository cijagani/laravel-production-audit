# Redis DB Separation Strategy — TEMPLATE
# Project: <PROJECT NAME>   Audit date: <DATE>

Use separate logical Redis databases so a `cache:clear` can't flush the queue,
and so each concern can be monitored independently.

| DB | Purpose | Why separate |
|----|---------|--------------|
| 0  | Queue (Horizon) | A cache flush must never drop pending jobs |
| 1  | Cache | Highest churn; isolate so eviction policy can differ |
| 2  | Session | Long-lived keys; shouldn't compete with cache eviction |

## `config/database.php` Redis stanza

```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'), // reason: C ext, faster + lower memory than predis

    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel')).'-database-'),
        'persistent' => env('REDIS_PERSISTENT', true), // reason: reuse connections per worker
    ],

    'default' => [   // queue
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_QUEUE_DB', 0),
    ],
    'cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],
    'session' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_SESSION_DB', 2),
    ],
],
```

> If multi-tenancy was detected (§11): also prefix cache keys per tenant
> (`tenant:{id}:`) so one tenant can never read another's cached data.
