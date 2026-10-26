/*
# Catalog, reviews and wishlist

1. Products
- `brand` — optional manufacturer/brand used by the catalog filters. Existing
  seeded products are backfilled from a fixed map; unknown products keep NULL so
  nothing is invented.

2. New Tables
- `product_reviews` — one review per customer per product. `verified_purchase`
  is computed by a trigger from real paid/shipped/delivered orders, never from
  client input. `status` supports administrator moderation.
- `wishlists` — owner-scoped favourites, one row per customer/product.

3. Views
- `product_review_stats` — published-review average, count and star
  distribution per product.
- `product_popularity` — units actually sold per product (aggregate only).

4. Security
- Reviews: public read of published rows, owners manage their own row, admins
  may moderate any row.
- Wishlists: strictly owner-scoped; nobody can read or change another customer's
  favourites.
*/

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists brand text;

update public.products p
set brand = m.brand
from (values
  ('Aurora Wireless Headphones', 'Aurora'),
  ('Nebula Pro Smartphone', 'Nebula'),
  ('PixelCam Neo', 'PixelCam'),
  ('Quantum Gaming Laptop', 'Quantum'),
  ('AeroBook Air 13', 'AeroBook'),
  ('NovaBook Air 14', 'NovaBook'),
  ('AeroBook Pro 15 Gaming', 'AeroBook'),
  ('Vortex VR Headset', 'Vortex'),
  ('Pulse Smartwatch X', 'Pulse'),
  ('EcoFlow Smart Speaker', 'EcoFlow'),
  ('Lumina 4K Monitor', 'Lumina'),
  ('Zenith Mechanical Keyboard', 'Zenith'),
  ('CodeType Compact Keyboard', 'CodeType'),
  ('StudioCam 4K', 'StudioCam')
) as m(name, brand)
where p.name = m.name and p.brand is null;

create index if not exists products_brand_idx on public.products (brand);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'ShopAi customer',
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 10 and 4000),
  images jsonb not null default '[]'::jsonb
    check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 3),
  verified_purchase boolean not null default false,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);
create index if not exists product_reviews_user_idx
  on public.product_reviews (user_id);

alter table public.product_reviews enable row level security;

grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
grant all on public.product_reviews to service_role;

drop policy if exists "read_published_reviews" on public.product_reviews;
create policy "read_published_reviews" on public.product_reviews for select
  to anon, authenticated
  using (status = 'published' or user_id = auth.uid() or public.is_admin());

drop policy if exists "insert_own_review" on public.product_reviews;
create policy "insert_own_review" on public.product_reviews for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists "update_own_review" on public.product_reviews;
create policy "update_own_review" on public.product_reviews for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "delete_own_review" on public.product_reviews;
create policy "delete_own_review" on public.product_reviews for delete
  to authenticated using (user_id = auth.uid() or public.is_admin());

-- Verified-purchase flag and moderation guard. `verified_purchase` can only
-- come from this trigger, which reads the order history of the review author.
create or replace function public.product_reviews_guard()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'A review cannot be moved to another author' using errcode = '42501';
  end if;

  if new.body ~* '(https?://|www\.)' or new.body ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' then
    raise exception 'Reviews cannot contain links or contact details.' using errcode = '22023';
  end if;

  new.verified_purchase := exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = new.user_id
      and oi.product_id = new.product_id
      and o.status in ('paid', 'shipped', 'delivered')
  );

  -- Customers cannot self-approve a hidden review; administrators change
  -- moderation state, and a new review always starts published. The API also
  -- moderates with the service-role key, where auth.uid() is NULL — check the
  -- JWT role claim so a service-role update is not reverted here.
  if not (
    public.is_admin()
    or coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      ''
    ) = 'service_role'
  ) then
    new.status := case when tg_op = 'UPDATE' then old.status else 'published' end;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists product_reviews_guard on public.product_reviews;
create trigger product_reviews_guard
  before insert or update on public.product_reviews
  for each row execute function public.product_reviews_guard();

-- ---------------------------------------------------------------------------
-- Wishlist
-- ---------------------------------------------------------------------------
create table if not exists public.wishlists (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists wishlists_user_idx on public.wishlists (user_id);

alter table public.wishlists enable row level security;

grant select, insert, delete on public.wishlists to authenticated;
grant all on public.wishlists to service_role;

drop policy if exists "read_own_wishlist" on public.wishlists;
create policy "read_own_wishlist" on public.wishlists for select
  to authenticated using (user_id = auth.uid());

drop policy if exists "insert_own_wishlist" on public.wishlists;
create policy "insert_own_wishlist" on public.wishlists for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists "delete_own_wishlist" on public.wishlists;
create policy "delete_own_wishlist" on public.wishlists for delete
  to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Aggregates
-- ---------------------------------------------------------------------------
create or replace view public.product_review_stats
with (security_invoker = true) as
select
  product_id,
  round(avg(rating)::numeric, 1)::float8 as rating_avg,
  count(*)::int as review_count,
  jsonb_build_object(
    '5', count(*) filter (where rating = 5),
    '4', count(*) filter (where rating = 4),
    '3', count(*) filter (where rating = 3),
    '2', count(*) filter (where rating = 2),
    '1', count(*) filter (where rating = 1)
  ) as rating_distribution
from public.product_reviews
where status = 'published'
group by product_id;

grant select on public.product_review_stats to anon, authenticated, service_role;

-- Only aggregate sales numbers leave this view, never individual orders.
create or replace view public.product_popularity as
select oi.product_id, coalesce(sum(oi.quantity), 0)::int as units_sold
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.status in ('paid', 'shipped', 'delivered')
group by oi.product_id;

grant select on public.product_popularity to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Category coverage for the catalog page
-- ---------------------------------------------------------------------------
insert into public.categories (name, description, icon)
values
  ('Fashion', 'Everyday apparel and footwear with a technical edge.', 'Shirt'),
  ('Home', 'Lighting, scent and objects that make a room.', 'House')
on conflict (name) do nothing;

insert into public.products (id, name, description, price, image_url, rating, category, stock, features, brand) values
  (
    '0a7f7c11-2222-4a22-8a22-000000000001',
    'Nimbus Tech Fleece Jacket',
    'A weather-resistant technical fleece with a high collar, zip pockets and a tailored everyday cut.',
    129.00,
    'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.5, 'Fashion', 40,
    ARRAY['Water-repellent', 'Fleece lining', 'Zip pockets', 'Machine washable'],
    'Nimbus'
  ),
  (
    '0a7f7c11-2222-4a22-8a22-000000000002',
    'Vertex Everyday Sneakers',
    'Lightweight knit sneakers with a cushioned midsole and a clean silhouette that works all day.',
    89.00,
    'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.4, 'Fashion', 55,
    ARRAY['Knit upper', 'Cushioned midsole', 'Breathable', 'Unisex fit'],
    'Vertex'
  ),
  (
    '0a7f7c11-2222-4a22-8a22-000000000003',
    'Halo Ambient Floor Lamp',
    'A dimmable floor lamp with warm-to-cool LED tuning and a soft halo diffuser for living spaces.',
    149.00,
    'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.6, 'Home', 25,
    ARRAY['Dimmable', 'Warm-to-cool LED', 'Halo diffuser', 'Foot switch'],
    'Halo'
  ),
  (
    '0a7f7c11-2222-4a22-8a22-000000000004',
    'Terra Ceramic Diffuser',
    'A hand-glazed ceramic diffuser with a whisper-quiet mist and an eight-hour timer.',
    49.00,
    'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=800',
    4.3, 'Home', 60,
    ARRAY['Hand-glazed ceramic', '8h timer', 'Whisper-quiet', 'Auto shut-off'],
    'Terra'
  )
on conflict (id) do nothing;
