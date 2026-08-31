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
