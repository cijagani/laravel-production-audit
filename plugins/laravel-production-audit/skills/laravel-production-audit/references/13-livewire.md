# §13 — Livewire Request Cost

**Run only if `livewire/livewire` is in `composer.json`.** Baseline: Livewire 4
(v3 is the previous major — note it, and don't recommend v4-only APIs on v3).
Inertia apps use §14 instead.

Livewire looks like frontend code, but every interaction is a full Laravel request:
middleware, auth, and whatever the component or shared props query. A
component that's cheap once is expensive when 500 users have it open.

## 13.1 Components

Read every component under `app/Livewire/` (or `app/Http/Livewire/`) plus its
Blade view. Note the Livewire major version from `composer.lock`.

- Queries in `render()` or in `mount()`-loaded **public properties** that run on
  every update request 🟠 — move to `#[Computed]` (memoized per request; only
  runs if the view uses it). For data that rarely changes:
  `#[Computed(persist: true)]` (per component instance) or `cache: true`
  (shared across instances) with a deliberate TTL.
- Large public properties (collections, full models, big arrays) 🟠 — they're
  dehydrated into the HTML snapshot and sent back on **every** round trip.
  Keep IDs / scalars public; derive the rest with `#[Computed]`.
- Public properties holding IDs or prices the user must not change, without
  `#[Locked]` 🟠 (correctness + tampering; flag, cross-ref security review)
- `wire:poll` 🟠 if short-interval polling on a component that queries on every
  render, multiplied by concurrent users. Count it: users × (60 / interval) ×
  queries per render = queries/min. Prefer a longer interval,
  `wire:poll.visible`, or broadcasting via Reverb when it already exists.
- `wire:model.live` on text inputs that trigger queries 🟡 — every keystroke
  is a request; add `.debounce` or use plain `wire:model` (deferred).
- Heavy below-the-fold components rendered on initial page load 🟡 —
  `#[Lazy]` (load when visible) or `#[Defer]` (load right after page load).
  Five or more on one page → bundle them (`#[Lazy(bundle: true)]`) instead of
  one request each.
- Deep nesting where each child re-queries what the parent already has 🟡 —
  pass data down as props (or IDs + `#[Computed]` on the child).
- Authorization or DB lookups repeated in every action method that could
  happen once 🟡.

## Output for §13

- Component table (component | per-request queries | payload size
  estimate | issue | severity | fix)
- For each 🔴/🟠: requests per minute at the stated concurrency, before and
  after the fix
