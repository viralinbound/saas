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
