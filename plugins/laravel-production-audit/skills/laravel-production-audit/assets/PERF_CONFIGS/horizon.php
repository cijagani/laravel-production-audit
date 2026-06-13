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
    'memory_limit' => 64,               // reason: per-worker MB cap; lower than the 128 default for a small box

    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',        // reason: 'auto' scales workers to load — best for low hardware
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 3,        // reason: 3 * 80MB ≈ 240MB ceiling for this supervisor
            'minProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 64,             // reason: restart worker if it exceeds 64MB — prevents leak growth
            'tries' => 3,
            'timeout' => 60,            // reason: must be >= the longest job $timeout (see §2 findings)
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            // Order queues high-priority first. Pull real queue names from §2.
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
                'timeout' => 120,
                'nice' => 10,           // reason: deprioritize background/batch work behind 'high'
            ],
        ],

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
