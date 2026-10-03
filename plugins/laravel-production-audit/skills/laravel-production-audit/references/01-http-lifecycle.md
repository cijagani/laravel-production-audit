# §1 — HTTP Request Lifecycle Audit

**Goal:** every HTTP request returns in <200ms p99. Nothing blocking in the
request path — offload everything else to queues. The request path is sacred:
work that doesn't *have* to happen before the response should not happen before
the response.

## 1.1 Middleware chain

Read every middleware in the global stack. Flag any that:

- Makes a DB query outside of auth 🔴
- Makes an outbound HTTP call 🔴
- Reads from filesystem without caching 🟠
- Loops over a collection 🟠
- Does not terminate early on a cache hit 🟡

## 1.2 Controller methods

Scan every controller for:

- `Http::get/post` or Guzzle calls **not** wrapped in a dispatched job 🔴
- `dispatch(new Job())->onConnection('sync')` or `dispatchSync()` 🔴
- Any `sleep()` / `usleep()` 🔴
- Eloquent queries inside loops (N+1) without eager loading 🔴
- `->get()` on unbounded collections (no LIMIT / no pagination) 🟠
- `SELECT *` patterns (no explicit `->select([...])`) 🟡
- Log calls at DEBUG/INFO level on every request 🟡

## 1.3 Event listeners

For every listener:

- Implements `ShouldQueue`? If not, is the work trivial (<1ms)? 🔴 if heavy + sync
- Queued listener specifies a `$queue` property? 🟡 if missing (goes to default)
- Handles failures with a `failed()` method? 🟡

## 1.4 Notifications & mailables

- Every Notification not implementing `ShouldQueue` 🔴
- Every Mailable sent via `Mail::send()` instead of `Mail::queue()` 🔴
- Notification channels mixing `mail` + `database` in the same sync send 🟠

## 1.5 Model observers

- Observers with heavy logic in `created/updated/deleted` that are not queued 🟠
- Observers that dispatch further events synchronously 🟡

## 1.6 Outbound API calls (wherever they run — requests, jobs, commands)

For every call site found in §0's HTTP-client searches:

- No explicit `->timeout()` / `->connectTimeout()` 🟠 (🔴 in the request path)
  — Laravel's defaults are 30s / 10s, so one slow upstream pins a php-fpm
  child or a queue worker for half a minute per call. Size the timeout to the
  API's real p99, not the default.
- `->retry()` without a growing or jittered delay, or retrying non-idempotent
  POSTs 🟠 — retries multiply load on an upstream that's already failing
  (retry storm); POST retries can double-charge / double-send
- Write calls without an idempotency key where the API supports one 🟠
- Several independent calls made one after another 🟡 — `Http::pool()` runs
  them concurrently
- Same request repeated per item / per request where a batch endpoint or a
  short cache exists 🟡
- Many workers calling one rate-limited API with no shared limit 🟠 —
  `RateLimited` / `ThrottlesExceptions` job middleware (Redis variants) so the
  limit is global, not per worker
- Pulling all pages of a paginated API into memory before processing 🟠 —
  process page by page

Trace what upstream latency holds open while waiting: a php-fpm child, a
worker slot, a DB transaction (6.6), a lock. That's the real cost of the call.

## Output for §1

List every violation with: file path, method name, line number, severity, and a
one-line fix prescription.
