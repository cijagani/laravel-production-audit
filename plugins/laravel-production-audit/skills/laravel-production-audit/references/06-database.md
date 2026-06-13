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

## 6.5 Write patterns

- Individual `->save()` inside loops (should be `upsert` / batch `insert`) 🔴
- `DB::table()->insert()` in a loop without chunking 🟠
- Missing `->upsert()` where an update-or-create pattern exists 🟡

## Output for §6

- Query risk table (file | query pattern | severity | fix)
- List of suggested index additions as migration stubs (feed into
  `INDEXES_TO_ADD.md`)
