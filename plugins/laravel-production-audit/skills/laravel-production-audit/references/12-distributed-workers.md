# §12 — Distributed & Containerized Workers Audit

**Run only if §0 found workers on more than one host, or workers in containers**
(a `Dockerfile` / `docker-compose*.yml` with a `horizon` or `queue:work`
service, an extra "worker / burst / emergency" node, a Kubernetes manifest). A
single box running Horizon under Supervisor skips this section.

**Goal:** any node can pick up any job it's subscribed to and produce the same
result as every other node — no node holds state, no node runs stale code, and
stopping a node never kills a job mid-flight. Adding a worker node turns every
"works on one box" shortcut into an intermittent bug.

## 12.1 Shared state — the node must be disposable

A job can land on any node. Anything it writes locally is invisible to the web
server and to the next job.

- Jobs writing to `storage_path()`, `Storage::disk('local')`, or a `public`
  disk whose driver is `local`, where another process later reads the file
  (download links, report exports, import staging) 🔴 — move to S3/R2/MinIO
  (or a disk every node mounts). `SEARCH: storage_path(|Storage::disk(|->store(|->storeAs(`
- `sys_get_temp_dir()` / `tempnam()` used to hand a file from one job to a
  later job or chain step 🟠 — fine *within* one `handle()`, broken across jobs.
- `CACHE_STORE`, `SESSION_DRIVER` = `file` or `array` on any node 🔴 — see 12.2.
- Logs only on a local `single`/`daily` channel 🟡 — a disposable node's logs
  die with it. Ship to stderr (`LOG_CHANNEL=stderr` in containers) and collect
  centrally.

## 12.2 One central cache store — every coordination feature depends on it

These all coordinate **through the cache store**, so every node (web and
worker) must point at the same one:

| Feature | Breaks how if a node uses a different/local cache |
|---|---|
| `queue:restart`, `queue:pause` / `queue:resume` | signal never reaches that node's workers |
| `ShouldBeUnique`, `#[UniqueFor]`, `#[DebounceFor]` | duplicates run (Laravel docs: "same central cache server") |
| `WithoutOverlapping`, `RateLimited` job middleware | overlap / rate limit is per-node, not global |
| `->onOneServer()`, schedule `withoutOverlapping()` | task runs once *per node* |
| `Cache::lock()` | lock isn't mutual exclusion any more |

- Every node's effective `CACHE_STORE` (and `cache.lock_store`, `uniqueVia()`,
  `debounceVia()`) resolves to the same Redis/DB? 🔴 if not.
- `Queue::withoutInterruptionPolling()` or `Worker::$restartable = false` set?
  🟠 in multi-node — workers then ignore `queue:restart`/`queue:pause`, so a
  deploy can't reach them.

## 12.3 Code-version skew across nodes

A job serialized by release N and unserialized by release N-1 (or the reverse)
fails on a renamed class, changed constructor, or new property.

- Deploy restarts workers on **every** node? 🔴 if not. `horizon:terminate` and
  `horizon:pause` only signal Horizon masters **on the host where you run the
  command** (they match masters by hostname and `posix_kill` local PIDs). Running
  `horizon:terminate` on the web server leaves a remote worker node on old code.
  It does also set the `illuminate:queue:restart` cache key, so plain
  `queue:work` workers on other nodes *do* restart — if 12.2 holds.
- Containers: the worker image is tagged with the same release as the web
  image (git SHA / semver), never `:latest`? 🟠 — `:latest` makes "which code is
  this node running?" unanswerable and rollback impossible.
- Containers: the deploy **recreates** the worker container on the new image
  (`docker compose up -d` → SIGTERM → graceful stop within
  `stop_grace_period`)? 🟠 if it relies on `horizon:terminate` instead — run via
  `docker compose run` it hits a new container with a different hostname and
  terminates nothing; via `exec` the restart policy brings back the *same old
  image*.
- Job class renames/removals shipped while old payloads are still queued? 🟡 —
  keep the old class (or a `Queue::route` alias) for one release.

## 12.4 The timeout chain (one rule, every layer)

Every layer must give way to the one inside it, or jobs run twice or die
mid-flight:

```text
job $timeout / #[Timeout]
  < worker --timeout / Horizon supervisor 'timeout'
  < config/queue.php 'retry_after'          (by several seconds — Laravel docs)
  < Supervisor stopwaitsecs / docker stop_grace_period / k8s terminationGracePeriodSeconds
```

- `retry_after` ≤ worker timeout 🔴 — the job is handed to a second worker
  while the first is still running. With two nodes this is no longer
  theoretical.
- Container `stop_grace_period` left at Docker's **10s default** while jobs run
  longer 🔴 — every deploy / `docker compose down` SIGKILLs in-flight jobs.
- `block_for => 0` on the redis queue connection 🟠 — workers block forever on
  `BRPOP` and can't handle `SIGTERM` until a job arrives (Laravel docs), so
  graceful stop becomes a hard kill at the grace period.
- Long jobs (imports, exports) implement `Illuminate\Contracts\Queue\Interruptible`
  to checkpoint on `SIGTERM`? 🟡 — lets a node be drained without losing hours
  of work.

## 12.5 Container specifics (only if Docker/K8s detected)

- `pcntl` extension in the worker image? 🔴 if missing — Laravel docs: PCNTL
  "must be installed in order to specify job timeouts". Without it `--timeout`
  and `$timeout` are silently not enforced and a hung job pins a worker forever.
  Check the `Dockerfile` for `docker-php-ext-install pcntl` (official `php`
  images don't ship it). Same for `posix` (Horizon's terminate/pause).
- Worker runs as PID 1 with a shell-form `CMD` (`CMD php artisan horizon`)? 🟠
  — `/bin/sh` becomes PID 1 and swallows `SIGTERM`. Use exec form
  (`CMD ["php","artisan","horizon"]`) and/or `init: true`.
- Container runs as root? 🟠 — `user:` a non-root UID; drop capabilities;
  `read_only: true` with a tmpfs for `/tmp` where the app allows it.
- Memory limit vs Horizon: `mem_limit` ≥ (Σ maxProcesses × `memory`) + master
  overhead (~60MB) 🔴 if lower — the kernel OOM-kills a worker mid-job instead
  of Horizon recycling it cleanly. Compute it, show the formula.
- `cpus:` limit set, and Σ maxProcesses not wildly above it? 🟡 — on a shared
  machine (office PC, dev box) the host must keep headroom for itself.
- `restart: unless-stopped` (not `always`)? 🟡 — `always` brings back a worker
  you deliberately stopped (to drain the node) on the next daemon restart/reboot.
- `opcache.enable_cli=1` in the worker image? 🟡 (see §4.4)
- Health check is host-scoped? 🟠 — `horizon:status` reads **every** master in
  Redis, so on node B it reports "running" while only node A's Horizon is up.
  Use `php artisan horizon:supervisor-status <supervisor>` (matches this host's
  hostname; exits 1 if not found). Never an HTTP probe — workers serve no HTTP.

## 12.6 Network distance & connection budgets

A worker outside the DB's datacentre pays the network round-trip **per query**.

- Remote node subscribed to DB-chatty queues (N+1 inside jobs, per-row
  `save()`)? 🟠 — 1,000 queries × 30ms RTT = 30s of pure latency per job.
  Route DB-heavy work to near-DB workers; give remote nodes CPU-bound or
  external-API work. Cross-reference §6 N+1 findings for jobs on those queues.
- DB connection budget across **all** nodes 🔴 if exceeded:
  `Σ(worker processes on every node) + Σ(php-fpm max_children) + scheduler + headroom ≤ max_connections`
  (or ≤ the PgBouncer/ProxySQL pool). Show the formula with real numbers.
- Redis `maxclients` covers every worker connection (each worker holds its own;
  Horizon adds more) 🟡.
- Redis connection resilience for links that can drop: `read_timeout`,
  `max_retries`, `backoff_algorithm` set on the phpredis connection (Laravel 13
  stock config ships `max_retries`/backoff keys — a hand-written stanza that
  drops them loses reconnect behaviour) 🟡.
- Redis/DB reached over the public internet without TLS or a private tunnel
  (WireGuard/VPC peering) 🔴 — and Redis without `requirepass`/ACL 🔴. Never
  expose 6379/5432 publicly. This skill isn't a security review, but flag these
  anyway: an exposed Redis is an outage *and* a data leak.
- `after_commit => true` on the queue connection (or `->afterCommit()` on
  dispatches inside transactions)? 🟠 — more and faster workers make the
  "job ran before the transaction committed → ModelNotFound" race common.

## 12.7 Per-node queue assignment (Horizon)

- Node-specific supervisors selected **without** changing `APP_ENV`? Horizon
  picks its environment from `php artisan horizon --environment=<name>`, then
  `config('horizon.env')`, then `APP_ENV`. Prescribe
  `'env' => env('HORIZON_ENV'),` in `horizon.php` plus an `environments.<name>`
  block, so a burst node can run only e.g. `['heavy','reports']` while its
  `APP_ENV` stays `production` 🟡. Changing `APP_ENV` to pick supervisors
  silently changes app behaviour (error pages, `isProduction()` checks) 🟠.
- Burst node subscribed to latency-critical queues it can't serve quickly
  (mail, OTP, webhooks) while a primary node idles? 🟡 — give burst nodes
  bulk/heavy queues.
- `queue:pause <conn:queue>` used to drain one node? 🟠 — it's a **global**
  cache flag; it pauses that queue on every node. Drain a single node with
  `horizon:pause` / `horizon:terminate` run *on that node* (containers:
  `docker compose stop`, see 12.5).
- Failover queue driver in use with `database` in the list but no
  `queue:work database` process running alongside Horizon? 🔴 — Horizon only
  drains Redis (Laravel docs), so failed-over jobs sit forever.

## 12.8 Burst / on-demand scaling (if the app scales nodes up and down)

- Scale-up signal is **wait time**, not queue length or CPU: Horizon `waits`
  thresholds (`LongWaitDetected`) or `queue:monitor <conn:queue> --max=N`
  (`QueueBusy` event) scheduled every minute. 🟡 if scaling keys off CPU alone.
- Hysteresis: separate up/down thresholds plus a minimum run time, so a node
  doesn't flap on/off around one number 🟡.
- Scale-down is graceful: `horizon:terminate` on that node (containers:
  `docker compose stop` with a long `stop_grace_period`) and wait for exit,
  never `docker kill` / power-off 🔴 if the runbook kills it.

## Output for §12

- Topology line in the report header: nodes, what each runs, which queues.
- Finding table (node/file | issue | severity | fix).
- The timeout chain with the project's real numbers filled in, and the
  connection-budget formula with real numbers.
- If Docker detected: a corrected `docker-compose.worker.yml` (start from
  `assets/PERF_CONFIGS/docker-compose.worker.yml`).
- If node-specific supervisors are needed: the extra `environments` block in
  the prescribed `horizon.php`.
