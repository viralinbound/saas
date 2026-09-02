-- ═══════════════════════════════════════════════════════════════════════════
-- 20260902120000_storefront_orders
--
-- Storefront checkout for the six .dc templates:
--   * orders placed on a live/preview store now land in public.orders (so the
--     merchant sees them on the dashboard + /app/orders) instead of only
--     localStorage.
--   * a shopper MUST be signed in (storefront_customers session) to check out —
--     the order is linked to their account.
--   * storefront_my_orders() returns that shopper's order history for the store.
-- ═══════════════════════════════════════════════════════════════════════════

-- link an order to the storefront customer who placed it
alter table public.orders
  add column if not exists customer_id uuid
  references public.storefront_customers(id) on delete set null;

create index if not exists idx_orders_customer on public.orders(customer_id);

-- ─── storefront_place_order ─────────────────────────────────────────────
-- Requires a valid customer session token. Validates products + stock,
-- computes the plan platform fee, writes orders + order_items, decrements
-- stock. Amounts are in paise (minor units), same as products.price.
create or replace function public.storefront_place_order(
  p_slug           text,
  p_token          text,
  p_payment_method text,
  p_items          jsonb,
  p_address        jsonb default '{}'::jsonb
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store       public.stores;
  v_customer    public.storefront_customers;
  v_subtotal    int := 0;
  v_platform_fee int := 0;
  v_order_id    uuid;
  v_order_number text;
  v_count       int;
  v_item        jsonb;
  v_product     public.products;
  v_qty         int;
  v_price       int;
  v_name        text;
  v_phone       text;
  v_email       text;
  v_addr        text;
  v_city        text;
  v_pincode     text;
begin
  v_store := public._resolve_store(p_slug);
  if v_store.id is null or v_store.status not in ('live', 'preview') then
    raise exception 'STORE_NOT_AVAILABLE';
  end if;

  -- the shopper must be signed in on THIS store
  select c.* into v_customer
  from public.storefront_sessions s
  join public.storefront_customers c on c.id = s.customer_id
  where s.token = p_token and s.store_id = v_store.id and s.expires_at > now();
  if v_customer.id is null then raise exception 'LOGIN_REQUIRED'; end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;

  -- contact + address: form values first, else the account record
  v_name    := coalesce(nullif(trim(p_address->>'name'), ''), v_customer.name, split_part(v_customer.email, '@', 1));
  v_phone   := coalesce(nullif(trim(p_address->>'phone'), ''), v_customer.phone);
  v_email   := coalesce(nullif(trim(p_address->>'email'), ''), v_customer.email);
  v_addr    := nullif(trim(p_address->>'line'), '');
  v_city    := nullif(trim(p_address->>'city'), '');
  v_pincode := nullif(trim(p_address->>'pincode'), '');
  if v_phone is null then raise exception 'PHONE_REQUIRED'; end if;
  if v_addr  is null then raise exception 'ADDRESS_REQUIRED'; end if;

  -- validate every line against the live catalogue
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty   := greatest((v_item->>'quantity')::int, 1);
    v_price := (v_item->>'price')::int;
    select * into v_product from public.products
    where id = (v_item->>'productId')::uuid and store_id = v_store.id and published = true;
    if not found then raise exception 'INVALID_PRODUCT'; end if;
    if v_product.stock < v_qty then raise exception 'INSUFFICIENT_STOCK'; end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  if    v_store.plan = 'free'      then v_platform_fee := ceil(v_subtotal * 0.02);
  elsif v_store.plan = 'essential' then v_platform_fee := ceil(v_subtotal * 0.015);
  else  v_platform_fee := 0;
  end if;

  select count(*) into v_count from public.orders where store_id = v_store.id;
  v_order_number := 'ORD-' || (88200 + v_count + 1)::text;

  insert into public.orders (
    store_id, customer_id, order_number, customer_name, customer_phone, customer_email,
    address, city, pincode, payment_method, status, subtotal, platform_fee, total
  ) values (
    v_store.id, v_customer.id, v_order_number, v_name, v_phone, v_email,
    v_addr, v_city, v_pincode, coalesce(nullif(p_payment_method, ''), 'cod'),
    'placed', v_subtotal, v_platform_fee, v_subtotal
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest((v_item->>'quantity')::int, 1);
    insert into public.order_items (order_id, product_id, name, price, quantity, variant)
    values (
      v_order_id, (v_item->>'productId')::uuid, v_item->>'name',
      (v_item->>'price')::int, v_qty, nullif(v_item->>'variant', '')
    );
    update public.products set stock = greatest(stock - v_qty, 0)
    where id = (v_item->>'productId')::uuid;
  end loop;

  return json_build_object(
    'id', v_order_id,
    'orderNumber', v_order_number,
    'subtotal', v_subtotal,
    'platformFee', v_platform_fee,
    'total', v_subtotal
  );
end;
$$;

-- ─── storefront_my_orders ──────────────────────────────────────────────
-- The signed-in shopper's order history for one store, newest first.
create or replace function public.storefront_my_orders(p_slug text, p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store       public.stores;
  v_customer_id uuid;
  v_rows        json;
begin
  v_store := public._resolve_store(p_slug);
  if v_store.id is null then raise exception 'STORE_NOT_FOUND'; end if;

  select c.id into v_customer_id
  from public.storefront_sessions s
  join public.storefront_customers c on c.id = s.customer_id
  where s.token = p_token and s.store_id = v_store.id and s.expires_at > now();
  if v_customer_id is null then raise exception 'LOGIN_REQUIRED'; end if;

  select coalesce(json_agg(o order by o.created_at desc), '[]'::json) into v_rows
  from (
    select
      ord.id,
      ord.order_number   as "orderNumber",
      ord.status,
      ord.payment_method as "paymentMethod",
      ord.total,
      ord.city,
      ord.created_at     as "createdAt",
      coalesce((
        select json_agg(json_build_object('name', oi.name, 'price', oi.price,
                                           'quantity', oi.quantity, 'variant', oi.variant))
        from public.order_items oi where oi.order_id = ord.id
      ), '[]'::json) as items
    from public.orders ord
    where ord.store_id = v_store.id and ord.customer_id = v_customer_id
  ) o;

  return v_rows;
end;
$$;

grant execute on function public.storefront_place_order(text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.storefront_my_orders(text, text)                        to anon, authenticated;

insert into public.schema_meta (key, value)
values ('version', to_jsonb('2026.09.02-12_storefront_orders'::text))
on conflict (key) do update set value = excluded.value, updated_at = now();
