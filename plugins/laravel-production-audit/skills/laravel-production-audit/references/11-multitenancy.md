# §11 — Multi-Tenancy Overhead Audit

**Run this section only if a tenancy package was detected in §0.** If §0 found no
tenancy, skip it entirely.

In multi-tenant apps, performance and *isolation* are the same problem: a missing
tenant prefix is both a slow query and a data leak.

## 11.1 Tenant bootstrap cost

- How many middleware/bootstrappers run per request for tenant identification?
- Is the tenant resolved from subdomain, header, or DB lookup?
- Is the tenant lookup cached in Redis per request/session? 🔴 if a DB hit on
  every request.
- Is tenancy context set before a queue job runs? Check `InitializeTenancyForJob`
  or equivalent.

## 11.2 Per-tenant cache isolation

- Cache keys prefixed with `tenant_id`? 🔴 if not — cross-tenant data-leak risk
- `Cache::tags(['tenant:'.$id])` or a Redis key-prefix strategy used? 🟡

## 11.3 Per-tenant queue isolation

- Jobs tagged/routed per tenant so one tenant can't starve others? 🟠
- A per-tenant rate limit on job dispatch? 🟡
- **Noisy neighbour:** can one large tenant's bulk action (import, campaign,
  export) fill the shared queue so every other tenant's emails/notifications
  wait behind it? Model it from the fan-out size in §2.1. 🟠 if yes. Fix in
  proportion: bulk work on its own queue/supervisor with a capped
  `maxProcesses`, and a per-tenant concurrency limit (`WithoutOverlapping`
  keyed by tenant, or `RateLimited` with a tenant-keyed limiter). Per-tenant
  queues are only justified for a few very large tenants.
- Tenant context in the job payload and restored before `handle()` —
  never read from a singleton left behind by the previous job (§4.6) 🔴

## 11.3b Tenant data access

- Tenant-scoped tables whose hot queries filter `tenant_id` but whose index
  doesn't **lead** with `tenant_id` 🟠 (§6.4)
- Queries without the tenant filter on tenant tables — admin/report/command
  code bypassing the global scope with `withoutGlobalScopes()` 🔴 (leak) or
  scanning all tenants when one was meant 🟠
- Schema-per-tenant on PostgreSQL behind PgBouncer transaction pooling 🔴 —
  `search_path` leaks between clients (§6.7)

## 11.4 Scheduled tasks in MT context

- Does each scheduled command iterate "all tenants" correctly?
- Is `->chunk()` used when iterating tenants? 🟠 if all tenants loaded at once
- Is a `--tenant=` option available for targeted runs? 🟡

## Output for §11

- MT-specific finding table
- Recommended tenant-resolver caching pattern
