-- PROPOSAL ONLY — NOT APPLIED
-- Generated after the 2026-07-31 Supabase Security and Performance Advisor review.
-- Additive contract impact: none. Authenticated ownership semantics are preserved;
-- service-role backend access continues to bypass RLS.

begin;

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

commit;

-- Deliberately excluded pending platform/extension review:
-- * public.spatial_ref_sys and the public PostGIS extension
-- * PostGIS-owned st_estimatedextent overloads
-- * leaked-password protection (Dashboard/Auth configuration, not SQL)
