-- Explicitly close legacy default privileges on the staging parity tables.
-- RLS remains the row-level control; these grants define which relations are
-- reachable through the Data API at all.

begin;

revoke all privileges on table
  public.availability_schedules,
  public.combo_meal_items,
  public.combo_meals,
  public.delivery_offers,
  public.driver_locations,
  public.driver_profiles,
  public.favorite_items,
  public.favorite_vendors,
  public.menu_item_inventory,
  public.messages,
  public.notifications,
  public.order_tips,
  public.promotions,
  public.reviews,
  public.saved_addresses,
  public.token_blacklist,
  public.user_sessions,
  public.vendor_analytics_daily
from anon, authenticated;

grant select on table
  public.availability_schedules,
  public.combo_meal_items,
  public.combo_meals,
  public.menu_item_inventory,
  public.promotions,
  public.reviews
to anon, authenticated;

grant select on table
  public.delivery_offers,
  public.driver_locations,
  public.driver_profiles,
  public.favorite_items,
  public.favorite_vendors,
  public.messages,
  public.notifications,
  public.order_tips,
  public.saved_addresses,
  public.user_sessions
to authenticated;

grant all privileges on table
  public.availability_schedules,
  public.combo_meal_items,
  public.combo_meals,
  public.delivery_offers,
  public.driver_locations,
  public.driver_profiles,
  public.favorite_items,
  public.favorite_vendors,
  public.menu_item_inventory,
  public.messages,
  public.notifications,
  public.order_tips,
  public.promotions,
  public.reviews,
  public.saved_addresses,
  public.token_blacklist,
  public.user_sessions,
  public.vendor_analytics_daily
to service_role;

commit;
