#!/usr/bin/env bash
# Deploy-time cache warmup — TEMPLATE
# Project: <PROJECT NAME>   Audit date: <DATE>
# Order matters: rebuild caches, then restart workers so they pick up new code.
# Run as the deploy user from the project root.

set -euo pipefail

# reason: never serve a half-deployed app
php artisan down --render="errors::503" || true

composer install --no-dev --optimize-autoloader --no-interaction

# Rebuild caches. `optimize` runs config:cache + route:cache + view:cache +
# event:cache in one shot on Laravel 13 and overwrites the old files, so we DON'T
# also run them individually (that would just cache everything twice).
# reason: NO bare `optimize:clear` here — it also runs cache:clear and flushes the
# whole application cache (plus unique-job / rate-limit / onOneServer locks) on
# every deploy. If you need a clear step: `php artisan optimize:clear --except=cache`
php artisan optimize
# php artisan icons:cache   # uncomment if Blade Icons present

# Restart queue workers so they run the new code, not the code they booted with.
# Horizon if installed; otherwise fall back to queue:restart. Both are no-ops if
# the target isn't present, so the `|| true` keeps the deploy moving.
# reason: horizon:terminate only signals Horizon on THIS host. Extra worker nodes
# (other servers / containers) must run it themselves, or be redeployed (§12.3).
php artisan horizon:terminate 2>/dev/null || php artisan queue:restart || true

php artisan up
