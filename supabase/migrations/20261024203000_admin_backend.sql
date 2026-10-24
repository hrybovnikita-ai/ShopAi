/*
# ShopAi administrator backend, orders, monitoring and vector search

1. New tables
- `admin_users` — verified administrator accounts (user_id -> auth.users)
- `categories` — managed product categories
- `orders` / `order_items` — persisted orders placed through the checkout
- `api_request_logs` — structured request log written by the API service
- `app_errors` — server-side error/warning log
- `product_embeddings` — pgvector embeddings used by semantic search

2. Security
- `public.is_admin()` is the single source of truth for administrator rights.
- Product writes, category writes and order administration are restricted to
  administrators through RLS policies (previously any authenticated user could
  write products).
- Log tables are service-role only; the API checks administrator rights before
  exposing them.
- Demo accounts hold no JWT, so they can never satisfy `is_admin()`.
- A seeded local administrator exists for development only.

3. Functions
- `create_order(jsonb)` — validated, atomic order creation with stock updates
- `match_products(vector, int)` — cosine similarity search over embeddings
- `admin_stats()` / `admin_monitor_overview(int)` — dashboard aggregates
*/

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A signed-in user may check their own admin row (used by the API); nobody can
-- grant themselves rights, because there is no insert/update policy at all.
drop policy if exists "read_own_admin_row" on public.admin_users;
create policy "read_own_admin_row" on public.admin_users for select
  to authenticated using (user_id = auth.uid());

grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (select 1 from public.admin_users a where a.user_id = uid);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Seed a local development administrator. The password is only a sandbox
-- bootstrap value; replace or remove this account before any real deployment.
do $$
declare
  admin_id uuid;
  admin_email text := 'admin@shopai.dev';
begin
  select id into admin_id from auth.users where lower(email) = admin_email;

  if admin_id is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt('ShopAiAdmin!2026', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"ShopAi Administrator"}'::jsonb,
      now(),
      now(),
      '', '', '', '', '', '', '', ''
    )
    returning id into admin_id;

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      admin_id::text,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  insert into public.admin_users (user_id, email)
  values (admin_id, admin_email)
  on conflict (user_id) do nothing;
end
$$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  icon text not null default 'Cpu',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories" on public.categories for select
  to anon, authenticated using (true);

drop policy if exists "admin_write_categories" on public.categories;
create policy "admin_write_categories" on public.categories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.categories (name, description, icon)
select name,
       'Explore our ' || lower(name) || ' collection.',
       case name
         when 'Electronics' then 'Cpu'
         when 'Smartphones' then 'Smartphone'
         when 'Computers' then 'Laptop'
         when 'Gaming' then 'Gamepad2'
         when 'Accessories' then 'Watch'
         when 'Smart Home' then 'House'
         else 'Cpu'
       end
from (select distinct category as name from public.products where category is not null) src
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Products: availability flag + administrator-only writes
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists updated_at timestamptz not null default now();

drop policy if exists "auth_insert_products" on public.products;
drop policy if exists "auth_update_products" on public.products;
drop policy if exists "auth_delete_products" on public.products;

drop policy if exists "admin_insert_products" on public.products;
create policy "admin_insert_products" on public.products for insert
  to authenticated with check (public.is_admin());

drop policy if exists "admin_update_products" on public.products;
create policy "admin_update_products" on public.products for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_products" on public.products;
create policy "admin_delete_products" on public.products for delete
  to authenticated using (public.is_admin());

create or replace function public.touch_products_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_products_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  item_count integer not null default 0,
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit_price numeric(10, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.orders to authenticated;
grant update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant all on public.orders, public.order_items to service_role;

drop policy if exists "read_own_or_admin_orders" on public.orders;
create policy "read_own_or_admin_orders" on public.orders for select
  to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_update_orders" on public.orders;
create policy "admin_update_orders" on public.orders for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read_own_order_items" on public.order_items;
create policy "read_own_order_items" on public.order_items for select
  to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Atomic order creation: validates stock and prices server-side, then writes
-- the order, its items and the stock decrements in a single transaction.
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

  insert into public.orders (
    id, user_id, customer_name, customer_email, status, total, tax, item_count, shipping_address
  ) values (
    v_order_id, v_user, v_name, v_email, 'paid', v_total, v_tax, v_count, v_address
  );

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

-- ---------------------------------------------------------------------------
-- Monitoring logs (service role only)
-- ---------------------------------------------------------------------------
create table if not exists public.api_request_logs (
  id bigserial primary key,
  method text not null,
  path text not null,
  status integer not null,
  duration_ms integer not null default 0,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists api_request_logs_created_at_idx on public.api_request_logs (created_at desc);

create table if not exists public.app_errors (
  id bigserial primary key,
  level text not null default 'error' check (level in ('error', 'warning')),
  message text not null,
  path text not null default '',
  method text not null default '',
  status integer,
  code text,
  created_at timestamptz not null default now()
);

create index if not exists app_errors_created_at_idx on public.app_errors (created_at desc);

alter table public.api_request_logs enable row level security;
alter table public.app_errors enable row level security;

revoke all on public.api_request_logs, public.app_errors from anon, authenticated;
grant all on public.api_request_logs, public.app_errors to service_role;
grant usage, select on sequence public.api_request_logs_id_seq to service_role;
grant usage, select on sequence public.app_errors_id_seq to service_role;

-- ---------------------------------------------------------------------------
-- Vector embeddings for semantic search
-- ---------------------------------------------------------------------------
create table if not exists public.product_embeddings (
  product_id uuid primary key references public.products (id) on delete cascade,
  embedding extensions.vector(1536) not null,
  source text not null default 'local-hash',
  model text,
  updated_at timestamptz not null default now()
);

alter table public.product_embeddings enable row level security;
revoke all on public.product_embeddings from anon, authenticated;
grant all on public.product_embeddings to service_role;

create or replace function public.match_products(query_embedding text, match_count integer default 24)
returns table (product_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select pe.product_id, 1 - (pe.embedding <=> query_embedding::extensions.vector) as similarity
  from public.product_embeddings pe
  join public.products p on p.id = pe.product_id and p.is_active
  order by pe.embedding <=> query_embedding::extensions.vector
  limit greatest(1, least(coalesce(match_count, 24), 100));
$$;

revoke all on function public.match_products(text, integer) from anon, authenticated;
grant execute on function public.match_products(text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Customer directory (service role only; consumed by the admin API)
-- ---------------------------------------------------------------------------
drop view if exists public.customer_directory;
create view public.customer_directory as
select
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  (select count(*) from public.orders o where o.user_id = u.id) as order_count,
  (select coalesce(sum(o.total), 0) from public.orders o
     where o.user_id = u.id and o.status in ('paid', 'shipped', 'delivered')) as lifetime_value
from auth.users u
where u.deleted_at is null;

revoke all on public.customer_directory from anon, authenticated;
grant select on public.customer_directory to service_role;

-- ---------------------------------------------------------------------------
-- Admin aggregates
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'products', (select count(*) from public.products),
    'activeProducts', (select count(*) from public.products where is_active),
    'lowStock', (select count(*) from public.products where stock > 0 and stock <= 5),
    'outOfStock', (select count(*) from public.products where stock = 0),
    'categories', (select count(*) from public.categories),
    'orders', (select count(*) from public.orders),
    'pendingOrders', (select count(*) from public.orders where status = 'pending'),
    'revenue', (select coalesce(sum(total), 0) from public.orders where status in ('paid', 'shipped', 'delivered')),
    'avgOrderValue', (select coalesce(round(avg(total), 2), 0) from public.orders where status in ('paid', 'shipped', 'delivered')),
    'customers', (select count(*) from auth.users where deleted_at is null),
    'recentOrders', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.created_at desc)
      from (select id, customer_name, customer_email, status, total, item_count, created_at
            from public.orders order by created_at desc limit 5) o
    ), '[]'::jsonb),
    'topProducts', coalesce((
      select jsonb_agg(jsonb_build_object('name', p.name, 'units', s.units, 'revenue', s.revenue) order by s.revenue desc)
      from (
        select product_id, sum(quantity) as units, sum(unit_price * quantity) as revenue
        from public.order_items group by product_id order by revenue desc limit 5
      ) s join public.products p on p.id = s.product_id
    ), '[]'::jsonb),
    'lowStockProducts', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'stock', stock) order by stock)
      from public.products where stock <= 5 and is_active
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_stats() from anon, authenticated;
grant execute on function public.admin_stats() to service_role;

create or replace function public.admin_monitor_overview(hours integer default 24)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(hours => greatest(1, least(coalesce(hours, 24), 720)));
  total bigint;
  failures bigint;
  p50 numeric;
  p95 numeric;
  avg_ms numeric;
begin
  select count(*),
         count(*) filter (where status >= 400),
         percentile_cont(0.5) within group (order by duration_ms),
         percentile_cont(0.95) within group (order by duration_ms),
         coalesce(avg(duration_ms), 0)
    into total, failures, p50, p95, avg_ms
  from public.api_request_logs
  where created_at >= since;

  return jsonb_build_object(
    'windowHours', greatest(1, least(coalesce(hours, 24), 720)),
    'totalRequests', coalesce(total, 0),
    'failedRequests', coalesce(failures, 0),
    'p50Ms', coalesce(round(p50, 1), 0),
    'p95Ms', coalesce(round(p95, 1), 0),
    'avgMs', coalesce(round(avg_ms, 1), 0),
    'byStatus', coalesce((
      select jsonb_object_agg(status::text, c)
      from (select status, count(*) c from public.api_request_logs
            where created_at >= since group by status) s
    ), '{}'::jsonb),
    'byPath', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'count', c, 'errors', e, 'avgMs', a) order by c desc)
      from (
        select path, count(*) c, count(*) filter (where status >= 400) e, round(avg(duration_ms), 1) a
        from public.api_request_logs where created_at >= since
        group by path limit 8
      ) q
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object('bucket', bucket, 'count', c, 'errors', e, 'avgMs', a) order by bucket)
      from (
        select date_trunc('hour', created_at) as bucket,
               count(*) c,
               count(*) filter (where status >= 400) e,
               round(avg(duration_ms), 1) a
        from public.api_request_logs where created_at >= since
        group by 1
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_monitor_overview(integer) from anon, authenticated;
grant execute on function public.admin_monitor_overview(integer) to service_role;

-- Make PostgREST pick up the new tables/views/functions immediately.
notify pgrst, 'reload schema';
