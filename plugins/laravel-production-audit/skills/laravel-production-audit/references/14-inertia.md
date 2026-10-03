# §14 — Inertia (v3) — Middleware, Props, Request Count, Vue/React Client

**Run only if `inertiajs/inertia-laravel` is in `composer.json`.** Baseline:
**Inertia v3** (server `inertiajs/inertia-laravel` 3.x, client `@inertiajs/vue3`
/ `@inertiajs/react` 3.x, `@inertiajs/vite`). Read both `composer.lock` and
`package-lock.json` / `pnpm-lock.yaml` — server and client majors must match.

- On **v2**: 🟡 finding — v2 bug fixes ended 26 Sept 2026 (Inertia upgrade
  guide). Don't prescribe v3-only APIs (`useHttp`, instant visits, optimistic
  updates, `@inertiajs/vite`, layout props) without saying "after upgrading".
  `Inertia::lazy()` in code means v1/v2; it was removed in v3 (use `optional()`).
- v3 needs PHP 8.2+ / Laravel 11+, React 19+, Svelte 5+, Node 22+ for SSR.

**The one idea behind this section:** every Inertia interaction is a full
Laravel request — the whole middleware stack, `HandleInertiaRequests::share()`,
and the controller. A partial reload, a deferred-prop fetch, a poll tick, a
prefetch on hover, an infinite-scroll page: each one is a request. The cheap
app does less per request **and** makes fewer requests.

## 14.1 `HandleInertiaRequests` middleware

Read `app/Http/Middleware/HandleInertiaRequests.php` in full.

**`share()` — runs on every Inertia request, including partial reloads,
deferred-prop fetches, polls, and prefetches.**

- Values computed **eagerly** (a query, a service call, `->get()`, a count) 🟠
  (🔴 if heavy or N+1) — wrap each in a closure (`'stats' => fn () => …`).
  Closures are skipped on partial reloads that don't ask for them; eager
  values are computed every time.
- Data that rarely changes and goes to every page — plan lists, countries,
  feature flags, permission/role lists, **translation files**, settings 🟠 —
  `Inertia::once(fn () => …)` in `shareOnce()` (or `Inertia::shareOnce()`): the
  client remembers it and later responses skip resolving it. Add
  `->until(now()->addHour())` for data that can go stale.
- `'auth.user' => $request->user()` (the whole model) 🟠 — serializes every
  visible attribute, every `$appends` accessor, and any loaded relation into
  every page. Share an explicit array or an API Resource with the 5–10 fields
  the layout uses.
- Permission/role checks computed per request (e.g. `getAllPermissions()`,
  per-ability `Gate` checks for the nav) without caching 🟠 — cache per user,
  or `once`.
- Whole session flash bag or config arrays shared 🟡 — v3 has
  `Inertia::flash()` / flash data that isn't kept in history.
- `...parent::share($request)` missing 🟡 — drops the validation `errors` prop.

**`version()` — runs on every Inertia request.**

- Default reads and hashes `public/build/manifest.json` (`hash_file('xxh128', …)`)
  each request — fine, 🟢. Overridden with a DB/HTTP/cache call 🟠. Returns
  something that changes per request or per server (a timestamp, a hostname,
  a hash of a file that differs between hosts) 🔴 — every visit becomes a
  `409` + full page reload, doubling requests and losing SPA navigation.
  Behind several web hosts, every host must return the same version.
- Returns `null` 🟡 — no asset refresh after deploys; users run stale JS.

**Scope & config**

- Inertia middleware attached to API / webhook / Horizon routes 🟡 — runs
  `share()` where no page is rendered. Keep it on the `web` group.
- `INERTIA_DEVTOOLS_ENABLED=true` in production 🔴 — DevTools records one entry
  per request to disk (`storage/inertia-devtools`). Unset, it's local-only.
- `inertia.history.encrypt` on globally 🟢 — the cost is client-side crypto per
  visit; it's a security choice, not a perf finding. Note it only.

## 14.2 Props in controllers

For each `Inertia::render()` on a hot path:

- Props computed eagerly that a **partial reload doesn't ask for** 🟠 — a
  `router.reload({ only: ['filters'] })` still runs every non-closure prop
  (`'users' => User::paginate()` runs even when only `filters` was asked for).
  Wrap expensive props in `fn () =>`.
- Heavy or below-the-fold data blocking first render 🟠 → `Inertia::defer(fn …)`.
  Deferred props in the same group arrive in **one** extra request; each
  extra group is another parallel request (another full middleware +
  `share()` run). Group by what renders together; don't give every prop its
  own group 🟡.
- Data only needed after a user action (a modal, a tab) 🟡 →
  `Inertia::optional(fn …)` + `router.reload({ only: [...] })`.
- Expensive data reused across pages in one section → `Inertia::once()` 🟡
  (combine with `defer(...)->once()` when it's also slow).
- Infinite lists re-sending all earlier pages 🟠 → `Inertia::scroll()` /
  `merge()` with the `<InfiniteScroll>` component, or `cursorPaginate()` (§6).
- **Payload size** 🟠 when a page's JSON exceeds roughly 100 KB: full Eloquent
  models / collections as props, `$appends` accessors, loaded relations,
  `->paginate()` objects carrying unused columns. Props are sent in the first
  HTML response and stored in browser history state on every visit. Fix with
  `->select()`, an API Resource, `->through(fn …)` on paginators, or
  `->only([...])`. Measure: response size of an Inertia visit (`X-Inertia`
  request) in the browser network tab.
- Typed prop objects (`ProvidesInertiaProperties`) or nested
  `Inertia::defer()` / `optional()` inside `auth` etc. are fine — v3 resolves
  them at any depth with dot-notation partial reloads.

## 14.3 Request count — the multiplier

List every source of extra requests found in `resources/js/` and estimate
requests/min at expected concurrency. Each is a full Laravel request:

| Source | Check | Severity if wrong |
|---|---|---|
| `usePoll` | Has `only: [...]`? Interval justified? Default `mode` is `overlap` — a slow response stacks requests; use `mode: 'rest'` (wait for the previous one). Background tabs are throttled 90% unless `keepAlive: true` — flag `keepAlive` on non-critical polls. | 🟠 |
| `<Link prefetch>` | On every row of a table / every nav item = one request per hover (75ms hover delay). Keep it to likely-next links; set `cacheFor` (default 30s) or stale-while-revalidate `[fresh, stale]`; use `cacheTags` + `invalidateCacheTags` instead of short TTLs. `prefetch="mount"` on many links = requests the user never asked for. | 🟡–🟠 |
| `Inertia::defer` groups | One request per group after first paint. | 🟡 |
| `<WhenVisible>` | `always` re-fetches on every scroll into view. | 🟡 |
| `<InfiniteScroll>` | Large `buffer` loads pages users never see; `only` set? | 🟡 |
| `router.reload()` / `router.visit()` in watchers/effects | Fires on every reactive change — debounce, or it loops. | 🟠 |
| `useHttp` / `fetch` / axios calls | Calls a JSON endpoint per keystroke or per mount of a component that repeats per row. | 🟠 |
| Precognition (`form.validate()`) | Live validation request per field change — debounced? | 🟡 |
| Layout doing its own fetch in `onMounted` / `useEffect` | Re-runs on **every page visit** unless the layout is a **persistent layout** (or the v3 default `layout` in `createInertiaApp`). | 🟠 |

Formula for the report: `concurrent users × requests per user per minute` per
source, and what each request costs server-side (§14.1 + controller).

## 14.4 SSR

- SSR enabled for pages that don't need SEO or first-paint speed (logged-in
  dashboards, admin) 🟡 — every request then also renders in Node. v3 turns
  it off per route with `protected $withoutSsr = ['admin/*', 'dashboard'];` on
  `HandleInertiaRequests` (or `Inertia::withoutSsr()` / `Inertia::disableSsr()`).
- SSR server in production: `php artisan inertia:start-ssr` supervised
  (Supervisor block, §8) and `cluster: true` only if the box has spare cores and
  RAM — each Node worker is a separate process 🟡. No supervision 🟠 (SSR dies →
  silent fallback to client rendering, or errors with `throw_on_error`).
- `INERTIA_SSR_TIMEOUT` unset while SSR is slow 🟡 — a stuck render holds the
  php-fpm child.

## 14.5 Client bundle & routes (Vue and React)

- Pages bundled eagerly (`lazy: false` in the `@inertiajs/vite` pages option,
  or `import.meta.glob(..., { eager: true })`) in a large app 🟡 — every page's
  code downloads on first visit. Lazy (the default) splits per page.
- Heavy libraries (charts, rich-text editors, PDF, maps, date libs) imported in
  `app.js` / the root layout 🟠 — in every page's critical path. Import them in
  the page that uses them, or load async (`defineAsyncComponent` / `React.lazy`).
  Check `vite build` output chunk sizes.
- Ziggy `@routes` in the root Blade view 🟡 — inlines **every** named route
  (names + URIs) into every full page load and exposes admin route names. Filter
  with `config/ziggy.php` `only`/`except`/`groups`, or replace with Laravel
  Wayfinder (generated, tree-shakable TypeScript route functions — the Laravel
  starter kits' default).
- Axios still installed only for Inertia 🟢 — v3 has a built-in XHR client;
  removing axios trims the bundle (keep it if the app uses it directly).

### Vue 3

- Large read-only props (long lists, big objects) made deeply reactive by
  copying into `ref()` / `reactive()` 🟡 — use `shallowRef()` / `markRaw()` for
  large immutable data (Vue performance guide: "reduce reactivity overhead
  for large immutable structures").
- `watch(() => props.x, …, { deep: true })` on big page props 🟡.
- Long lists rendered in full (1,000+ rows) 🟠 — paginate server-side (§6), or
  virtualize (e.g. TanStack Virtual / vue-virtual-scroller).
- Static subtrees re-rendered on every update 🟢 — `v-once` / `v-memo`.

### React 19

- Unstable props (inline objects/arrays/functions) passed to memoized children
  in big lists 🟡 — or enable the **React Compiler**, which memoizes
  automatically; then remove hand-written `useMemo`/`useCallback` noise.
- Large lists rendered in full 🟠 — paginate / virtualize (TanStack Virtual).
- Expensive filtering on each keystroke 🟡 — `useDeferredValue` /
  `startTransition`, or filter server-side with a debounced partial reload.
- `useEffect` that calls `router.reload` / fetch with missing or unstable
  dependencies 🟠 — request loops (count them in the network tab).

## 14.6 Things to leave alone

- Default lazy page splitting, default `version()`, prefetch on a handful of
  primary nav links, a single `defer` group for a slow widget — these are the
  intended, cheap usage. Put them under "Leave As Is" so nobody "fixes" them.

## Output for §14

- Middleware table (shared key | eager/closure/once | per-request cost | fix)
- Page table for hot pages (page | props | payload KB | deferred groups |
  extra request sources | fix)
- Request multiplier: requests/min per source at stated concurrency, before
  and after
- Prescribed `HandleInertiaRequests` `share()` / `shareOnce()` / `version()` as
  a code block (written into the report, not into the project)

## Reference docs (verify against these when unsure)

- Inertia v3 docs index: <https://inertiajs.com/docs/llms.txt> — shared data,
  once props, partial reloads, deferred props, prefetching, polling, load when
  visible, infinite scroll, layouts, code splitting, asset versioning, SSR,
  upgrade guide
- Vue performance guide: <https://vuejs.org/guide/best-practices/performance>
- React Compiler: <https://react.dev/learn/react-compiler>
