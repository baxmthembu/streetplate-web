-- PROPOSAL ONLY — rollback for rls-security-performance.sql.
-- Restores the existing PUBLIC policy targets and pre-optimization expressions.

begin;

alter policy users_own_access on public.users to public using (auth.uid() = id) with check (auth.uid() = id);
alter policy driver_profiles_own_access on public.driver_profiles to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter policy driver_locations_own_access on public.driver_locations to public using (auth.uid() = driver_id) with check (auth.uid() = driver_id);
alter policy favorite_items_own_access on public.favorite_items to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter policy favorite_vendors_own_access on public.favorite_vendors to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter policy notifications_own_access on public.notifications to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter policy saved_addresses_own_access on public.saved_addresses to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter policy user_sessions_own_access on public.user_sessions to public using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter policy delivery_offers_own_access on public.delivery_offers to public using (auth.uid() = driver_id);
alter policy driver_earnings_own_access on public.driver_earnings to public using (auth.uid() = driver_id);
alter policy order_tips_own_access on public.order_tips to public using (auth.uid() = customer_id);
alter policy orders_own_access on public.orders to public using ((auth.uid() = customer_id) or (auth.uid() = driver_id));
alter policy order_items_own_access on public.order_items to public using (exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.customer_id = auth.uid() or orders.driver_id = auth.uid())));
alter policy payments_own_access on public.payments to public using (exists (select 1 from public.orders where orders.id = payments.order_id and orders.customer_id = auth.uid()));
alter policy reviews_own_insert on public.reviews to public with check (auth.uid() = reviewer_id);
alter policy messages_insert_own on public.messages to public with check (auth.uid() = sender_id);
alter policy messages_read_own_order on public.messages to public using (auth.uid() = sender_id or exists (select 1 from public.orders where orders.id = messages.order_id and (orders.customer_id = auth.uid() or orders.driver_id = auth.uid())));

grant execute on function public.rls_auto_enable() to public;

commit;
