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

**Schedule runner:** system cron is preferred for `schedule:run`. Provide both
options (cron entry + a supervisor `schedule:work` block) and recommend cron.

**Any other long-running processes detected** (Reverb, a `queue:work` fallback,
etc.): prescribe an individual `[program:...]` block each.

## Output for §8

- Complete `laravel-workers.conf` with inline comments
- Crontab entry for the scheduler
