-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829120000_customer_accounts_and_collections
--
-- Two backend features driven by the drag-and-drop builder:
--
--   1. Storefront customer accounts — shoppers can register / sign in on a
--      merchant's store. Separate from the merchant auth (auth.users); scoped
--      per store so the same email can exist on two different stores.
--
--   2. Custom data collections ("database") — a merchant defines collections
--      with typed fields, and either the merchant or storefront visitors add
--      records. A builder block renders a collection as a list or a form.
--
-- All storefront-facing writes go through SECURITY DEFINER RPCs so the anon
-- role never touches these tables directly. Merchants (org members) read/write
-- their own store's rows through RLS. No cross-tenant leakage.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── storefront customers ────────────────────────────────────────────────
create table if not exists public.storefront_customers (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  email            text not null,
  password_hash    text not null,
  name             text,
  phone            text,
  created_at       timestamptz not null default now(),
  last_login_at    timestamptz
);

create unique index if not exists uq_storefront_customer_email
  on public.storefront_customers (store_id, lower(email));

create index if not exists idx_storefront_customers_store on public.storefront_customers(store_id);

alter table public.storefront_customers enable row level security;
revoke all on public.storefront_customers from anon, authenticated;

drop policy if exists sc_member_read on public.storefront_customers;
create policy sc_member_read on public.storefront_customers
  for select using (public.is_org_member(organization_id));

grant select on public.storefront_customers to authenticated;

-- ─── storefront sessions (opaque tokens) ─────────────────────────────────
create table if not exists public.storefront_sessions (
  token        text primary key,
  customer_id  uuid not null references public.storefront_customers(id) on delete cascade,
  store_id     uuid not null references public.stores(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '30 days')
);
create index if not exists idx_storefront_sessions_customer on public.storefront_sessions(customer_id);

alter table public.storefront_sessions enable row level security;
revoke all on public.storefront_sessions from anon, authenticated;

-- ─── custom collections ("database") ─────────────────────────────────────
create table if not exists public.store_collections (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  key              text not null,
  name             text not null,
  fields           jsonb not null default '[]'::jsonb,   -- [{ key, label, type }]
  allow_public_submit boolean not null default true,     -- storefront visitors can add rows
  is_public        boolean not null default true,        -- storefront can list rows
  require_login    boolean not null default false,       -- submitting needs a customer session
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

do $$ begin
  alter table public.store_collections
    add constraint uq_store_collection_key unique (store_id, key);
exception when duplicate_object then null; when duplicate_table then null; end $$;

create index if not exists idx_store_collections_store on public.store_collections(store_id);

alter table public.store_collections enable row level security;
revoke all on public.store_collections from anon, authenticated;

drop policy if exists col_member_all on public.store_collections;
create policy col_member_all on public.store_collections
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.store_collections to authenticated;

-- ─── collection records ─────────────────────────────────────────────────
create table if not exists public.store_collection_records (
  id                  uuid primary key default gen_random_uuid(),
  collection_id       uuid not null references public.store_collections(id) on delete cascade,
  store_id            uuid not null references public.stores(id) on delete cascade,
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  data                jsonb not null default '{}'::jsonb,
  created_by_customer uuid references public.storefront_customers(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index if not exists idx_collection_records_collection on public.store_collection_records(collection_id);
create index if not exists idx_collection_records_store on public.store_collection_records(store_id);

alter table public.store_collection_records enable row level security;
revoke all on public.store_collection_records from anon, authenticated;

drop policy if exists rec_member_read on public.store_collection_records;
create policy rec_member_read on public.store_collection_records
  for select using (public.is_org_member(organization_id));

drop policy if exists rec_member_write on public.store_collection_records;
create policy rec_member_write on public.store_collection_records
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.store_collection_records to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — the only path the storefront (anon) uses to touch the tables above.
-- ═══════════════════════════════════════════════════════════════════════════

-- resolve a live/preview store by slug or subdomain
create or replace function public._resolve_store(p_slug text)
returns public.stores
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select * from public.stores
  where slug = p_slug or subdomain = p_slug or host_path = p_slug
  order by (slug = p_slug) desc
  limit 1;
$$;

-- ─── storefront_register ────────────────────────────────────────────────
create or replace function public.storefront_register(
  p_slug text, p_email text, p_password text,
  p_name text default null, p_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store    public.stores;
  v_customer public.storefront_customers;
  v_token    text;
begin
  if length(coalesce(p_password, '')) < 6 then raise exception 'WEAK_PASSWORD'; end if;
  v_store := public._resolve_store(p_slug);
  if v_store.id is null then raise exception 'STORE_NOT_FOUND'; end if;

  if exists (
    select 1 from public.storefront_customers
    where store_id = v_store.id and lower(email) = lower(p_email)
  ) then
    raise exception 'EMAIL_TAKEN';
  end if;

  insert into public.storefront_customers (store_id, organization_id, email, password_hash, name, phone, last_login_at)
  values (v_store.id, v_store.organization_id, lower(p_email),
          crypt(p_password, gen_salt('bf')), nullif(p_name, ''), nullif(p_phone, ''), now())
  returning * into v_customer;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.storefront_sessions (token, customer_id, store_id)
  values (v_token, v_customer.id, v_store.id);

  return json_build_object(
    'token', v_token,
    'customer', json_build_object('id', v_customer.id, 'email', v_customer.email, 'name', v_customer.name, 'phone', v_customer.phone)
  );
end;
$$;

-- ─── storefront_authenticate ────────────────────────────────────────────
create or replace function public.storefront_authenticate(
  p_slug text, p_email text, p_password text
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store    public.stores;
  v_customer public.storefront_customers;
  v_token    text;
begin
  v_store := public._resolve_store(p_slug);
  if v_store.id is null then raise exception 'STORE_NOT_FOUND'; end if;

  select * into v_customer from public.storefront_customers
  where store_id = v_store.id and lower(email) = lower(p_email);

  if v_customer.id is null or v_customer.password_hash <> crypt(p_password, v_customer.password_hash) then
    raise exception 'INVALID_CREDENTIALS';
  end if;

  update public.storefront_customers set last_login_at = now() where id = v_customer.id;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.storefront_sessions (token, customer_id, store_id)
  values (v_token, v_customer.id, v_store.id);

  return json_build_object(
    'token', v_token,
    'customer', json_build_object('id', v_customer.id, 'email', v_customer.email, 'name', v_customer.name, 'phone', v_customer.phone)
  );
end;
$$;

-- ─── storefront_session ────────────────────────────────────────────────
create or replace function public.storefront_session(p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_customer public.storefront_customers;
begin
  select c.* into v_customer
  from public.storefront_sessions s
  join public.storefront_customers c on c.id = s.customer_id
  where s.token = p_token and s.expires_at > now();

  if v_customer.id is null then return null; end if;

  return json_build_object('id', v_customer.id, 'email', v_customer.email, 'name', v_customer.name, 'phone', v_customer.phone);
end;
$$;

-- ─── storefront_logout ────────────────────────────────────────────────
create or replace function public.storefront_logout(p_token text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$ delete from public.storefront_sessions where token = p_token; $$;

-- ─── collection_view — public list of a collection's records ───────────
create or replace function public.collection_view(p_slug text, p_key text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store public.stores;
  v_col   public.store_collections;
  v_rows  json;
begin
  v_store := public._resolve_store(p_slug);
  if v_store.id is null then raise exception 'STORE_NOT_FOUND'; end if;

  select * into v_col from public.store_collections
  where store_id = v_store.id and key = p_key;
  if v_col.id is null then raise exception 'COLLECTION_NOT_FOUND'; end if;

  if not v_col.is_public then
    return json_build_object(
      'collection', json_build_object('key', v_col.key, 'name', v_col.name, 'fields', v_col.fields,
        'allowPublicSubmit', v_col.allow_public_submit, 'requireLogin', v_col.require_login),
      'records', '[]'::json
    );
  end if;

  select coalesce(json_agg(json_build_object('id', r.id, 'data', r.data, 'createdAt', r.created_at)
                           order by r.created_at desc), '[]'::json)
  into v_rows
  from public.store_collection_records r
  where r.collection_id = v_col.id;

  return json_build_object(
    'collection', json_build_object('key', v_col.key, 'name', v_col.name, 'fields', v_col.fields,
      'allowPublicSubmit', v_col.allow_public_submit, 'requireLogin', v_col.require_login),
    'records', v_rows
  );
end;
$$;

-- ─── collection_submit — add a record from the storefront ──────────────
create or replace function public.collection_submit(
  p_slug text, p_key text, p_data jsonb, p_token text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store    public.stores;
  v_col      public.store_collections;
  v_customer uuid;
  v_id       uuid;
begin
  v_store := public._resolve_store(p_slug);
  if v_store.id is null then raise exception 'STORE_NOT_FOUND'; end if;

  select * into v_col from public.store_collections
  where store_id = v_store.id and key = p_key;
  if v_col.id is null then raise exception 'COLLECTION_NOT_FOUND'; end if;
  if not v_col.allow_public_submit then raise exception 'SUBMIT_DISABLED'; end if;

  if p_token is not null then
    select c.id into v_customer
    from public.storefront_sessions s
    join public.storefront_customers c on c.id = s.customer_id
    where s.token = p_token and s.store_id = v_store.id and s.expires_at > now();
  end if;

  if v_col.require_login and v_customer is null then raise exception 'LOGIN_REQUIRED'; end if;

  insert into public.store_collection_records (collection_id, store_id, organization_id, data, created_by_customer)
  values (v_col.id, v_store.id, v_store.organization_id, coalesce(p_data, '{}'::jsonb), v_customer)
  returning id into v_id;

  return json_build_object('id', v_id);
end;
$$;

-- grants — anon may only call the RPCs, never select the tables
grant execute on function public._resolve_store(text)                              to anon, authenticated;
grant execute on function public.storefront_register(text,text,text,text,text)     to anon, authenticated;
grant execute on function public.storefront_authenticate(text,text,text)           to anon, authenticated;
grant execute on function public.storefront_session(text)                          to anon, authenticated;
grant execute on function public.storefront_logout(text)                           to anon, authenticated;
grant execute on function public.collection_view(text,text)                        to anon, authenticated;
grant execute on function public.collection_submit(text,text,jsonb,text)           to anon, authenticated;

-- link an order to a logged-in storefront customer (nullable, additive)
alter table public.orders add column if not exists storefront_customer_id uuid
  references public.storefront_customers(id) on delete set null;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.29-11_customer_accounts_and_collections'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
