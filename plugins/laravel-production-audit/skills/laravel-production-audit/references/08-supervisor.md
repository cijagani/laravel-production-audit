# §8 — Supervisor Configuration Audit

**Goal:** Horizon and all worker processes are supervised, auto-restarted,
memory-bounded, with correct process counts and priority. An unsupervised worker
that dies at 3am is an outage nobody notices until morning.

## 8.1 Existing config

Read any existing supervisor conf files. If not readable, produce from scratch.

## 8.2 Prescribe config

Produce a complete `/etc/supervisor/conf.d/laravel-workers.conf`.

**Horizon process:**

```ini
[program:laravel-horizon]
process_name=%(program_name)s
command=php /var/www/html/artisan horizon
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/horizon.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
stopwaitsecs=3600
```

`stopwaitsecs` must be **greater than the longest job's runtime** (Laravel
docs) — otherwise Supervisor SIGKILLs the job during a deploy or restart. It's
the outermost link of the timeout chain in §2.2. 3600 is safe for most apps;
compute it from the real longest `$timeout`. `stopasgroup`/`killasgroup` make
the signal reach Horizon's child workers too.

**No Horizon? Prescribe a `queue:work` block instead**, one per priority tier:

```ini
[program:laravel-worker-default]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work redis --queue=high,default --sleep=3 --tries=3 --timeout=60 --max-time=3600 --max-jobs=1000 --memory=128
numprocs=2
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/worker-default.log
stopwaitsecs=3600
```

Plain `queue:work` **does** honour `--queue` order as strict priority (unlike
Horizon `auto`). `--timeout` must stay below the connection's `retry_after`.

**Containers instead of Supervisor?** Same rules, different keys — see §12.5
(`stop_grace_period`, exec-form `CMD`, `init: true`).

**Schedule runner:** system cron is preferred for `schedule:run`. Provide both
options (cron entry + a supervisor `schedule:work` block) and recommend cron.

**Any other long-running processes detected** (Reverb, a `queue:work` fallback,
etc.): prescribe an individual `[program:...]` block each.

## Output for §8

- Complete `laravel-workers.conf` with inline comments
- Crontab entry for the scheduler
