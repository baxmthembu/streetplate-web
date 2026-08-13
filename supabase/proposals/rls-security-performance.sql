-- PROPOSAL ONLY — NOT APPLIED
-- Generated after the 2026-07-31 Supabase Security and Performance Advisor review.
-- Additive contract impact: none. Authenticated ownership semantics are preserved;
-- service-role backend access continues to bypass RLS.

begin;

-- Remove write privileges that the Data API roles do not need. Existing RLS
-- policies still decide which rows are visible/readable; service_role backend
-- access and table/column names are unchanged.
revoke insert, update, delete, truncate, references, trigger
  on table public.availability_schedules,
           public.combo_meal_items,
           public.combo_meals,
           public.delivery_offers,
           public.driver_earnings,
           public.driver_locations,
           public.driver_profiles,
           public.favorite_items,
           public.favorite_vendors,
           public.menu_categories,
           public.menu_item_inventory,
           public.menu_items,
           public.messages,
           public.notifications,
           public.order_items,
           public.order_tips,
           public.orders,
           public.payments,
           public.promotions,
           public.reviews,
           public.saved_addresses,
           public.spatial_ref_sys,
           public.token_blacklist,
           public.user_sessions,
           public.users,
           public.vendor_analytics_daily,
           public.vendors
  from anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.availability_schedules,
           public.combo_meal_items,
           public.combo_meals,
           public.delivery_offers,
           public.driver_earnings,
           public.driver_locations,
           public.driver_profiles,
           public.favorite_items,
           public.favorite_vendors,
           public.menu_categories,
           public.menu_item_inventory,
           public.menu_items,
           public.messages,
           public.notifications,
           public.order_items,
           public.order_tips,
           public.orders,
           public.payments,
           public.promotions,
           public.reviews,
           public.saved_addresses,
           public.spatial_ref_sys,
           public.token_blacklist,
           public.user_sessions,
           public.users,
           public.vendor_analytics_daily,
           public.vendors
  from authenticated;

-- PostGIS maintains this lookup table. Keep SELECT available for spatial
-- operations while preventing direct Data API mutation and satisfying the
-- exposed-schema RLS requirement.
alter table public.spatial_ref_sys enable row level security;
drop policy if exists spatial_ref_sys_read on public.spatial_ref_sys;
create policy spatial_ref_sys_read on public.spatial_ref_sys
  for select to anon, authenticated using (true);

alter policy users_own_access on public.users to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
alter policy driver_profiles_own_access on public.driver_profiles to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy driver_locations_own_access on public.driver_locations to authenticated
  using ((select auth.uid()) = driver_id)
  with check ((select auth.uid()) = driver_id);
alter policy favorite_items_own_access on public.favorite_items to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy favorite_vendors_own_access on public.favorite_vendors to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy notifications_own_access on public.notifications to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy saved_addresses_own_access on public.saved_addresses to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy user_sessions_own_access on public.user_sessions to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy delivery_offers_own_access on public.delivery_offers to authenticated
  using ((select auth.uid()) = driver_id);
alter policy driver_earnings_own_access on public.driver_earnings to authenticated
  using ((select auth.uid()) = driver_id);
alter policy order_tips_own_access on public.order_tips to authenticated
  using ((select auth.uid()) = customer_id);
alter policy orders_own_access on public.orders to authenticated
  using (((select auth.uid()) = customer_id) or ((select auth.uid()) = driver_id));
alter policy order_items_own_access on public.order_items to authenticated
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.customer_id = (select auth.uid()) or orders.driver_id = (select auth.uid()))
  ));
alter policy payments_own_access on public.payments to authenticated
  using (exists (
    select 1 from public.orders
    where orders.id = payments.order_id
      and orders.customer_id = (select auth.uid())
  ));

alter policy reviews_own_insert on public.reviews to authenticated
  with check ((select auth.uid()) = reviewer_id);
alter policy messages_insert_own on public.messages to authenticated
  with check ((select auth.uid()) = sender_id);
alter policy messages_read_own_order on public.messages to authenticated
  using (
    (select auth.uid()) = sender_id
    or exists (
      select 1 from public.orders
      where orders.id = messages.order_id
        and (orders.customer_id = (select auth.uid()) or orders.driver_id = (select auth.uid()))
    )
  );

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- PostGIS-owned SECURITY DEFINER helpers are not part of the StreetPlate API.
-- Removing Data API execution does not affect SQL calls made by trusted
-- backend/database roles.
revoke execute on function public.st_estimatedextent(text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text)
  from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean)
  from public, anon, authenticated;

commit;

-- Deliberately excluded pending platform/extension review:
-- * moving the public PostGIS extension (requires a separate spatial upgrade
--   rehearsal and is not necessary to close Data API access)
-- * leaked-password protection (Dashboard/Auth configuration, not SQL)
