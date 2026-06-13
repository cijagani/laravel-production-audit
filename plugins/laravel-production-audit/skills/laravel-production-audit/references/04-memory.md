# §4 — Memory Management Audit

**Goal:** PHP workers don't grow unboundedly. Peak RSS per worker ≤ 128MB.
Chunked processing, no full-collection loads, generators where possible. Memory
that grows per-row eventually meets a dataset large enough to kill the worker.

## 4.1 Unbounded collection loads

For every `->get()`, `->all()`, `Model::all()`:

- A `->where()` scope limiting rows? 🟠 if missing
- A `->limit()` / `->take()`? 🟡
- Iterated once and discarded? → suggest `->cursor()` 🟡
- Iterated and transformed? → suggest `->lazy()` + `LazyCollection` 🟡
- Result expected to exceed ~1,000 rows? → suggest `->chunk(500, fn)` 🟠
  (escalate to 🔴 only when the load is genuinely unbounded — no upper limit at
  all — since that's the case that actually OOMs a worker)

## 4.2 Eager loading & SELECT bloat

- `->with('relation')` that loads an unbounded hasMany 🟠
- Missing `->select([...])` on queries inside loops or jobs 🟡
- `->withCount()` running subqueries where a cached counter would do 🟡

## 4.3 Large string / file handling

- `file_get_contents` on files >1MB read fully into memory 🟠
- CSV/Excel imports not using chunk streaming 🔴 if found
- Image processing done in-process 🟠 — move to a queued job + temp disk

## 4.4 PHP 8.4 specifics

- `opcache.enable_cli=1` set for queue workers? 🟡
- Typed properties used consistently (reduces zval overhead)? (note)
- `readonly` classes used for DTOs/value objects? 🟢 positive if present
- JIT enabled (`opcache.jit_buffer_size`)? Note: helps CPU-bound code; for an
  I/O-bound app it may not help much — don't over-allocate the JIT buffer.

## 4.5 Queue worker memory

- `--max-jobs=500` or `--max-time=3600` set in Supervisor for workers? 🔴 if
  missing — workers can grow unboundedly without restart.
- Horizon `memory` limit per worker explicitly set in `horizon.php`? 🟠 if missing

## Output for §4

- Memory risk table (location | risk | severity | fix)
- Prescribe a `php.ini` / `opcache` stanza
