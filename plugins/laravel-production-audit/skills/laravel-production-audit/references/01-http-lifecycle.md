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

## Output for §1

List every violation with: file path, method name, line number, severity, and a
one-line fix prescription.
