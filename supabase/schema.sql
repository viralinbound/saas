-- SuperShowroom — FULL consolidated schema (all migrations concatenated)
-- Generated 2026-08-29T07:15:43Z — DO NOT hand-edit. Source: supabase/migrations/*.sql


-- ==================== migrations/20260827120000_baseline.sql ====================

-- SuperShowroom — full Supabase schema (idempotent, safe to re-run)
-- Apply with: npm run supabase:setup

create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  onboarding_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  industry text not null default 'fashion',
  theme text not null default 'fashion',
  plan text not null default 'free',
  status text not null default 'draft',
  accent_color text not null default '#24457A',
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  price int not null,
  mrp int,
  image text,
  category text not null default 'all',
  stock int not null default 100,
  sku text,
  variants text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address text not null,
  city text,
  pincode text,
  payment_method text not null default 'cod',
  status text not null default 'placed',
  subtotal int not null,
  platform_fee int not null default 0,
  total int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price int not null,
  quantity int not null default 1,
  variant text
);

-- ─── Indexes ─────────────────────────────────────────────────────────────

create index if not exists idx_stores_owner_id on public.stores(owner_id);
create index if not exists idx_stores_slug on public.stores(slug);
create index if not exists idx_stores_status on public.stores(status);
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_products_published on public.products(published);
create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- ─── Profile trigger on auth signup ───────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      new.phone,
      'Merchant'
    ),
    coalesce(new.phone, new.raw_user_meta_data->>'phone')
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    phone = coalesce(excluded.phone, profiles.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RPC: slug availability ────────────────────────────────────────────────

create or replace function public.is_slug_available(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (select 1 from public.stores where slug = p_slug);
$$;

-- ─── RPC: public checkout ────────────────────────────────────────────────

create or replace function public.place_order(
  p_store_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_address text,
  p_city text,
  p_pincode text,
  p_payment_method text,
  p_items jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store record;
  v_subtotal int := 0;
  v_platform_fee int := 0;
  v_order_id uuid;
  v_order_number text;
  v_count int;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_price int;
begin
  select * into v_store from public.stores where slug = p_store_slug and status = 'live';
  if not found then raise exception 'STORE_NOT_AVAILABLE'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    v_price := (v_item->>'price')::int;
    select * into v_product from public.products
      where id = (v_item->>'productId')::uuid
        and store_id = v_store.id
        and published = true;
    if not found then raise exception 'INVALID_PRODUCT'; end if;
    if v_product.stock < v_qty then raise exception 'INSUFFICIENT_STOCK'; end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  if v_store.plan = 'free' then
    v_platform_fee := ceil(v_subtotal * 0.02);
  elsif v_store.plan = 'essential' then
    v_platform_fee := ceil(v_subtotal * 0.015);
  else
    v_platform_fee := 0;
  end if;

  select count(*) into v_count from public.orders where store_id = v_store.id;
  v_order_number := 'ORD-' || (88200 + v_count + 1)::text;

  insert into public.orders (
    store_id, order_number, customer_name, customer_phone, customer_email,
    address, city, pincode, payment_method, status, subtotal, platform_fee, total
  ) values (
    v_store.id, v_order_number, p_customer_name, p_customer_phone, p_customer_email,
    p_address, p_city, p_pincode, p_payment_method, 'placed', v_subtotal, v_platform_fee, v_subtotal
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    insert into public.order_items (order_id, product_id, name, price, quantity, variant)
    values (
      v_order_id,
      (v_item->>'productId')::uuid,
      v_item->>'name',
      (v_item->>'price')::int,
      v_qty,
      nullif(v_item->>'variant', '')
    );
    update public.products set stock = stock - v_qty
      where id = (v_item->>'productId')::uuid;
  end loop;

  return json_build_object(
    'id', v_order_id,
    'orderNumber', v_order_number,
    'total', v_subtotal,
    'platformFee', v_platform_fee
  );
end;
$$;

grant execute on function public.is_slug_available(text) to anon, authenticated;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- ─── Row Level Security ──────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- stores
drop policy if exists "stores_owner_all" on public.stores;
drop policy if exists "stores_public_live" on public.stores;
create policy "stores_owner_all" on public.stores for all using (auth.uid() = owner_id);
create policy "stores_public_live" on public.stores for select using (status = 'live');

-- products
drop policy if exists "products_owner_all" on public.products;
drop policy if exists "products_public_published" on public.products;
create policy "products_owner_all" on public.products for all using (
  store_id in (select id from public.stores where owner_id = auth.uid())
);
create policy "products_public_published" on public.products for select using (
  published = true and store_id in (select id from public.stores where status = 'live')
);

-- orders (owners manage; checkout uses place_order RPC)
drop policy if exists "orders_owner_all" on public.orders;
create policy "orders_owner_all" on public.orders for all using (
  store_id in (select id from public.stores where owner_id = auth.uid())
);

-- order_items
drop policy if exists "order_items_owner_all" on public.order_items;
create policy "order_items_owner_all" on public.order_items for all using (
  order_id in (
    select o.id from public.orders o
    join public.stores s on s.id = o.store_id
    where s.owner_id = auth.uid()
  )
);

-- ─── Grants ──────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- ==================== migrations/20260827120100_multitenant_orgs.sql ====================

-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827120100_multitenant_orgs
-- Adds the company (organization) tenant layer + team members + invites.
--
-- Design rules (so future migrations never corrupt data):
--   • Idempotent: safe to run any number of times.
--   • Additive only: new tables / nullable columns / backfill / then constrain.
--   • "Enums" are text + NAMED check constraints (cleanly droppable), never
--     native enum types (which are painful to alter later).
--   • Every tenant row carries organization_id so RLS never needs a deep join.
--   • Cross-tenant isolation is enforced by SECURITY DEFINER helpers that read
--     organization_members with RLS bypassed (owner = postgres) → no recursion.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Shared updated_at trigger ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── schema_meta: lets the app assert which schema version it is talking to ─
create table if not exists public.schema_meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─── organizations (the tenant / "company") ───────────────────────────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  legal_name    text,
  gstin         text,
  email         text,
  phone         text,
  website       text,
  logo_url      text,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  pincode       text,
  country       text not null default 'IN',
  plan          text not null default 'free',
  plan_status   text not null default 'active',
  billing_email text,
  trial_ends_at timestamptz,
  onboarding    jsonb not null default '{}'::jsonb,
  settings      jsonb not null default '{}'::jsonb,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

do $$ begin
  alter table public.organizations
    add constraint organizations_plan_check
    check (plan in ('free','essential','pro','elite','plus'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.organizations
    add constraint organizations_plan_status_check
    check (plan_status in ('active','past_due','canceled','trialing'));
exception when duplicate_object then null; end $$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

-- ─── organization_members ("different login users per company") ────────────
create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'staff',
  status          text not null default 'active',
  title           text,
  invited_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

do $$ begin
  alter table public.organization_members
    add constraint organization_members_role_check
    check (role in ('owner','admin','staff','viewer'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.organization_members
    add constraint organization_members_status_check
    check (status in ('active','suspended'));
exception when duplicate_object then null; end $$;

drop trigger if exists trg_org_members_updated_at on public.organization_members;
create trigger trg_org_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ─── organization_invites (email invites for teammates) ───────────────────
create table if not exists public.organization_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  role            text not null default 'staff',
  token           text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by      uuid references auth.users(id) on delete set null,
  accepted_at     timestamptz,
  accepted_by     uuid references auth.users(id) on delete set null,
  expires_at      timestamptz not null default (now() + interval '14 days'),
  created_at      timestamptz not null default now(),
  unique (organization_id, email)
);

do $$ begin
  alter table public.organization_invites
    add constraint organization_invites_role_check
    check (role in ('owner','admin','staff','viewer'));
exception when duplicate_object then null; end $$;

-- ─── Tenant-isolation helpers (SECURITY DEFINER → no RLS recursion) ───────
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function public.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select organization_id from public.organization_members
  where user_id = auth.uid() and status = 'active';
$$;

-- ─── Link stores → organizations (nullable → backfill → NOT NULL) ─────────
alter table public.stores add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

-- Backfill: one organization per legacy store owner, owner becomes 'owner' member.
do $$
declare
  r record;
  v_org_id uuid;
  v_slug text;
  v_email text;
  n int;
begin
  for r in
    select distinct owner_id from public.stores where organization_id is null
  loop
    select email into v_email from auth.users where id = r.owner_id;
    v_slug := coalesce(
      nullif(regexp_replace(lower(split_part(coalesce(v_email,''), '@', 1)), '[^a-z0-9]+', '-', 'g'), ''),
      'company'
    );
    -- guarantee slug uniqueness
    if exists (select 1 from public.organizations where slug = v_slug) then
      v_slug := v_slug || '-' || substr(replace(r.owner_id::text, '-', ''), 1, 6);
    end if;

    insert into public.organizations (name, slug, email, created_by)
    values (
      coalesce((select name from public.stores where owner_id = r.owner_id order by created_at limit 1), 'My Company'),
      v_slug, v_email, r.owner_id
    )
    returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role, invited_by)
    values (v_org_id, r.owner_id, 'owner', r.owner_id)
    on conflict (organization_id, user_id) do nothing;

    update public.stores set organization_id = v_org_id
    where owner_id = r.owner_id and organization_id is null;
  end loop;

  select count(*) into n from public.stores where organization_id is null;
  if n = 0 then
    begin
      alter table public.stores alter column organization_id set not null;
    exception when others then null; end;
  end if;
end $$;

-- ─── Denormalise organization_id onto child tables (RLS without deep joins) ─
alter table public.products    add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.orders      add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.order_items add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

update public.products p
  set organization_id = s.organization_id
  from public.stores s
  where p.store_id = s.id and p.organization_id is null;

update public.orders o
  set organization_id = s.organization_id
  from public.stores s
  where o.store_id = s.id and o.organization_id is null;

update public.order_items oi
  set organization_id = o.organization_id
  from public.orders o
  where oi.order_id = o.id and oi.organization_id is null;

-- Keep the denormalised column correct automatically on insert.
create or replace function public.sync_org_from_store()
returns trigger language plpgsql
security definer set search_path = public, pg_temp as $$
begin
  if new.organization_id is null and new.store_id is not null then
    select organization_id into new.organization_id from public.stores where id = new.store_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_sync_org on public.products;
create trigger trg_products_sync_org before insert on public.products
  for each row execute function public.sync_org_from_store();

drop trigger if exists trg_orders_sync_org on public.orders;
create trigger trg_orders_sync_org before insert on public.orders
  for each row execute function public.sync_org_from_store();

create or replace function public.sync_org_from_order()
returns trigger language plpgsql
security definer set search_path = public, pg_temp as $$
begin
  if new.organization_id is null and new.order_id is not null then
    select organization_id into new.organization_id from public.orders where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_items_sync_org on public.order_items;
create trigger trg_order_items_sync_org before insert on public.order_items
  for each row execute function public.sync_org_from_order();

-- ─── Indexes ─────────────────────────────────────────────────────────────
create index if not exists idx_org_members_user       on public.organization_members(user_id);
create index if not exists idx_org_members_org         on public.organization_members(organization_id);
create index if not exists idx_org_invites_org         on public.organization_invites(organization_id);
create index if not exists idx_org_invites_email       on public.organization_invites(email);
create index if not exists idx_stores_org              on public.stores(organization_id);
create index if not exists idx_products_org            on public.products(organization_id);
create index if not exists idx_orders_org              on public.orders(organization_id);
create index if not exists idx_order_items_org         on public.order_items(organization_id);

-- ─── RPC: create a company + make caller its owner ───────────────────────
create or replace function public.create_organization(
  p_name text,
  p_slug text,
  p_details jsonb default '{}'::jsonb
)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org public.organizations;
  v_slug text := lower(regexp_replace(coalesce(nullif(p_slug,''), p_name), '[^a-z0-9]+', '-', 'g'));
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then raise exception 'INVALID_SLUG'; end if;
  if exists (select 1 from public.organizations where slug = v_slug) then
    raise exception 'ORG_SLUG_TAKEN';
  end if;

  insert into public.organizations (
    name, slug, legal_name, gstin, email, phone, website, logo_url,
    address_line1, address_line2, city, state, pincode, country, onboarding, created_by
  ) values (
    p_name, v_slug,
    p_details->>'legalName', p_details->>'gstin', p_details->>'email', p_details->>'phone',
    p_details->>'website', p_details->>'logoUrl',
    p_details->>'addressLine1', p_details->>'addressLine2', p_details->>'city',
    p_details->>'state', p_details->>'pincode', coalesce(p_details->>'country', 'IN'),
    coalesce(p_details->'onboarding', '{}'::jsonb),
    auth.uid()
  )
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_org.id, auth.uid(), 'owner', auth.uid())
  on conflict (organization_id, user_id) do nothing;

  return v_org;
end;
$$;

create or replace function public.is_org_slug_available(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.organizations
    where slug = trim(both '-' from lower(regexp_replace(coalesce(p_slug,''), '[^a-z0-9]+', '-', 'g')))
  );
$$;

-- ─── RPC: accept a teammate invite by token ──────────────────────────────
create or replace function public.accept_org_invite(p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inv public.organization_invites;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_inv from public.organization_invites
  where token = p_token and accepted_at is null and expires_at > now();
  if not found then raise exception 'INVITE_INVALID_OR_EXPIRED'; end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_inv.organization_id, auth.uid(), v_inv.role, v_inv.invited_by)
  on conflict (organization_id, user_id)
    do update set role = excluded.role, status = 'active';

  update public.organization_invites
    set accepted_at = now(), accepted_by = auth.uid()
    where id = v_inv.id;

  return json_build_object('organizationId', v_inv.organization_id, 'role', v_inv.role);
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.schema_meta          enable row level security;

-- organizations: members read; owner/admin write; delete owner only.
drop policy if exists "org_select_members"  on public.organizations;
drop policy if exists "org_insert_self"     on public.organizations;
drop policy if exists "org_update_admins"   on public.organizations;
drop policy if exists "org_delete_owner"    on public.organizations;
create policy "org_select_members" on public.organizations
  for select using (public.is_org_member(id));
create policy "org_insert_self" on public.organizations
  for insert with check (created_by = auth.uid());
create policy "org_update_admins" on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']))
  with check (public.has_org_role(id, array['owner','admin']));
create policy "org_delete_owner" on public.organizations
  for delete using (public.has_org_role(id, array['owner']));

-- organization_members: see co-members; owner/admin manage.
drop policy if exists "org_members_select"  on public.organization_members;
drop policy if exists "org_members_write"   on public.organization_members;
create policy "org_members_select" on public.organization_members
  for select using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy "org_members_write" on public.organization_members
  for all
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

-- organization_invites: only owner/admin of that org.
drop policy if exists "org_invites_admin" on public.organization_invites;
create policy "org_invites_admin" on public.organization_invites
  for all
  using (public.has_org_role(organization_id, array['owner','admin']))
  with check (public.has_org_role(organization_id, array['owner','admin']));

-- schema_meta: readable by any authenticated user, writable by none (service role only).
drop policy if exists "schema_meta_read" on public.schema_meta;
create policy "schema_meta_read" on public.schema_meta
  for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- ─── Re-key stores / products / orders / order_items RLS to org membership ─
drop policy if exists "stores_owner_all"    on public.stores;
drop policy if exists "stores_public_live"  on public.stores;
drop policy if exists "stores_org_members"  on public.stores;
drop policy if exists "stores_org_write"    on public.stores;
drop policy if exists "stores_public_read"  on public.stores;
create policy "stores_org_members" on public.stores
  for select using (public.is_org_member(organization_id) or status = 'live');
create policy "stores_org_insert" on public.stores
  for insert with check (public.is_org_member(organization_id) and owner_id = auth.uid());
create policy "stores_org_update" on public.stores
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "stores_org_delete" on public.stores
  for delete using (public.has_org_role(organization_id, array['owner','admin']));

drop policy if exists "products_owner_all"           on public.products;
drop policy if exists "products_public_published"    on public.products;
create policy "products_org_all" on public.products
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "products_public_published" on public.products
  for select using (
    published = true
    and exists (select 1 from public.stores s where s.id = products.store_id and s.status = 'live')
  );

drop policy if exists "orders_owner_all" on public.orders;
create policy "orders_org_all" on public.orders
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "order_items_owner_all" on public.order_items;
create policy "order_items_org_all" on public.order_items
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ─── Grants ──────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.organizations, public.organization_members, public.organization_invites
  to authenticated;
grant select on public.schema_meta to anon, authenticated;
grant execute on function public.is_org_member(uuid)                to anon, authenticated;
grant execute on function public.has_org_role(uuid, text[])         to anon, authenticated;
grant execute on function public.current_org_ids()                  to anon, authenticated;
grant execute on function public.create_organization(text, text, jsonb) to authenticated;
grant execute on function public.is_org_slug_available(text)        to anon, authenticated;
grant execute on function public.accept_org_invite(text)            to authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-02_multitenant'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ==================== migrations/20260827120200_templates_and_publishing.sql ====================

-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827120200_templates_and_publishing
-- Shopify-style template pick → customise → publish → temporary host.
--
--   templates                       global starter catalogue (public read)
--   store_customizations            1 row / store: draft_config + published_config
--   store_customization_versions    immutable snapshots (rollback / audit)
--   store_publications              publish events + temp subdomain hosting
--   media_assets                    per-company uploaded images
--
-- All new tenant tables carry organization_id and are isolated by is_org_member.
-- Storefront (anon) reads ONLY published data through get_storefront() so a
-- visitor can never see another company's draft / private data.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── templates: global catalogue ────────────────────────────────────────
create table if not exists public.templates (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  name          text not null,
  category      text not null default 'general',
  industry      text,
  description   text,
  thumbnail_url text,
  preview_url   text,
  accent_color  text not null default '#0052FF',
  announcement  text,
  config        jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true,
  is_premium    boolean not null default false,
  sort_order    int not null default 0,
  version       int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_templates_updated_at on public.templates;
create trigger trg_templates_updated_at before update on public.templates
  for each row execute function public.set_updated_at();

-- ─── stores: template + hosting columns ─────────────────────────────────
alter table public.stores add column if not exists template_key    text;
alter table public.stores add column if not exists subdomain        text;
alter table public.stores add column if not exists published_at     timestamptz;
alter table public.stores add column if not exists draft_updated_at timestamptz;

do $$ begin
  alter table public.stores add constraint stores_subdomain_key unique (subdomain);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.stores
    add constraint stores_template_key_fkey
    foreign key (template_key) references public.templates(key) on delete set null;
exception when duplicate_object then null; end $$;

-- ─── store_customizations: current draft + published snapshot ───────────
create table if not exists public.store_customizations (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores(id) on delete cascade,
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  template_key         text references public.templates(key) on delete set null,
  theme_tokens         jsonb not null default '{}'::jsonb,   -- colours, fonts, radius…
  draft_config         jsonb not null default '{}'::jsonb,   -- working section / page tree
  published_config     jsonb,                                -- last published tree
  published_version_id uuid,                                 -- FK added below
  draft_updated_by     uuid references auth.users(id) on delete set null,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (store_id)
);

drop trigger if exists trg_store_customizations_updated_at on public.store_customizations;
create trigger trg_store_customizations_updated_at before update on public.store_customizations
  for each row execute function public.set_updated_at();

-- ─── store_customization_versions: immutable history ────────────────────
create table if not exists public.store_customization_versions (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  config          jsonb not null,
  theme_tokens    jsonb not null default '{}'::jsonb,
  template_key    text,
  label           text,
  note            text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

do $$ begin
  alter table public.store_customizations
    add constraint store_customizations_published_version_fkey
    foreign key (published_version_id)
    references public.store_customization_versions(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ─── store_publications: publish events + temp host ─────────────────────
create table if not exists public.store_publications (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_id      uuid references public.store_customization_versions(id) on delete set null,
  status          text not null default 'live',
  host_type       text not null default 'temp',
  temp_subdomain  text,
  custom_domain   text,
  url             text,
  published_by    uuid references auth.users(id) on delete set null,
  published_at    timestamptz not null default now(),
  unpublished_at  timestamptz
);

do $$ begin
  alter table public.store_publications
    add constraint store_publications_status_check
    check (status in ('queued','building','live','failed','unpublished'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.store_publications
    add constraint store_publications_host_type_check
    check (host_type in ('temp','custom'));
exception when duplicate_object then null; end $$;

-- Only one live temp publication per store.
create unique index if not exists uq_store_publications_live_temp
  on public.store_publications (store_id)
  where status = 'live' and host_type = 'temp';
create unique index if not exists uq_store_publications_temp_subdomain
  on public.store_publications (temp_subdomain)
  where temp_subdomain is not null;

-- ─── media_assets: per-company uploads ─────────────────────────────────
create table if not exists public.media_assets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id        uuid references public.stores(id) on delete set null,
  uploaded_by     uuid references auth.users(id) on delete set null,
  bucket          text not null default 'store-media',
  path            text not null,
  url             text,
  kind            text not null default 'image',
  alt             text,
  size_bytes      bigint,
  width           int,
  height          int,
  created_at      timestamptz not null default now(),
  unique (bucket, path)
);

-- ─── Indexes ───────────────────────────────────────────────────────────
create index if not exists idx_templates_active        on public.templates(is_active, sort_order);
create index if not exists idx_store_cust_store         on public.store_customizations(store_id);
create index if not exists idx_store_cust_org          on public.store_customizations(organization_id);
create index if not exists idx_store_cust_ver_store    on public.store_customization_versions(store_id, created_at desc);
create index if not exists idx_store_pub_store         on public.store_publications(store_id, published_at desc);
create index if not exists idx_store_pub_org           on public.store_publications(organization_id);
create index if not exists idx_media_assets_org        on public.media_assets(organization_id);
create index if not exists idx_media_assets_store      on public.media_assets(store_id);

-- ─── RPC: save the working draft (upsert) ──────────────────────────────
create or replace function public.save_store_draft(
  p_store_id uuid,
  p_draft_config jsonb,
  p_theme_tokens jsonb default null,
  p_template_key text default null
)
returns public.store_customizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_row public.store_customizations;
begin
  select organization_id into v_org from public.stores where id = p_store_id;
  if v_org is null then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_org) then raise exception 'FORBIDDEN'; end if;

  insert into public.store_customizations (
    store_id, organization_id, template_key, draft_config, theme_tokens, draft_updated_by
  ) values (
    p_store_id, v_org, p_template_key, coalesce(p_draft_config, '{}'::jsonb),
    coalesce(p_theme_tokens, '{}'::jsonb), auth.uid()
  )
  on conflict (store_id) do update set
    draft_config     = coalesce(p_draft_config, public.store_customizations.draft_config),
    theme_tokens     = coalesce(p_theme_tokens, public.store_customizations.theme_tokens),
    template_key     = coalesce(p_template_key, public.store_customizations.template_key),
    draft_updated_by = auth.uid(),
    updated_at       = now()
  returning * into v_row;

  update public.stores
    set draft_updated_at = now(),
        template_key = coalesce(p_template_key, template_key)
    where id = p_store_id;

  return v_row;
end;
$$;

-- ─── RPC: publish → snapshot version → temp host ───────────────────────
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
  v_cust        public.store_customizations;
  v_version_id  uuid;
  v_sub         text;
  v_pub_id      uuid;
  v_base        text := 'supershowroom.app';
  v_url         text;
begin
  select * into v_store from public.stores where id = p_store_id;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_store.organization_id) then raise exception 'FORBIDDEN'; end if;

  select * into v_cust from public.store_customizations where store_id = p_store_id;
  if not found then
    insert into public.store_customizations (store_id, organization_id, draft_config)
    values (p_store_id, v_store.organization_id, '{}'::jsonb)
    returning * into v_cust;
  end if;

  v_sub := trim(both '-' from lower(regexp_replace(
    coalesce(nullif(p_subdomain, ''), v_store.subdomain, v_store.slug), '[^a-z0-9]+', '-', 'g')));
  if v_sub = '' then raise exception 'INVALID_SUBDOMAIN'; end if;
  if exists (
    select 1 from public.stores s where s.subdomain = v_sub and s.id <> p_store_id
  ) then
    raise exception 'SUBDOMAIN_TAKEN';
  end if;

  -- immutable snapshot
  insert into public.store_customization_versions (
    store_id, organization_id, config, theme_tokens, template_key, label, created_by
  ) values (
    p_store_id, v_store.organization_id, v_cust.draft_config, v_cust.theme_tokens,
    v_cust.template_key, coalesce(p_label, 'Publish ' || to_char(now(), 'YYYY-MM-DD HH24:MI')),
    auth.uid()
  )
  returning id into v_version_id;

  update public.store_customizations set
    published_config     = v_cust.draft_config,
    published_version_id  = v_version_id,
    published_at         = now(),
    updated_at           = now()
  where store_id = p_store_id;

  -- retire the previous live temp publication
  update public.store_publications
    set status = 'unpublished', unpublished_at = now()
    where store_id = p_store_id and status = 'live' and host_type = 'temp';

  v_url := 'https://' || v_sub || '.' || v_base;

  insert into public.store_publications (
    store_id, organization_id, version_id, status, host_type, temp_subdomain, url, published_by
  ) values (
    p_store_id, v_store.organization_id, v_version_id, 'live', 'temp', v_sub, v_url, auth.uid()
  )
  returning id into v_pub_id;

  update public.stores set
    subdomain = v_sub,
    status = 'live',
    published_at = now(),
    updated_at = now()
  where id = p_store_id;

  return json_build_object(
    'publicationId', v_pub_id,
    'versionId', v_version_id,
    'subdomain', v_sub,
    'url', v_url,
    'status', 'live'
  );
end;
$$;

create or replace function public.unpublish_store(p_store_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.stores where id = p_store_id;
  if v_org is null then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_org) then raise exception 'FORBIDDEN'; end if;

  update public.store_publications
    set status = 'unpublished', unpublished_at = now()
    where store_id = p_store_id and status = 'live';

  update public.stores set status = 'draft', updated_at = now() where id = p_store_id;

  return json_build_object('status', 'unpublished');
end;
$$;

-- ─── RPC: restore a previous version into the draft ────────────────────
create or replace function public.restore_store_version(p_version_id uuid)
returns public.store_customizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ver public.store_customization_versions;
  v_row public.store_customizations;
begin
  select * into v_ver from public.store_customization_versions where id = p_version_id;
  if not found then raise exception 'VERSION_NOT_FOUND'; end if;
  if not public.is_org_member(v_ver.organization_id) then raise exception 'FORBIDDEN'; end if;

  update public.store_customizations set
    draft_config = v_ver.config,
    theme_tokens = v_ver.theme_tokens,
    template_key = coalesce(v_ver.template_key, template_key),
    draft_updated_by = auth.uid(),
    updated_at = now()
  where store_id = v_ver.store_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ─── RPC: public storefront read (published data only, no leak) ────────
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
  where status = 'live' and (slug = v_key or subdomain = v_key)
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
      'accentColor', v_store.accent_color, 'plan', v_store.plan
    ),
    'config', coalesce(v_cust.published_config, '{}'::jsonb),
    'themeTokens', coalesce(v_cust.theme_tokens, '{}'::jsonb),
    'products', v_products
  );
end;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────
alter table public.templates                     enable row level security;
alter table public.store_customizations          enable row level security;
alter table public.store_customization_versions  enable row level security;
alter table public.store_publications            enable row level security;
alter table public.media_assets                  enable row level security;

drop policy if exists "templates_public_read" on public.templates;
create policy "templates_public_read" on public.templates
  for select using (is_active = true);

drop policy if exists "store_cust_org_all" on public.store_customizations;
create policy "store_cust_org_all" on public.store_customizations
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "store_cust_ver_org" on public.store_customization_versions;
create policy "store_cust_ver_org" on public.store_customization_versions
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "store_pub_org_read"  on public.store_publications;
drop policy if exists "store_pub_org_write" on public.store_publications;
create policy "store_pub_org_read" on public.store_publications
  for select using (public.is_org_member(organization_id) or status = 'live');
create policy "store_pub_org_write" on public.store_publications
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "media_assets_org_all" on public.media_assets;
create policy "media_assets_org_all" on public.media_assets
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ─── Grants ──────────────────────────────────────────────────────────
grant select on public.templates to anon, authenticated;
grant select, insert, update, delete on
  public.store_customizations, public.store_customization_versions,
  public.store_publications, public.media_assets
  to authenticated;

grant execute on function public.save_store_draft(uuid, jsonb, jsonb, text) to authenticated;
grant execute on function public.publish_store(uuid, text, text)            to authenticated;
grant execute on function public.unpublish_store(uuid)                      to authenticated;
grant execute on function public.restore_store_version(uuid)                to authenticated;
grant execute on function public.get_storefront(text)                       to anon, authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-03_templates_publishing'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ==================== migrations/20260827120300_seed_templates.sql ====================

-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827120300_seed_templates
-- Seeds the 6 built-in starter templates (mirrors src/lib/constants.ts THEMES).
-- Idempotent: re-running refreshes copy but never duplicates and never wipes
-- a merchant's customised store_customizations rows.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.templates (key, name, category, industry, description, thumbnail_url, accent_color, announcement, sort_order, config)
values
  ('fashion',  'Luxe Apparel & Fashion',   'retail',      'apparel',     'Editorial hero, lookbook grid, size-guide ready.',
     'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop', '#0052FF',
     '✨ GET FLAT 15% OFF WITH CODE: LAUNCH15', 1,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"featured_products"},{"type":"lookbook"},{"type":"newsletter"},{"type":"footer"}]}'::jsonb),
  ('bakery',   'Artisan Bakery & Café',    'food',        'bakery',      'Warm hero, same-day delivery banner, menu grid.',
     'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop', '#B45309',
     '🥐 FRESH BATCH OUT OF OVEN — SAME DAY DELIVERY', 2,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"menu_grid"},{"type":"story"},{"type":"footer"}]}'::jsonb),
  ('skincare', 'Glow Organic Skincare',    'beauty',      'skincare',    'Ingredient-led layout, routine builder, reviews.',
     'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop', '#059669',
     '🌿 100% DERMATOLOGIST-FORMULATED · TOXIN-FREE', 3,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"benefits"},{"type":"featured_products"},{"type":"reviews"},{"type":"footer"}]}'::jsonb),
  ('kirana',   'Fresh Mart & Kirana',      'grocery',     'grocery',     'Category tiles, delivery-slot picker, essentials rail.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop', '#16A34A',
     '🥦 FARM TO TABLE · 3-HOUR DELIVERY', 4,
     '{"sections":[{"type":"announcement"},{"type":"category_tiles"},{"type":"featured_products"},{"type":"delivery_info"},{"type":"footer"}]}'::jsonb),
  ('tech',     'Cyber Tech & Gadgets',     'electronics', 'electronics', 'Spec-forward cards, EMI badge, comparison block.',
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop', '#7C3AED',
     '⚡ OFFICIAL WARRANTY · NO COST EMI', 5,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"featured_products"},{"type":"spec_compare"},{"type":"footer"}]}'::jsonb),
  ('jewels',   'Royal Gold & Jewellery',   'jewellery',   'jewellery',   'Dark luxe palette, hallmark trust bar, collection carousel.',
     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop', '#B8860B',
     '💎 BIS HALLMARKED GOLD · INSURED TRANSIT', 6,
     '{"sections":[{"type":"announcement"},{"type":"hero"},{"type":"collection_carousel"},{"type":"trust_bar"},{"type":"footer"}]}'::jsonb)
on conflict (key) do update set
  name         = excluded.name,
  category     = excluded.category,
  industry     = excluded.industry,
  description  = excluded.description,
  thumbnail_url= excluded.thumbnail_url,
  accent_color = excluded.accent_color,
  announcement = excluded.announcement,
  sort_order   = excluded.sort_order,
  config       = excluded.config,
  updated_at   = now();

-- ==================== migrations/20260827130000_plans_and_demo.sql ====================

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

-- ==================== migrations/20260827140000_premium_templates.sql ====================

-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827140000_premium_templates
-- Template access is tiered by plan. Every company sees all templates in the
-- gallery, but can only APPLY / PUBLISH ones at or below its plan. New premium
-- templates shipped later become available automatically to plans that qualify.
--
-- Isolation reminder: a template a company applies is written to
-- store_customizations (organization_id, RLS = is_org_member). One company's
-- edits, drafts, published config, products and orders are all partitioned by
-- organization_id and unreachable by any other company.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.templates add column if not exists min_plan   text not null default 'free';
alter table public.templates add column if not exists tier_label text;

do $$ begin
  alter table public.templates
    add constraint templates_min_plan_check
    check (min_plan in ('free','essential','pro','elite','plus'));
exception when duplicate_object then null; end $$;

-- ─── plan ranking helpers ────────────────────────────────────────────────
create or replace function public.plan_rank(p_plan text)
returns int
language sql
immutable
as $$
  select case coalesce(p_plan,'free')
    when 'free' then 0 when 'essential' then 1 when 'pro' then 2
    when 'elite' then 3 when 'plus' then 4 else 0 end;
$$;

create or replace function public.can_use_template(p_template_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_min text;
  v_plan text;
begin
  select min_plan into v_min from public.templates where key = p_template_key and is_active = true;
  if v_min is null then return false; end if;

  select o.plan into v_plan
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where m.user_id = auth.uid() and m.status = 'active'
  order by o.created_at asc
  limit 1;

  return public.plan_rank(coalesce(v_plan,'free')) >= public.plan_rank(v_min);
end;
$$;

grant execute on function public.plan_rank(text)          to anon, authenticated;
grant execute on function public.can_use_template(text)   to anon, authenticated;

-- ─── save_store_draft: block applying a template the plan can't use ──────
create or replace function public.save_store_draft(
  p_store_id uuid,
  p_draft_config jsonb,
  p_theme_tokens jsonb default null,
  p_template_key text default null
)
returns public.store_customizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_row public.store_customizations;
begin
  select organization_id into v_org from public.stores where id = p_store_id;
  if v_org is null then raise exception 'STORE_NOT_FOUND'; end if;
  if not public.is_org_member(v_org) then raise exception 'FORBIDDEN'; end if;

  if p_template_key is not null
     and exists (select 1 from public.templates where key = p_template_key)
     and not public.can_use_template(p_template_key) then
    raise exception 'TEMPLATE_LOCKED';
  end if;

  insert into public.store_customizations (
    store_id, organization_id, template_key, draft_config, theme_tokens, draft_updated_by
  ) values (
    p_store_id, v_org, p_template_key, coalesce(p_draft_config, '{}'::jsonb),
    coalesce(p_theme_tokens, '{}'::jsonb), auth.uid()
  )
  on conflict (store_id) do update set
    draft_config     = coalesce(p_draft_config, public.store_customizations.draft_config),
    theme_tokens     = coalesce(p_theme_tokens, public.store_customizations.theme_tokens),
    template_key     = coalesce(p_template_key, public.store_customizations.template_key),
    draft_updated_by = auth.uid(),
    updated_at       = now()
  returning * into v_row;

  update public.stores
    set draft_updated_at = now(),
        template_key = coalesce(p_template_key, template_key)
    where id = p_store_id;

  return v_row;
end;
$$;

grant execute on function public.save_store_draft(uuid, jsonb, jsonb, text) to authenticated;

-- ─── tier the seeded templates ─────────────────────────────────────────
update public.templates set min_plan = 'free',      tier_label = null      where key in ('fashion','bakery');
update public.templates set min_plan = 'essential', tier_label = 'Essential', is_premium = true where key in ('skincare','kirana');
update public.templates set min_plan = 'pro',       tier_label = 'Pro',       is_premium = true where key = 'tech';
update public.templates set min_plan = 'elite',     tier_label = 'Elite',     is_premium = true where key = 'jewels';

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-06_premium_templates'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ==================== migrations/20260827150000_fix_publication_subdomain_uniqueness.sql ====================

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

-- ==================== migrations/20260827160000_analytics.sql ====================

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

-- ==================== migrations/20260827170000_hosted_path.sql ====================

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

-- ==================== migrations/20260827180000_brand_only_subdomain.sql ====================

-- ═══════════════════════════════════════════════════════════════════════════
-- 20260827180000_brand_only_subdomain
-- The temporary host is now just the brand/store slug — nothing prepended:
--   https://<brand>.supershowroom.app   (and path host  /h/<brand>)
-- publish_store uses exactly the subdomain the merchant typed (defaulting to
-- the store slug); no "<company>-" prefix.
-- ═══════════════════════════════════════════════════════════════════════════

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

  -- brand slug only — the value the merchant typed, else the store slug
  v_sub := trim(both '-' from lower(regexp_replace(
    coalesce(nullif(p_subdomain, ''), v_store.subdomain, v_store.slug), '[^a-z0-9]+', '-', 'g')));
  if v_sub = '' then raise exception 'INVALID_SUBDOMAIN'; end if;
  if exists (select 1 from public.stores s where s.subdomain = v_sub and s.id <> p_store_id) then
    raise exception 'SUBDOMAIN_TAKEN';
  end if;

  v_url := 'https://' || v_sub || '.' || v_base;

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
    p_store_id, v_store.organization_id, v_version_id, v_status, 'temp', v_sub, v_sub, v_url, auth.uid()
  )
  returning id into v_pub_id;

  update public.stores set
    subdomain = v_sub,
    host_path = v_sub,
    status = v_status,
    published_at = now(),
    updated_at = now()
  where id = p_store_id;

  return json_build_object(
    'publicationId', v_pub_id,
    'versionId', v_version_id,
    'subdomain', v_sub,
    'hostPath', v_sub,
    'brandedHost', v_sub || '.' || v_base,
    'url', v_url,
    'status', v_status,
    'demo', v_is_demo,
    'mode', case when v_is_demo then 'demo_preview' else 'live' end
  );
end;
$$;

grant execute on function public.publish_store(uuid, text, text) to authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.27-10_brand_only_subdomain'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
