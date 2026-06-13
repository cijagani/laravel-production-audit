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

## 11.4 Scheduled tasks in MT context

- Does each scheduled command iterate "all tenants" correctly?
- Is `->chunk()` used when iterating tenants? 🟠 if all tenants loaded at once
- Is a `--tenant=` option available for targeted runs? 🟡

## Output for §11

- MT-specific finding table
- Recommended tenant-resolver caching pattern
