-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827160000_analytics
-- Real-time business tracking. The storefront emits lightweight events
-- (page/product views, add-to-cart, checkout start); the console reads live
-- aggregates. All rows carry organization_id and are readable only by that
-- company's members. Anonymous visitors write only through track_event().
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.storefront_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id        uuid not null references public.stores(id) on delete cascade,
  session_id      text,
  event_type      text not null,
  path            text,
  product_id      uuid references public.products(id) on delete set null,
  referrer        text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

do $$ begin
  alter table public.storefront_events
    add constraint storefront_events_type_check
    check (event_type in ('page_view','product_view','add_to_cart','begin_checkout'));
exception when duplicate_object then null; end $$;

create index if not exists idx_sf_events_store_time on public.storefront_events (store_id, created_at desc);
create index if not exists idx_sf_events_org_time   on public.storefront_events (organization_id, created_at desc);
create index if not exists idx_sf_events_store_type on public.storefront_events (store_id, event_type);

alter table public.storefront_events enable row level security;
drop policy if exists "sf_events_org_read" on public.storefront_events;
create policy "sf_events_org_read" on public.storefront_events
  for select using (public.is_org_member(organization_id));

grant select on public.storefront_events to authenticated;

-- ─── RPC: record one storefront event (anon-safe) ──────────────────────
create or replace function public.track_event(
  p_store_slug text,
  p_session_id text,
  p_event_type text,
  p_path text default null,
  p_product_id uuid default null,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store record;
begin
  if p_event_type not in ('page_view','product_view','add_to_cart','begin_checkout') then
    return;
  end if;

  select id, organization_id into v_store
  from public.stores
  where slug = p_store_slug and status in ('live','preview')
  limit 1;
  if not found then return; end if;

  insert into public.storefront_events (
    organization_id, store_id, session_id, event_type, path, product_id, referrer, user_agent
  ) values (
    v_store.organization_id, v_store.id, nullif(p_session_id,''), p_event_type,
    left(coalesce(p_path,''), 300), p_product_id,
    left(coalesce(p_referrer,''), 300), left(coalesce(p_user_agent,''), 300)
  );
end;
$$;

grant execute on function public.track_event(text, text, text, text, uuid, text, text) to anon, authenticated;

-- ─── RPC: real-time analytics for the caller's store ───────────────────
create or replace function public.store_analytics(p_days int default 14)
returns json
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_store    record;
  v_start    timestamptz := now() - make_interval(days => greatest(p_days, 1));
  v_revenue  bigint;
  v_orders   int;
  v_views    int;
  v_pviews   int;
  v_atc      int;
  v_checkout int;
  v_series   json;
  v_top      json;
  v_recent   json;
begin
  select s.id, s.organization_id, s.name, s.slug, s.status, s.subdomain
    into v_store
  from public.stores s
  join public.organization_members m on m.organization_id = s.organization_id
  where m.user_id = auth.uid() and m.status = 'active'
  order by s.created_at desc
  limit 1;
  if not found then raise exception 'NO_STORE'; end if;

  select coalesce(sum(total),0), count(*) into v_revenue, v_orders
  from public.orders where store_id = v_store.id and created_at >= v_start;

  select
    count(*) filter (where event_type = 'page_view'),
    count(*) filter (where event_type = 'product_view'),
    count(*) filter (where event_type = 'add_to_cart'),
    count(*) filter (where event_type = 'begin_checkout')
    into v_views, v_pviews, v_atc, v_checkout
  from public.storefront_events where store_id = v_store.id and created_at >= v_start;

  select json_agg(row_to_json(d) order by d.day) into v_series
  from (
    select
      g::date as day,
      coalesce((select count(*) from public.orders o
        where o.store_id = v_store.id and o.created_at::date = g::date), 0) as orders,
      coalesce((select sum(o.total) from public.orders o
        where o.store_id = v_store.id and o.created_at::date = g::date), 0) as revenue,
      coalesce((select count(*) from public.storefront_events e
        where e.store_id = v_store.id and e.event_type = 'page_view' and e.created_at::date = g::date), 0) as views
    from generate_series(v_start::date, now()::date, interval '1 day') g
  ) d;

  select json_agg(row_to_json(t)) into v_top
  from (
    select p.name, sum(oi.quantity)::int as units, sum(oi.price * oi.quantity)::bigint as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    left join public.products p on p.id = oi.product_id
    where o.store_id = v_store.id and o.created_at >= v_start
    group by p.name
    order by revenue desc nulls last
    limit 5
  ) t;

  select json_agg(row_to_json(r) order by r.created_at desc) into v_recent
  from (
    select order_number, customer_name, total, status, created_at
    from public.orders where store_id = v_store.id
    order by created_at desc limit 8
  ) r;

  return json_build_object(
    'store', json_build_object('id', v_store.id, 'name', v_store.name, 'slug', v_store.slug,
                               'status', v_store.status, 'subdomain', v_store.subdomain),
    'rangeDays', p_days,
    'generatedAt', now(),
    'kpis', json_build_object(
      'revenue', v_revenue,
      'orders', v_orders,
      'aov', case when v_orders > 0 then round(v_revenue::numeric / v_orders) else 0 end,
      'views', v_views,
      'productViews', v_pviews,
      'addToCart', v_atc,
      'beginCheckout', v_checkout,
      'conversion', case when v_views > 0 then round((v_orders::numeric / v_views) * 100, 2) else 0 end
    ),
    'series', coalesce(v_series, '[]'::json),
    'funnel', json_build_array(
      json_build_object('label','Visits','value', v_views),
      json_build_object('label','Product views','value', v_pviews),
      json_build_object('label','Add to cart','value', v_atc),
      json_build_object('label','Checkout','value', v_checkout),
      json_build_object('label','Orders','value', v_orders)
    ),
    'topProducts', coalesce(v_top, '[]'::json),
    'recentOrders', coalesce(v_recent, '[]'::json)
  );
end;
$$;

grant execute on function public.store_analytics(int) to authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-08_analytics'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
