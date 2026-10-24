-- Fix create_order(): the original version inserted `order_items` before the
-- parent `orders` row existed, so every checkout failed with
-- order_items_order_id_fkey. The order row is now written first (as a
-- 'pending' placeholder), then its items and stock decrements, and the totals
-- are applied once the loop has finished. The whole function still runs in one
-- transaction, so a failure leaves neither the order nor the stock changes.
create or replace function public.create_order(payload jsonb, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := p_user_id;
  v_name text := nullif(payload ->> 'customer_name', '');
  v_email text := nullif(payload ->> 'customer_email', '');
  v_address jsonb := coalesce(payload -> 'shipping_address', '{}'::jsonb);
  v_items jsonb := coalesce(payload -> 'items', '[]'::jsonb);
  v_order_id uuid := gen_random_uuid();
  v_total numeric(10, 2) := 0;
  v_tax numeric(10, 2);
  v_count integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if v_name is null or v_email is null then
    raise exception 'customer_name and customer_email are required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'An order needs at least one item' using errcode = '22023';
  end if;

  if jsonb_array_length(v_items) > 50 then
    raise exception 'Too many items in one order' using errcode = '22023';
  end if;

  -- Parent row first: order_items references it.
  insert into public.orders (
    id, user_id, customer_name, customer_email, status, total, tax, item_count, shipping_address
  ) values (
    v_order_id, v_user, v_name, v_email, 'pending', 0, 0, 0, v_address
  );

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 0);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'Invalid quantity for product %', v_item ->> 'product_id' using errcode = '22023';
    end if;

    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid and is_active
      for update;

    if not found then
      raise exception 'Product % is not available', v_item ->> 'product_id' using errcode = 'P0002';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Not enough stock for %', v_product.name using errcode = 'P0001';
    end if;

    insert into public.order_items (order_id, product_id, name, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);

    update public.products set stock = stock - v_qty where id = v_product.id;

    v_total := v_total + (v_product.price * v_qty);
    v_count := v_count + v_qty;
  end loop;

  v_tax := round(v_total * 0.08, 2);

  update public.orders
    set status = 'paid', total = v_total, tax = v_tax, item_count = v_count
    where id = v_order_id;

  return jsonb_build_object(
    'id', v_order_id,
    'total', v_total,
    'tax', v_tax,
    'item_count', v_count,
    'status', 'paid',
    'created_at', now()
  );
end;
$$;

revoke all on function public.create_order(jsonb, uuid) from anon, authenticated;
grant execute on function public.create_order(jsonb, uuid) to service_role;
