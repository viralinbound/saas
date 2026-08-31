-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827150000_fix_publication_subdomain_uniqueness
-- store_publications keeps a history row per publish. The temp_subdomain
-- uniqueness must apply only to ACTIVE publications, otherwise re-publishing
-- to the same subdomain collides with the retired (unpublished) history row.
-- ═══════════════════════════════════════════════════════════════════════════

drop index if exists public.uq_store_publications_temp_subdomain;

create unique index if not exists uq_store_publications_temp_subdomain
  on public.store_publications (temp_subdomain)
  where temp_subdomain is not null and status <> 'unpublished';

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-07_pub_subdomain_uniqueness'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
