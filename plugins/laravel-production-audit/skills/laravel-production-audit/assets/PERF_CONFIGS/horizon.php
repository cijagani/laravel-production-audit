<?php

/*
|--------------------------------------------------------------------------
| Horizon — production config TEMPLATE
|--------------------------------------------------------------------------
| Project: <PROJECT NAME>   Audit date: <DATE>
|
| Fill the supervisor process counts and queues from the §2 findings. The
| numbers below assume a SMALL box (≈2GB RAM). Each PHP worker is ≈50–80MB RSS,
| so maxProcesses across all supervisors must satisfy:
|     sum(maxProcesses) * 80MB  <  available_RAM - (php-fpm pool + system)
|
| Timeout chain — every supervisor 'timeout' must sit inside it (§2.2):
|     longest job $timeout  <  'timeout'  <  queue.php retry_after (-several s)  <  stopwaitsecs
| Stock retry_after is 90, so with it a supervisor timeout must stay <= ~80.
| Longer jobs → raise REDIS_QUEUE_RETRY_AFTER (or give them their own
| queue connection with a bigger retry_after) — never just raise 'timeout'.
|
| Priority: with balance 'auto' the order of the 'queue' array is IGNORED.
| Priority comes from separate supervisors with their own maxProcesses.
*/

use Illuminate\Support\Str;

return [

    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'horizon'),
    'use' => 'default',                 // reason: Redis connection used by Horizon
    'prefix' => env('HORIZON_PREFIX', 'horizon:'.Str::slug(env('APP_NAME', 'laravel'))),

    'middleware' => ['web'],

    'waits' => [
        'redis:default' => 60,          // reason: alert if a job waits >60s to start
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    'silenced' => [
        // App\Jobs\ExampleJob::class,
    ],

    'metrics' => [
        'trim_snapshots' => ['job' => 24, 'queue' => 24],
    ],

    'fast_termination' => false,
    'memory_limit' => 64,               // reason: MASTER supervisor's MB cap (not workers — those use 'memory' below)

    // reason: lets an extra worker node pick its own `environments` block
    // (HORIZON_ENV=burst) without changing APP_ENV. Unset = APP_ENV. See §12.7.
    'env' => env('HORIZON_ENV'),

    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',        // reason: 'auto' scales workers to load — best for low hardware
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 3,        // reason: 3 * 80MB ≈ 240MB ceiling for this supervisor
            'minProcesses' => 1,
            'maxTime' => 3600,          // reason: recycle workers hourly — contains slow leaks (Horizon docs)
            'maxJobs' => 1000,          // reason: …or after 1000 jobs, whichever comes first
            'memory' => 64,             // reason: restart worker if it exceeds 64MB — prevents leak growth
            'tries' => 3,
            'timeout' => 60,            // reason: > longest job $timeout AND < retry_after (90) — see header
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            // One supervisor per priority tier — under 'auto', array order inside
            // 'queue' does NOT set priority. Pull real queue names from §2.
            'supervisor-high' => [
                'connection' => 'redis',
                'queue' => ['high'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 4,
                'memory' => 64,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,            // reason: highest CPU priority for latency-sensitive work
            ],
            'supervisor-default' => [
                'connection' => 'redis',
                'queue' => ['default', 'low'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 3,
                'memory' => 64,
                'tries' => 3,
                'timeout' => 80,        // reason: max that still fits under retry_after 90; raise both together
                'nice' => 10,           // reason: deprioritize background/batch work behind 'high'
            ],
        ],

        // Only if an extra worker node exists (§12.7). That node sets
        // HORIZON_ENV=burst and keeps APP_ENV=production. It drains bulk queues
        // only, so latency-critical work stays near the database.
        // 'burst' => [
        //     'supervisor-bulk' => [
        //         'connection' => 'redis',
        //         'queue' => ['heavy', 'reports'],
        //         'balance' => 'auto',
        //         'minProcesses' => 1,
        //         'maxProcesses' => 4,   // reason: <RECOMPUTE> from that node's RAM/CPU, not this box's
        //         'memory' => 128,
        //         'tries' => 3,
        //         'timeout' => 80,
        //         'nice' => 10,
        //     ],
        // ],

        'local' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['default'],
                'balance' => 'auto',
                'maxProcesses' => 2,
                'memory' => 64,
            ],
        ],
    ],
];
