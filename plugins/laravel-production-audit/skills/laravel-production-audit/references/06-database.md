# §6 — Database Audit

**Goal:** no N+1, no unbounded queries, proper indexes, minimal open
connections, chunked writes, transactions only where atomic. The database is
usually where a "slow Laravel app" is actually slow.

## 6.1 N+1 detection

- Eloquent relation access inside loops without a preceding `->with()` 🔴
- `->load()` inside loops (lazy eager-load in a loop is still N+1) 🔴
- `->count()` on already-loaded collections that re-queries — flag if in a loop 🟠

## 6.2 Query efficiency

- `Model::all()` with no constraints anywhere in non-seeder code 🔴
- `->get()` immediately followed by `->first()` or `[0]` access 🟠
- Raw `DB::select('SELECT *')` patterns 🟡
- `->orderBy()` on columns with no index (cross-check migrations) 🟠
- `->where('column', 'LIKE', '%value%')` — full-table scan 🟠
- Missing `->select([...])` on queries serialized to JSON 🟡
- Aggregating in PHP what the database can do: `->get()->count()`,
  `->get()->sum('x')`, `->get()->groupBy()`, `->get()->filter()` /
  `->where()` on the collection, `->get()->unique()` 🟠 (🔴 on a large or
  unbounded table) — use `->count()`, `->sum()`, `GROUP BY`, `WHERE`, `DISTINCT`
- Hydrating full models for read-only, high-volume work (reports, exports,
  dashboards) 🟡 — `->toBase()`, `->pluck()`, or `DB::table()` skip model
  hydration, casts, and accessors
- `->paginate()` on a large table where the UI doesn't show a page count 🟡 —
  it runs an extra `COUNT(*)` every page; `->simplePaginate()` doesn't.
  Deep `OFFSET` pages on large tables (infinite scroll, API cursors) 🟠 →
  `->cursorPaginate()`

## 6.2b Hidden per-model work

Work that never appears at the call site, so it's missed when reading
controllers — read each hot-path model in full:

- `protected $with = [...]` on a model 🟠 — eager-loads those relations on
  **every** query of that model, including `->count()`-style reads and jobs
  that never touch the relation
- `protected $appends = [...]` whose accessors query the DB or call services 🟠
  — runs per model on every `toArray()` / JSON response (N+1 inside serialization)
- Global scopes doing joins/subqueries 🟡; casts that decrypt or decode large
  JSON on every read 🟡
- Observers / model events doing I/O on hot write paths 🟠 (cross-ref §1.5);
  `$touches` cascading parent `updated_at` writes in loops 🟡
- `Model::preventLazyLoading(! app()->isProduction())` absent in
  `AppServiceProvider` 🟡 — it turns every N+1 into an exception in dev/test,
  so the next one is caught before production. Note if
  `Model::automaticallyEagerLoadRelationships()` is on: it hides N+1 rather
  than fixing it; still check the queries it generates.

## 6.3 Connection management

- `persistent` connections via `PDO::ATTR_PERSISTENT` in the connection's
  `options`? (note — risky with PHP-FPM; document the trade-off)
- Connection pooling: Laravel core has **no** native `pool` config key — pooling
  comes from Octane (Swoole) or an external pooler like PgBouncer. If the app is
  connection-bound, note that as the fix; don't look for a `pool` key that
  doesn't exist. 🟡
- `sticky` enabled for MySQL read/write split? (note if relevant)
- Transactions kept short? Flag any transaction wrapping HTTP calls 🔴
- `DB::transaction()` wrapping external API calls 🔴

## 6.4 Migrations & indexes

For every migration:

- Foreign-key columns indexed? 🟠 if missing
- `created_at` / `updated_at` indexed where filtered frequently? 🟡
- `status`, `tenant_id`, `user_id` indexed where used in WHERE? 🟠
- Missing composite index for common `(tenant_id, status)` filter pairs? 🟠
- **Redundant indexes** 🟡 — an index that's a left-prefix of a composite
  (`(tenant_id)` next to `(tenant_id, status)`) costs a write on every insert
  and buys nothing.

**Every index recommendation must justify itself** (this is what goes into
`INDEXES_TO_ADD.md`):

1. The exact query it serves (`file:line` and the WHERE / ORDER BY it produces)
2. Why the existing indexes don't cover it
3. Column order and why: equality columns first, then range / sort column
4. Expected selectivity (is the filter actually narrow?)
5. Composite vs **partial** — PostgreSQL partial indexes fit soft deletes and
   status queues well (`… WHERE deleted_at IS NULL`, or
   `WHERE status = 'pending'` over a mostly-`done` table). Blueprint has no
   partial-index modifier, so the stub uses
   `DB::statement('CREATE INDEX … WHERE …')`
6. Write and storage cost on a write-heavy or append-heavy table
7. Large existing table on PostgreSQL? Build it with `->online()` (Laravel
   adds `CONCURRENTLY`) and set `public $withinTransaction = false;` on the
   migration — `CONCURRENTLY` can't run inside a transaction. Otherwise the
   migration locks writes for the whole build.

`LIKE '%term%'` on PostgreSQL can't use a btree index at all; the fix is a
`pg_trgm` GIN index or full-text search, not "add an index".

## 6.5 Write patterns

- Individual `->save()` inside loops (should be `upsert` / batch `insert`) 🔴
- `DB::table()->insert()` in a loop without chunking 🟠
- Missing `->upsert()` where an update-or-create pattern exists 🟡

## 6.6 Transactions — short, deterministic, database-only

For every `DB::transaction()` / `beginTransaction()` on a hot path:

- External HTTP / mail / filesystem / Redis-heavy work inside 🔴 (also 6.3) —
  the transaction, its row locks, and (under PgBouncer) a server connection
  are all held for the remote call's full latency
- Slow PHP computation inside that could run before `BEGIN` 🟠
- `->lockForUpdate()` wider than needed (range scans, unindexed WHERE → many
  locked rows) 🟠; rows locked in different orders on different code paths 🟠
  (deadlock risk — lock in a consistent order, e.g. by primary key)
- `DB::transaction($fn, attempts: N)` retrying a closure that has side effects
  (dispatches, emails) 🟠 — the side effect repeats on each deadlock retry;
  dispatch with `afterCommit`
- Nested `DB::transaction()` calls assumed to be independent 🟡 — they're
  savepoints; an outer rollback undoes the inner "committed" work

## 6.7 PgBouncer & connection budget (PostgreSQL)

Ask, or read infra files: is PgBouncer (or another pooler) in front of
PostgreSQL, and in which mode? In **transaction** pooling the server
connection changes between transactions, so anything that relies on session
state misbehaves (PgBouncer docs mark these "Never" in transaction mode):

- Runtime `SET` whose value **differs between clients** 🔴 — it leaks onto
  whichever client gets that server connection next. Worst case:
  **schema-per-tenant tenancy** switching `search_path` (§11) — one tenant's
  queries run in another tenant's schema. Same for per-user `SET TIME ZONE`.
  The pgsql connection's `search_path`, `timezone`, and `isolation_level`
  config keys are also applied with `SET` on connect. If the value is the same
  for every client it's harmless 🟢 — set it once on the role instead
  (`ALTER ROLE … SET search_path …`).
- Session advisory locks `pg_advisory_lock()` 🔴 — use
  `pg_advisory_xact_lock()` (transaction-scoped) or `Cache::lock()`
- Temp tables, `LISTEN/NOTIFY`, `WITH HOLD` cursors 🔴
- Prepared statements 🟠 — PDO pgsql uses server-side prepared statements.
  Either PgBouncer has `max_prepared_statements` > 0 (protocol-level support),
  or the connection sets `PDO::ATTR_EMULATE_PREPARES => true` in `options`.
  Otherwise errors like `prepared statement "pdo_stmt_…" already exists`.
- `PDO::ATTR_PERSISTENT` with PgBouncer 🟡 — two layers of pooling, no gain
- Long transactions 🟠 — each holds a scarce server connection for its full
  duration; check 6.6 again with this in mind

**Connection budget** (everyone, pooler or not) — show it with real numbers:

```text
php-fpm pm.max_children × web hosts
+ Σ Horizon maxProcesses (+1 master, +1 per supervisor) × worker hosts
+ scheduler + long-running commands + Reverb/Octane workers
+ headroom (~10%)
≤ PgBouncer max_client_conn   (client side)
and  default_pool_size × databases/users ≤ PostgreSQL max_connections − superuser reserve
(no pooler: the first sum must fit max_connections directly)  🔴 if exceeded
```

Every queue worker holds a DB connection for its lifetime once it has run a
DB-touching job, even while idle. Raising `maxProcesses` raises DB connections.

## Output for §6

- Query risk table (file | query pattern | severity | fix)
- List of suggested index additions as migration stubs (feed into
  `INDEXES_TO_ADD.md`)
