-- STAGING-ONLY rollback proposal. Review before use: this drops all objects
-- created by the staging parity migration and any staging data in them.

begin;

alter publication supabase_realtime drop table
  public.orders,
  public.delivery_offers,
  public.driver_locations,
  public.messages,
  public.notifications;

drop table if exists public.user_sessions cascade;
drop table if exists public.token_blacklist cascade;
drop table if exists public.messages cascade;
drop table if exists public.order_tips cascade;
drop table if exists public.vendor_analytics_daily cascade;
drop table if exists public.availability_schedules cascade;
drop table if exists public.menu_item_inventory cascade;
drop table if exists public.combo_meal_items cascade;
drop table if exists public.combo_meals cascade;
drop table if exists public.promotions cascade;
drop table if exists public.reviews cascade;
drop table if exists public.notifications cascade;
drop table if exists public.favorite_items cascade;
drop table if exists public.favorite_vendors cascade;
drop table if exists public.saved_addresses cascade;
drop table if exists public.delivery_offers cascade;
drop table if exists public.driver_locations cascade;
drop table if exists public.driver_profiles cascade;

drop type if exists public.schedule_entity_type;
drop type if exists public.promotion_type;
drop type if exists public.review_target;
drop type if exists public.offer_status;
drop extension if exists postgis cascade;

commit;
