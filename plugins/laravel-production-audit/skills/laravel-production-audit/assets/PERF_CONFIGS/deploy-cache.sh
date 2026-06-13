#!/usr/bin/env bash
# Deploy-time cache warmup — TEMPLATE
# Project: <PROJECT NAME>   Audit date: <DATE>
# Order matters: clear stale caches, then rebuild, then restart workers so they
# pick up new code. Run as the deploy user from the project root.

set -euo pipefail

# reason: never serve a half-deployed app
php artisan down --render="errors::503" || true

composer install --no-dev --optimize-autoloader --no-interaction

# Clear first so a broken cached file can't survive the deploy
php artisan optimize:clear

# Rebuild caches. `optimize` runs config:cache + route:cache + view:cache +
# event:cache in one shot on Laravel 13, so we DON'T also run them individually
# (that would just cache everything twice).
php artisan optimize
# php artisan icons:cache   # uncomment if Blade Icons present

# Restart queue workers so they run the new code, not the code they booted with.
# Horizon if installed; otherwise fall back to queue:restart. Both are no-ops if
# the target isn't present, so the `|| true` keeps the deploy moving.
php artisan horizon:terminate 2>/dev/null || php artisan queue:restart || true

php artisan up
