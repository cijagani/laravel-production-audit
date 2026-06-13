# §7 — PHP-FPM & Server Configuration Audit

**Goal:** PHP-FPM pool sized to CPU cores, not RAM-blindly. OPcache warm and
stable. No child-process thrash. Graceful restarts.

## 7.1 Detect existing config

```
READ: /etc/php/8.4/fpm/pool.d/www.conf        (or detected pool file)
READ: /etc/php/8.4/fpm/php.ini                 (or `php --ini` path)
READ: /etc/php/8.4/cli/php.ini
READ: /etc/supervisord.conf or /etc/supervisor/conf.d/*.conf
```

If files aren't readable, mark **ENVIRONMENT UNREADABLE** and produce recommended
versions from the formulas below.

> **The machine you're auditing on is almost never the production box.** You may
> be running on a developer's Windows/macOS laptop while production is Linux. So
> `/proc/meminfo` and `nproc` reflect the *wrong* hardware — don't size the pool
> from them. When you can't read the real target hardware, pick explicit
> placeholder specs (the formulas below assume **2GB RAM / 2 cores** as a small-box
> baseline), compute from those, and state the assumption loudly in the report's
> executive summary so the operator knows to recompute `pm.max_children`,
> `start_servers`, etc. against their actual server before deploying.

## 7.2 PHP-FPM pool

Evaluate or prescribe:

- `pm = dynamic` (preferred for variable traffic; `ondemand` for very low traffic)
- `pm.max_children = floor(available_RAM_MB / avg_worker_RSS_MB)`
  - Detect RAM from `/proc/meminfo` if accessible, else assume 2GB.
  - `avg_worker_RSS` ≈ 80–120MB for Laravel; use **100MB** as the safe default.
- `pm.start_servers = cpu_cores * 2`
- `pm.min_spare_servers = cpu_cores`
- `pm.max_spare_servers = cpu_cores * 2`
- `pm.max_requests = 500` (recycle workers to prevent memory leaks)
- `pm.process_idle_timeout = 10s` (for `ondemand`)
- `request_terminate_timeout = 60` (kill runaway requests)

## 7.3 OPcache (PHP 8.4)

- `opcache.enable = 1`
- `opcache.enable_cli = 1` (for queue workers)
- `opcache.memory_consumption = 256` (MB — enough for full Laravel + app cached)
- `opcache.interned_strings_buffer = 32`
- `opcache.max_accelerated_files = 20000` (count files: `find . -name "*.php" | wc -l`)
- `opcache.validate_timestamps = 0` (production — **must** be 0)
- `opcache.save_comments = 1` (required for annotations/attributes)
- `opcache.jit = tracing` (only beneficial if CPU-bound)
- `opcache.jit_buffer_size = 64M` (conservative; don't over-allocate)
- `opcache.preload = /path/to/preload.php` (if Octane not used; optional)
- `opcache.preload_user = www-data`

## 7.4 php.ini critical settings

- `memory_limit = 256M` web, `512M` CLI/queue
- `max_execution_time = 30` web (queue workers: `0`)
- `upload_max_filesize` / `post_max_size` — set conservatively
- `expose_php = Off`
- `display_errors = Off` (production)
- `log_errors = On`
- `error_log = /var/log/php/error.log`
- `realpath_cache_size = 4096K`
- `realpath_cache_ttl = 600`

## Output for §7

Annotated `www.conf` (PHP-FPM pool), `php.ini` (web + CLI variants), and
`opcache.ini` — each value with an inline `# reason:` and any formula shown.
