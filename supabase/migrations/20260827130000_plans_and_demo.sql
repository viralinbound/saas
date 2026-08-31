-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827130000_plans_and_demo
-- Freemium model: explore + edit all 6 templates for free in DEMO mode; a live
-- storefront (real hosting, no watermark) unlocks only after choosing a paid
-- plan. Plan changes take effect immediately ("realtime convert") and are
-- audit-logged in plan_events.
--   • organizations.is_demo / plan_selected_at
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.organizations add column if not exists is_demo          boolean not null default true;
alter table public.organizations add column if not exists plan_selected_at timestamptz;

-- ─── plan_events: conversion / upgrade / downgrade audit ────────────────
create table if not exists public.plan_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  from_plan       text,
  to_plan         text not null,
  amount_paise    int,
  currency        text not null default 'INR',
  payment_ref     text,
  status          text not null default 'active',
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_plan_events_org on public.plan_events(organization_id, created_at desc);

alter table public.plan_events enable row level security;
drop policy if exists "plan_events_org_read" on public.plan_events;
create policy "plan_events_org_read" on public.plan_events
  for select using (public.is_org_member(organization_id));

-- ─── allow 'preview' publications (demo stores) ────────────────────────
do $$ begin
  alter table public.store_publications drop constraint if exists store_publications_status_check;
  alter table public.store_publications
    add constraint store_publications_status_check
    check (status in ('queued','building','live','preview','failed','unpublished'));
exception when others then null; end $$;

-- ─── RPC: choose / change plan (realtime) ──────────────────────────────
create or replace function public.set_organization_plan(
  p_plan text,
  p_payment_ref text default null,
  p_amount_paise int default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org public.organizations;
  v_from text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_plan not in ('free','essential','pro','elite','plus') then raise exception 'INVALID_PLAN'; end if;

  select o.* into v_org
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where m.user_id = auth.uid() and m.status = 'active' and m.role in ('owner','admin')
  order by o.created_at asc
  limit 1;
  if not found then raise exception 'NO_ORG_OR_FORBIDDEN'; end if;

  v_from := v_org.plan;

  update public.organizations set
    plan             = p_plan,
    plan_status      = 'active',
    is_demo          = (p_plan = 'free'),
    plan_selected_at = now(),
    updated_at       = now()
  where id = v_org.id;

  -- cascade the plan onto every store in the company
  update public.stores set plan = p_plan, updated_at = now()
  where organization_id = v_org.id;

  insert into public.plan_events (organization_id, from_plan, to_plan, amount_paise, payment_ref, created_by)
  values (v_org.id, v_from, p_plan, p_amount_paise, p_payment_ref, auth.uid());

  return json_build_object(
    'organizationId', v_org.id,
    'fromPlan', v_from,
    'plan', p_plan,
    'isDemo', (p_plan = 'free'),
    'unlockedLivePublishing', (p_plan <> 'free')
  );
end;
$$;

grant execute on function public.set_organization_plan(text, text, int) to authenticated;

-- ─── publish_store: gate live hosting behind a paid plan ───────────────
-- Free plan  → status 'preview'  (demo storefront, watermarked, real URL)
-- Paid plan  → status 'live'     (full storefront, no watermark)
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
  v_url         text;
  v_is_demo     boolean;
  v_status      text;
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

  v_url := 'https://' || v_sub || '.' || v_base;

  insert into public.store_publications (
    store_id, organization_id, version_id, status, host_type, temp_subdomain, url, published_by
  ) values (
    p_store_id, v_store.organization_id, v_version_id, v_status, 'temp', v_sub, v_url, auth.uid()
  )
  returning id into v_pub_id;

  update public.stores set
    subdomain = v_sub,
    status = v_status,
    published_at = now(),
    updated_at = now()
  where id = p_store_id;

  return json_build_object(
    'publicationId', v_pub_id,
    'versionId', v_version_id,
    'subdomain', v_sub,
    'url', v_url,
    'status', v_status,
    'demo', v_is_demo,
    'mode', case when v_is_demo then 'demo_preview' else 'live' end
  );
end;
$$;

grant execute on function public.publish_store(uuid, text, text) to authenticated;

-- ─── get_storefront: also serve demo previews, flag them ───────────────
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
  v_key text := trim(both '-' from lower(regexp_replace(coalesce(p_host,''), '[^a-z0-9]+', '-', 'g')));
begin
  select * into v_store from public.stores
  where status in ('live','preview') and (slug = v_key or subdomain = v_key)
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
      'subdomain', v_store.subdomain, 'industry', v_store.industry,
      'theme', v_store.theme, 'templateKey', v_store.template_key,
      'accentColor', v_store.accent_color, 'plan', v_store.plan,
      'status', v_store.status
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
values ('version', to_jsonb('2026.08.27-05_plans_and_demo'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
