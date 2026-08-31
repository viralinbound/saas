-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829140000_store_media
--
-- Media library for the drag-and-drop builder. Files live in the private-ish
-- Supabase Storage bucket `store-media` under a per-tenant path:
--     <organization_id>/<store_id>/<uuid>.<ext>
--
-- Write / update / delete on any object require org membership (checked against
-- the first path folder = organization_id). Read is public so a published
-- storefront can display the images/video — same as any website asset — but
-- nobody outside the org can modify or list-and-enumerate through the API,
-- and the `store_media` catalog table is fully RLS-scoped to the org.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-media', 'store-media', true, 52428800,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/avif',
        'video/mp4','video/webm','video/quicktime','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects policies (bucket-scoped) ------------------------------------
do $$
begin
  -- read: public (bucket is public) — but keep an explicit select policy too
  drop policy if exists "store_media read" on storage.objects;
  create policy "store_media read" on storage.objects
    for select using (bucket_id = 'store-media');

  drop policy if exists "store_media insert" on storage.objects;
  create policy "store_media insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'store-media'
      and public.is_org_member( ((storage.foldername(name))[1])::uuid )
    );

  drop policy if exists "store_media update" on storage.objects;
  create policy "store_media update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'store-media'
      and public.is_org_member( ((storage.foldername(name))[1])::uuid )
    );

  drop policy if exists "store_media delete" on storage.objects;
  create policy "store_media delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'store-media'
      and public.is_org_member( ((storage.foldername(name))[1])::uuid )
    );
end $$;

-- catalog table ------------------------------------------------------------
create table if not exists public.store_media (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  path             text not null unique,   -- object path inside the bucket
  url              text not null,          -- public URL
  kind             text not null default 'image',  -- image | video | file
  mime             text,
  bytes            bigint,
  width            int,
  height           int,
  alt              text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);
do $$ begin
  alter table public.store_media
    add constraint chk_store_media_kind check (kind in ('image','video','file'));
exception when duplicate_object then null; end $$;

create index if not exists idx_store_media_store on public.store_media(store_id, created_at desc);

alter table public.store_media enable row level security;
revoke all on public.store_media from anon, authenticated;

drop policy if exists sm_member_read on public.store_media;
create policy sm_member_read on public.store_media
  for select using (public.is_org_member(organization_id));

drop policy if exists sm_member_write on public.store_media;
create policy sm_member_write on public.store_media
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.store_media to authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.29-13_store_media'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
