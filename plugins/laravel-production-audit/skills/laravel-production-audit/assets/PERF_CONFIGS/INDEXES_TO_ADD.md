# Indexes To Add — TEMPLATE
# Project: <PROJECT NAME>   Audit date: <DATE>
# One migration stub per missing index found in §6.4. Each entry names the
# query/finding that justifies it so the operator can confirm before running.

## Example entry (replace with real findings)

**Finding:** `app/Http/Controllers/OrderController.php:88` filters
`orders` by `(tenant_id, status)` with no composite index → full-table scan.

```php
// database/migrations/2026_06_13_000001_add_tenant_status_index_to_orders.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // reason: WHERE tenant_id = ? AND status = ? — composite, tenant_id first (high selectivity)
            $table->index(['tenant_id', 'status'], 'orders_tenant_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_tenant_status_index');
        });
    }
};
```

## Checklist of index types to look for (from §6.4)

- [ ] Foreign-key columns (`*_id`) used in WHERE/JOIN but unindexed
- [ ] `status`, `tenant_id`, `user_id` filtered without an index
- [ ] `created_at` / `updated_at` ordered or ranged on frequently
- [ ] Composite indexes for common `(tenant_id, status)`-style filter pairs
- [ ] Columns hit by `ORDER BY` with no supporting index
