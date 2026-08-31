-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829160000_storefront_custom_domain
-- get_storefront() now also resolves a store by its custom_domain, so a
-- merchant can point shop.theirbrand.com at the app and it serves that store.
-- Everything else is unchanged from the hosted_path version.
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_host text := lower(trim(v_raw));                              -- exact host, for custom_domain
  v_key  text := trim(both '-' from lower(regexp_replace(v_raw, '[^a-z0-9]+', '-', 'g')));
  v_path text := lower(trim(both '/' from v_raw));
begin
  select * into v_store from public.stores
  where status in ('live','preview')
    and (
      slug = v_key
      or subdomain = v_key
      or host_path = v_path
      or lower(custom_domain) = v_host
      or lower(custom_domain) = 'www.' || v_host
      or 'www.' || lower(custom_domain) = v_host
    )
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
values ('version', to_jsonb('2026.08.29-15_storefront_custom_domain'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
