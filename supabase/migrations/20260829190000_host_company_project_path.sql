-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829190000_host_company_project_path
-- Temporary hosted URL goes back to a path: company-slug / project-slug, e.g.
--     https://www.supershowroom.in/h/acme/krish
-- (subdomain routing stays available for later; the typed subdomain is still
--  stored on stores.subdomain / store_publications.temp_subdomain.)
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
  v_company     text;
  v_host_path   text;
  v_pub_id      uuid;
  v_base        text := 'supershowroom.in';
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

  -- the subdomain the merchant typed (kept for future subdomain hosting)
  v_sub := trim(both '-' from lower(regexp_replace(
    coalesce(nullif(p_subdomain, ''), v_store.subdomain, v_store.slug), '[^a-z0-9]+', '-', 'g')));
  if v_sub = '' then raise exception 'INVALID_SUBDOMAIN'; end if;
  if exists (select 1 from public.stores s where s.subdomain = v_sub and s.id <> p_store_id) then
    raise exception 'SUBDOMAIN_TAKEN';
  end if;

  -- company / project path host
  v_company   := trim(both '-' from lower(regexp_replace(coalesce(v_org.slug, 'store'), '[^a-z0-9]+', '-', 'g')));
  v_host_path := v_company || '/' || trim(both '-' from lower(regexp_replace(v_store.slug, '[^a-z0-9]+', '-', 'g')));
  v_url       := 'https://www.' || v_base || '/h/' || v_host_path;

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

  update public.store_publications
    set status = 'unpublished', unpublished_at = now()
    where store_id = p_store_id and status in ('live','preview') and host_type = 'temp';

  insert into public.store_publications (
    store_id, organization_id, version_id, status, host_type, temp_subdomain, host_path, url, published_by
  ) values (
    p_store_id, v_store.organization_id, v_version_id, v_status, 'temp', v_sub, v_host_path, v_url, auth.uid()
  )
  returning id into v_pub_id;

  update public.stores set
    subdomain = v_sub,
    host_path = v_host_path,
    status = v_status,
    published_at = now(),
    updated_at = now()
  where id = p_store_id;

  return json_build_object(
    'publicationId', v_pub_id,
    'versionId', v_version_id,
    'subdomain', v_sub,
    'hostPath', v_host_path,
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
values ('version', to_jsonb('2026.08.29-18_host_company_project_path'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
