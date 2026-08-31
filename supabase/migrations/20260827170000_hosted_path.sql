-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827170000_hosted_path
-- The temporary host now carries BOTH names: company + project.
--   • path host (works today):   <app>/h/<company-slug>/<store-slug>
--   • branded host (wire DNS later): <company-slug>-<store-slug>.supershowroom.app
-- publish_store fills stores.host_path + store_publications.host_path, and
-- get_storefront() resolves a store by slug OR subdomain OR "company/store".
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.stores             add column if not exists host_path text;
alter table public.store_publications add column if not exists host_path text;

create unique index if not exists uq_stores_host_path
  on public.stores (host_path) where host_path is not null;

-- ─── publish_store: compute company + project host ─────────────────────
create or replace function public.publish_store(
  p_store_id uuid,
  p_subdomain text default null,
  p_label text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store       public.stores;
  v_org         public.organizations;
  v_cust        public.store_customizations;
  v_version_id  uuid;
  v_sub         text;
  v_pub_id      uuid;
  v_base        text := 'supershowroom.app';
  v_is_demo     boolean;
  v_status      text;
  v_host_path   text;
  v_branded     text;
  v_url         text;
begin
  select * into v_store from public.stores where id = p_store_id;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_store.organization_id) then raise exception 'FORBIDDEN'; end if;

  select * into v_org from public.organizations where id = v_store.organization_id;
  v_is_demo := (coalesce(v_org.plan, 'free') = 'free');
  v_status  := case when v_is_demo then 'preview' else 'live' end;

  select * into v_cust from public.store_customizations where store_id = p_store_id;
  if not found then
    insert into public.store_customizations (store_id, organization_id, draft_config)
    values (p_store_id, v_store.organization_id, '{}'::jsonb)
    returning * into v_cust;
  end if;

  v_sub := trim(both '-' from lower(regexp_replace(
    coalesce(nullif(p_subdomain, ''), v_store.subdomain, v_store.slug), '[^a-z0-9]+', '-', 'g')));
  if v_sub = '' then raise exception 'INVALID_SUBDOMAIN'; end if;
  if exists (select 1 from public.stores s where s.subdomain = v_sub and s.id <> p_store_id) then
    raise exception 'SUBDOMAIN_TAKEN';
  end if;

  v_host_path := v_org.slug || '/' || v_sub;                 -- company/project
  v_branded   := v_org.slug || '-' || v_sub;                 -- company-project
  v_url       := 'https://' || v_branded || '.' || v_base;

  insert into public.store_customization_versions (
    store_id, organization_id, config, theme_tokens, template_key, label, created_by
  ) values (
    p_store_id, v_store.organization_id, v_cust.draft_config, v_cust.theme_tokens,
    v_cust.template_key, coalesce(p_label, 'Publish ' || to_char(now(), 'YYYY-MM-DD HH24:MI')),
    auth.uid()
  )
  returning id into v_version_id;

  update public.store_customizations set
    published_config    = v_cust.draft_config,
    published_version_id = v_version_id,
    published_at        = now(),
    updated_at          = now()
  where store_id = p_store_id;

  update public.store_publications
    set status = 'unpublished', unpublished_at = now()
    where store_id = p_store_id and status in ('live','preview') and host_type = 'temp';

  insert into public.store_publications (
    store_id, organization_id, version_id, status, host_type, temp_subdomain, host_path, url, published_by
  ) values (
    p_store_id, v_store.organization_id, v_version_id, v_status, 'temp', v_branded, v_host_path, v_url, auth.uid()
  )
  returning id into v_pub_id;

  update public.stores set
    subdomain = v_branded,
    host_path = v_host_path,
    status = v_status,
    published_at = now(),
    updated_at = now()
  where id = p_store_id;

  return json_build_object(
    'publicationId', v_pub_id,
    'versionId', v_version_id,
    'company', v_org.slug,
    'project', v_sub,
    'hostPath', v_host_path,                       -- use: <app>/h/<hostPath>
    'brandedHost', v_branded || '.' || v_base,
    'url', v_url,
    'status', v_status,
    'demo', v_is_demo,
    'mode', case when v_is_demo then 'demo_preview' else 'live' end
  );
end;
$$;

grant execute on function public.publish_store(uuid, text, text) to authenticated;

-- ─── get_storefront: also resolve "company/store" host paths ───────────
create or replace function public.get_storefront(p_host text)
returns json
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_store public.stores;
  v_cust  public.store_customizations;
  v_products json;
  v_raw  text := coalesce(p_host, '');
  v_key  text := trim(both '-' from lower(regexp_replace(v_raw, '[^a-z0-9]+', '-', 'g')));
  v_path text := lower(trim(both '/' from v_raw));           -- keep the slash for host_path match
begin
  select * into v_store from public.stores
  where status in ('live','preview')
    and (slug = v_key or subdomain = v_key or host_path = v_path)
  limit 1;
  if not found then return null; end if;

  select * into v_cust from public.store_customizations where store_id = v_store.id;

  select coalesce(json_agg(p order by p.created_at desc), '[]'::json) into v_products
  from (
    select id, name, description, price, mrp, image, category, stock, sku, variants, created_at
    from public.products
    where store_id = v_store.id and published = true and stock > 0
  ) p;

  return json_build_object(
    'store', json_build_object(
      'id', v_store.id, 'name', v_store.name, 'slug', v_store.slug,
      'subdomain', v_store.subdomain, 'hostPath', v_store.host_path,
      'industry', v_store.industry, 'theme', v_store.theme,
      'templateKey', v_store.template_key, 'accentColor', v_store.accent_color,
      'plan', v_store.plan, 'status', v_store.status
    ),
    'demo', (v_store.status = 'preview'),
    'config', coalesce(v_cust.published_config, '{}'::jsonb),
    'themeTokens', coalesce(v_cust.theme_tokens, '{}'::jsonb),
    'products', v_products
  );
end;
$$;

grant execute on function public.get_storefront(text) to anon, authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-09_hosted_path'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
