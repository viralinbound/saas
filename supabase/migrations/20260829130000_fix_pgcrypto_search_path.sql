-- ═══════════════════════════════════════════════════════════════════════════
-- 20260829130000_fix_pgcrypto_search_path
--
-- On Supabase, pgcrypto (crypt / gen_salt / gen_random_bytes) lives in the
-- `extensions` schema, which the previous migration's pinned
-- `search_path = public, pg_temp` did not include — so storefront_register /
-- storefront_authenticate failed with "function crypt(...) does not exist".
-- Recreate those two functions with `extensions` on the search_path.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.storefront_register(
  p_slug text, p_email text, p_password text,
  p_name text default null, p_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
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

create or replace function public.storefront_authenticate(
  p_slug text, p_email text, p_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
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

grant execute on function public.storefront_register(text,text,text,text,text) to anon, authenticated;
grant execute on function public.storefront_authenticate(text,text,text)       to anon, authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.08.29-12_fix_pgcrypto_search_path'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
