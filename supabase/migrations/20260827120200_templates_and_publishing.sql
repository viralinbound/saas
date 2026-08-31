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
