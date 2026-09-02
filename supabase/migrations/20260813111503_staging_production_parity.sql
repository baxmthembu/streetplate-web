-- Staging-only production schema parity for StreetPlate.
-- This migration creates structure only. It copies no production rows.

begin;

create extension if not exists postgis with schema public;

do $$ begin
  create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_target as enum ('vendor', 'driver');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.promotion_type as enum ('percentage', 'bogo', 'fixed_amount', 'happy_hour');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.schedule_entity_type as enum ('menu_item', 'promotion', 'combo');
exception when duplicate_object then null;
end $$;

create table if not exists public.driver_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  wallet_balance numeric(10,2) default 0,
  rating numeric(2,1) default 5.0,
  total_deliveries integer default 0,
  total_reviews integer default 0,
  vehicle_type varchar(50) default 'motorcycle',
  expo_push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  bank_name varchar(100),
  account_holder varchar(255),
  account_number varchar(50),
  branch_code varchar(20),
  account_type varchar(20) default 'savings',
  bank_details_updated_at timestamptz
);
create index if not exists idx_driver_profiles_user on public.driver_profiles(user_id);

create table if not exists public.driver_locations (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid unique references public.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  is_online boolean default false,
  heading double precision,
  speed double precision,
  updated_at timestamptz default now(),
  last_location_at timestamptz,
  last_latitude double precision,
  last_longitude double precision
);
create index if not exists idx_driver_loc_online on public.driver_locations(is_online);
create index if not exists idx_driver_loc_coords on public.driver_locations(latitude, longitude);

create table if not exists public.delivery_offers (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid not null references public.users(id) on delete cascade,
  status public.offer_status default 'pending',
  payout_amount numeric(10,2) not null,
  distance_km numeric(8,2),
  vendor_lat double precision,
  vendor_lng double precision,
  delivery_lat double precision,
  delivery_lng double precision,
  expires_at timestamptz not null,
  attempt_number integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_delivery_offers_order on public.delivery_offers(order_id);
create index if not exists idx_delivery_offers_driver on public.delivery_offers(driver_id, status);
create unique index if not exists idx_one_pending_offer_per_order
  on public.delivery_offers(order_id) where status = 'pending';

create table if not exists public.saved_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  label varchar(50) default 'Home',
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_default boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_saved_addresses_user on public.saved_addresses(user_id);

create table if not exists public.favorite_vendors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, vendor_id)
);
create index if not exists idx_favorite_vendors_user on public.favorite_vendors(user_id);
create index if not exists idx_fk_favorite_vendors_vendor_id on public.favorite_vendors(vendor_id);

create table if not exists public.favorite_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, menu_item_id)
);
create index if not exists idx_favorite_items_user on public.favorite_items(user_id);
create index if not exists idx_fk_favorite_items_menu_item_id on public.favorite_items(menu_item_id);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  title varchar(255) not null,
  message text not null,
  type varchar(50),
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id),
  reviewer_id uuid references public.users(id),
  target_id uuid not null,
  target_type public.review_target not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  vendor_response text,
  vendor_responded_at timestamptz
);
create index if not exists idx_reviews_target on public.reviews(target_id, target_type);
create index if not exists idx_reviews_reviewer on public.reviews(reviewer_id);
create unique index if not exists idx_reviews_one_per_order_target
  on public.reviews(order_id, target_type, reviewer_id);

create table if not exists public.promotions (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title varchar(255) not null,
  description text,
  type public.promotion_type not null default 'percentage',
  discount_value numeric(10,2) not null default 0,
  menu_item_ids uuid[] default '{}',
  banner_url text,
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_promotions_vendor on public.promotions(vendor_id, is_active);

create table if not exists public.combo_meals (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name varchar(255) not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_combo_meals_vendor on public.combo_meals(vendor_id);

create table if not exists public.combo_meal_items (
  id uuid default gen_random_uuid() primary key,
  combo_id uuid not null references public.combo_meals(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  quantity integer not null default 1,
  unique(combo_id, menu_item_id)
);
create index if not exists idx_fk_combo_meal_items_menu_item_id on public.combo_meal_items(menu_item_id);

create table if not exists public.menu_item_inventory (
  menu_item_id uuid primary key references public.menu_items(id) on delete cascade,
  stock_qty integer default 0,
  low_stock_threshold integer default 5,
  track_inventory boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.availability_schedules (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  entity_type public.schedule_entity_type not null,
  entity_id uuid not null,
  day_of_week integer check (day_of_week >= 0 and day_of_week <= 6),
  start_time time,
  end_time time,
  created_at timestamptz default now()
);
create index if not exists idx_availability_entity
  on public.availability_schedules(entity_type, entity_id);
create index if not exists idx_fk_availability_schedules_vendor_id
  on public.availability_schedules(vendor_id);

create table if not exists public.vendor_analytics_daily (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  date date not null,
  orders_count integer default 0,
  revenue numeric(12,2) default 0,
  avg_rating numeric(2,1),
  unique(vendor_id, date)
);
create index if not exists idx_vendor_analytics_vendor_date
  on public.vendor_analytics_daily(vendor_id, date desc);

create table if not exists public.order_tips (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  customer_id uuid references public.users(id),
  amount numeric(10,2) not null,
  status varchar(20) default 'pending',
  created_at timestamptz default now()
);
create index if not exists idx_order_tips_order on public.order_tips(order_id);
create index if not exists idx_fk_order_tips_customer_id on public.order_tips(customer_id);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  sender_role text not null check (sender_role in ('customer', 'driver')),
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'call_request', 'call_ended')),
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_messages_order_id_created on public.messages(order_id, created_at desc);
create index if not exists idx_messages_sender_read on public.messages(order_id, sender_id, is_read);
create index if not exists idx_fk_messages_sender_id on public.messages(sender_id);

create table if not exists public.token_blacklist (
  id uuid default gen_random_uuid() primary key,
  token_hash text not null unique,
  user_id uuid references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists idx_token_blacklist_hash on public.token_blacklist(token_hash);
create index if not exists idx_token_blacklist_expires on public.token_blacklist(expires_at);
create index if not exists idx_fk_token_blacklist_user_id on public.token_blacklist(user_id);

create table if not exists public.user_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  supabase_session_id text unique,
  device_info text,
  ip_address text,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);
create index if not exists idx_user_sessions_user on public.user_sessions(user_id);
create index if not exists idx_user_sessions_supabase on public.user_sessions(supabase_session_id);

-- Keep timestamp behavior aligned with production.
do $$ begin
  create trigger update_driver_profiles_updated_at before update on public.driver_profiles
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null;
end $$;
do $$ begin
  create trigger update_driver_locations_updated_at before update on public.driver_locations
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null;
end $$;
do $$ begin
  create trigger update_delivery_offers_updated_at before update on public.delivery_offers
    for each row execute function public.update_updated_at_column();
exception when duplicate_object then null;
end $$;

-- New public-schema tables are not auto-exposed on current Supabase projects.
-- Explicit grants retain the hardened model: public catalog reads, authenticated
-- owner reads, and all writes through the trusted service-role backend.
grant select on public.availability_schedules, public.combo_meal_items,
  public.combo_meals, public.menu_item_inventory, public.promotions,
  public.reviews to anon, authenticated;
grant select on public.delivery_offers, public.driver_locations,
  public.driver_profiles, public.favorite_items, public.favorite_vendors,
  public.messages, public.notifications, public.order_tips,
  public.saved_addresses, public.user_sessions to authenticated;
grant all privileges on public.availability_schedules, public.combo_meal_items,
  public.combo_meals, public.delivery_offers, public.driver_locations,
  public.driver_profiles, public.favorite_items, public.favorite_vendors,
  public.menu_item_inventory, public.messages, public.notifications,
  public.order_tips, public.promotions, public.reviews,
  public.saved_addresses, public.token_blacklist, public.user_sessions,
  public.vendor_analytics_daily to service_role;

alter table public.driver_profiles enable row level security;
alter table public.driver_locations enable row level security;
alter table public.delivery_offers enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.favorite_vendors enable row level security;
alter table public.favorite_items enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.promotions enable row level security;
alter table public.combo_meals enable row level security;
alter table public.combo_meal_items enable row level security;
alter table public.menu_item_inventory enable row level security;
alter table public.availability_schedules enable row level security;
alter table public.vendor_analytics_daily enable row level security;
alter table public.order_tips enable row level security;
alter table public.messages enable row level security;
alter table public.token_blacklist enable row level security;
alter table public.user_sessions enable row level security;

create policy availability_schedules_public_read on public.availability_schedules for select to anon, authenticated using (true);
create policy combo_meal_items_public_read on public.combo_meal_items for select to anon, authenticated using (true);
create policy combo_meals_public_read on public.combo_meals for select to anon, authenticated using (true);
create policy menu_item_inventory_public_read on public.menu_item_inventory for select to anon, authenticated using (true);
create policy promotions_public_read on public.promotions for select to anon, authenticated using (true);
create policy reviews_public_read on public.reviews for select to anon, authenticated using (true);

create policy driver_profiles_own_access on public.driver_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy driver_locations_own_access on public.driver_locations for all to authenticated
  using ((select auth.uid()) = driver_id) with check ((select auth.uid()) = driver_id);
create policy favorite_items_own_access on public.favorite_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy favorite_vendors_own_access on public.favorite_vendors for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notifications_own_access on public.notifications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy saved_addresses_own_access on public.saved_addresses for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_sessions_own_access on public.user_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy delivery_offers_own_access on public.delivery_offers for select to authenticated
  using ((select auth.uid()) = driver_id);
create policy order_tips_own_access on public.order_tips for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy reviews_own_insert on public.reviews for insert to authenticated
  with check ((select auth.uid()) = reviewer_id);
create policy messages_insert_own on public.messages for insert to authenticated
  with check ((select auth.uid()) = sender_id);
create policy messages_read_own_order on public.messages for select to authenticated
  using (
    (select auth.uid()) = sender_id
    or exists (
      select 1 from public.orders
      where orders.id = messages.order_id
        and (orders.customer_id = (select auth.uid()) or orders.driver_id = (select auth.uid()))
    )
  );

-- Realtime scope is deliberately limited to user-facing live workflow tables.
do $$
declare relation_name text;
begin
  foreach relation_name in array array[
    'orders', 'delivery_offers', 'driver_locations', 'messages', 'notifications'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = relation_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', relation_name);
    end if;
  end loop;
end $$;

commit;
