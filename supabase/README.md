# SuperShowroom — Supabase schema

Multi-tenant ("many companies, isolated") e-commerce showroom builder:
**sign in → create company → invite team → pick template → customise → publish → temp host**.

## Layout

| File | Purpose |
|---|---|
| `migrations/20260827120000_baseline.sql` | Original schema: `profiles, stores, products, orders, order_items` + `handle_new_user`, `is_slug_available`, `place_order`. |
| `migrations/20260827120100_multitenant_orgs.sql` | Company layer: `organizations`, `organization_members`, `organization_invites`; isolation helpers; back-fills every legacy store into its own org; re-keys all RLS to org membership. |
| `migrations/20260827120200_templates_and_publishing.sql` | `templates`, `store_customizations`, `store_customization_versions`, `store_publications`, `media_assets` + `save_store_draft` / `publish_store` / `unpublish_store` / `restore_store_version` / `get_storefront` RPCs. |
| `migrations/20260827120300_seed_templates.sql` | Seeds the 6 built-in starter templates. |
| `schema.sql` | All migrations concatenated — paste-once convenience for a fresh project. Generated; do not hand-edit. |

## Apply

**Option A — SQL editor (no secrets needed):** open Supabase Studio → SQL Editor for project
`bjrgorzmpfltvvqcptbv`, paste the whole of `schema.sql`, run. Safe on an existing DB (every
statement is idempotent).

**Option B — migration runner (repeatable):**

```bash
# .env → SUPABASE_DB_URL="postgresql://postgres.bjrgorzmpfltvvqcptbv:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
npm run supabase:migrate        # applies only pending files, records them in public.schema_migrations
```

Then create the storage bucket used by `media_assets`: Studio → Storage → **New bucket** `store-media` (public).

## Tenant isolation — how a company's data cannot leak

* Every tenant row carries `organization_id`. `stores`, `products`, `orders`, `order_items`,
  `store_customizations`, `store_customization_versions`, `store_publications`, `media_assets`.
* RLS on all of them is `using (public.is_org_member(organization_id))`. A user only ever sees
  rows for companies they hold an **active** `organization_members` row in.
* `is_org_member` / `has_org_role` are `SECURITY DEFINER` and owned by `postgres`, so they read
  `organization_members` with RLS bypassed — this is what prevents policy recursion while keeping
  the check server-side and un-spoofable.
* Destructive actions (`delete store`, manage members/invites, edit company) additionally require
  `has_org_role(org, array['owner','admin'])`.
* Public storefront traffic is **anon** and never selects tenant tables directly. It calls
  `get_storefront(host)`, which returns only `published_config` + published, in-stock products for a
  `status = 'live'` store. Draft content, other companies' data, orders and customer PII are
  unreachable from the storefront.
* `place_order` is `SECURITY DEFINER`; checkout writes orders without the buyer holding any grant,
  and the `organization_id` is stamped from the store by trigger so it lands inside the right tenant.

## Roles (`organization_members.role`)

`owner` — full control incl. delete company · `admin` — manage team, stores, billing ·
`staff` — manage catalog, orders, customise & publish stores · `viewer` — read-only.

## Migration safety rules (so future changes never corrupt data)

1. **Never edit an applied migration.** Add a new timestamped file.
2. Every file must be **idempotent** — `create ... if not exists`, `drop policy if exists` before
   `create policy`, `create or replace function`, `do $$ ... exception when duplicate_object $$`
   around `add constraint`.
3. **Additive only.** New column → nullable → back-fill → `set not null` (guarded by a zero-null
   check). Renames = add new column + back-fill + keep old, never `alter ... rename`.
4. "Enums" are `text` + a **named** `check` constraint, never native `enum` types.
5. All PKs are `uuid default gen_random_uuid()`; all timestamps `timestamptz`; `updated_at` is
   maintained by the shared `public.set_updated_at()` trigger.
6. FKs are explicit about `on delete` (`cascade` for children, `set null` for soft references).
7. `public.schema_meta` row `version` records the latest migration tag; the runner also tracks
   applied filenames in `public.schema_migrations`.
8. No `drop table`, no `truncate`, no `delete` of user data in a migration — ever.
