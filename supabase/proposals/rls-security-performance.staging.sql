-- STAGING REHEARSAL ONLY
-- Applies the compatible subset of rls-security-performance.sql to the
-- current StreetPlate Staging schema (nmxcmfkgtnhjhzmvqmrb).
-- Production-only tables/functions are deliberately not fabricated here.

begin;

revoke insert, update, delete, truncate, references, trigger
  on table public.driver_earnings,
           public.menu_categories,
           public.menu_items,
           public.order_items,
           public.orders,
           public.payments,
           public.users,
           public.vendors
  from anon, authenticated;

alter policy users_own_access on public.users to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

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

commit;
