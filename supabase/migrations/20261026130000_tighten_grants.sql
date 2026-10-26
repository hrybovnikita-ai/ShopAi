/*
# Tighten table grants

The `supabase/postgres` image ships default privileges that hand every
privilege on new tables to `anon` and `authenticated`. RLS policies are what
actually gate rows, but there is no reason for an anonymous visitor to hold
INSERT/UPDATE/DELETE/TRUNCATE grants at all.

This migration strips the blanket grants and restores exactly what the public
schema needs. The API service keeps working unchanged because it connects with
the service role.
*/

-- Anonymous visitors only read the public catalog and its aggregates.
revoke all on public.products from anon;
revoke all on public.categories from anon;
revoke all on public.product_review_stats from anon;
revoke all on public.product_popularity from anon;
revoke all on public.product_reviews from anon;
revoke all on public.wishlists from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.admin_users from anon;
revoke all on public.contact_messages from anon;
revoke all on public.schema_migrations from anon;

grant select on public.products to anon;
grant select on public.categories to anon;
grant select on public.product_review_stats to anon;
grant select on public.product_popularity to anon;
grant select on public.product_reviews to anon;

-- Signed-in customers keep only the privileges their policies need.
revoke all on public.products from authenticated;
revoke all on public.categories from authenticated;
revoke all on public.product_review_stats from authenticated;
revoke all on public.product_popularity from authenticated;
revoke all on public.product_reviews from authenticated;
revoke all on public.wishlists from authenticated;
revoke all on public.orders from authenticated;
revoke all on public.order_items from authenticated;
revoke all on public.admin_users from authenticated;
revoke all on public.contact_messages from authenticated;
revoke all on public.schema_migrations from authenticated;

grant select on public.products to authenticated;
grant insert, update, delete on public.products to authenticated; -- policy: admin only
grant select on public.categories to authenticated;
grant insert, update, delete on public.categories to authenticated; -- policy: admin only
grant select on public.product_review_stats to authenticated;
grant select on public.product_popularity to authenticated;

grant select on public.product_reviews to authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
grant select, insert, delete on public.wishlists to authenticated;
grant select, update on public.orders to authenticated; -- policies: own rows / admin
grant select on public.order_items to authenticated;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.contact_messages to authenticated;

-- Service role (the API) remains unrestricted.
grant all on public.products, public.categories, public.product_review_stats,
  public.product_popularity, public.product_reviews, public.wishlists,
  public.orders, public.order_items, public.admin_users, public.contact_messages,
  public.schema_migrations to service_role;
