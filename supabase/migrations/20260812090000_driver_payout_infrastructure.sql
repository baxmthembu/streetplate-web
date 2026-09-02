-- Complete driver earnings, wallet and weekly payout infrastructure used by
-- the existing Railway API. This migration is additive and preserves the
-- legacy driver_earnings columns consumed by the mobile applications.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- StreetPlate Staging was created from an older baseline that does not yet
-- contain the original driver earnings enum/table. Creating them conditionally
-- keeps this migration testable there while remaining a no-op for those base
-- objects in production.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'earning_type'
  ) then
    create type public.earning_type as enum ('delivery_fee', 'tip', 'bonus');
  end if;
end;
$$;

create table if not exists public.driver_earnings (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(10, 2) not null,
  type public.earning_type default 'delivery_fee',
  created_at timestamptz default now()
);

alter table public.driver_earnings
  add column if not exists delivery_fee_amount numeric(10, 2) default 0,
  add column if not exists distance_km numeric(8, 2) default 0,
  add column if not exists distance_fee numeric(10, 2) default 0,
  add column if not exists tip_amount numeric(10, 2) default 0,
  add column if not exists bonus_amount numeric(10, 2) default 0,
  add column if not exists platform_commission numeric(10, 2) default 0,
  add column if not exists net_payout numeric(10, 2) default 0,
  add column if not exists status varchar(20) default 'pending',
  add column if not exists payout_id uuid;

-- Preserve the value of any legacy earnings rows when introducing the richer
-- payout breakdown. Existing deployments currently have no rows, but this
-- backfill keeps the migration safe if that changes before production rollout.
update public.driver_earnings
set
  delivery_fee_amount = coalesce(delivery_fee_amount, amount, 0),
  distance_km = coalesce(distance_km, 0),
  distance_fee = coalesce(distance_fee, delivery_fee_amount, amount, 0),
  tip_amount = coalesce(tip_amount, 0),
  bonus_amount = coalesce(bonus_amount, 0),
  platform_commission = coalesce(platform_commission, 0),
  net_payout = case
    when coalesce(net_payout, 0) = 0 then coalesce(amount, 0)
    else net_payout
  end,
  status = coalesce(status, 'pending');

alter table public.driver_earnings
  alter column delivery_fee_amount set not null,
  alter column distance_km set not null,
  alter column distance_fee set not null,
  alter column tip_amount set not null,
  alter column bonus_amount set not null,
  alter column platform_commission set not null,
  alter column net_payout set not null,
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.driver_earnings'::regclass
      and conname = 'driver_earnings_status_check'
  ) then
    alter table public.driver_earnings
      add constraint driver_earnings_status_check
      check (status in ('pending', 'processed'));
  end if;
end;
$$;

create table if not exists public.driver_wallets (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null unique references public.users(id) on delete cascade,
  available_balance numeric(10, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(10, 2) not null default 0 check (pending_balance >= 0),
  lifetime_earnings numeric(10, 2) not null default 0 check (lifetime_earnings >= 0),
  total_tips numeric(10, 2) not null default 0 check (total_tips >= 0),
  total_bonuses numeric(10, 2) not null default 0 check (total_bonuses >= 0),
  total_deliveries integer not null default 0 check (total_deliveries >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_payouts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  week_end date not null check (week_end >= week_start),
  total_amount numeric(10, 2) not null check (total_amount > 0),
  delivery_fee_total numeric(10, 2) not null default 0 check (delivery_fee_total >= 0),
  distance_fee_total numeric(10, 2) not null default 0 check (distance_fee_total >= 0),
  tips_total numeric(10, 2) not null default 0 check (tips_total >= 0),
  bonuses_total numeric(10, 2) not null default 0 check (bonuses_total >= 0),
  commission_total numeric(10, 2) not null default 0 check (commission_total >= 0),
  delivery_count integer not null default 0 check (delivery_count >= 0),
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'approved', 'processing', 'paid', 'rejected')),
  bank_name varchar(100),
  account_holder varchar(255),
  account_number varchar(50),
  branch_code varchar(20),
  account_type varchar(20),
  admin_notes text,
  processed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (driver_id, week_start)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.driver_earnings'::regclass
      and conname = 'driver_earnings_payout_id_fkey'
  ) then
    alter table public.driver_earnings
      add constraint driver_earnings_payout_id_fkey
      foreign key (payout_id)
      references public.driver_payouts(id)
      on delete set null;
  end if;
end;
$$;

create table if not exists public.driver_bonuses (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  bonus_type varchar(50) not null,
  amount numeric(10, 2) not null check (amount >= 0),
  reason text,
  status varchar(20) not null default 'credited'
    check (status in ('pending', 'credited')),
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_earnings_driver
  on public.driver_earnings(driver_id, created_at desc);
create index if not exists idx_driver_earnings_order
  on public.driver_earnings(order_id);
create index if not exists idx_driver_earnings_driver_status
  on public.driver_earnings(driver_id, status, created_at desc);
create index if not exists idx_driver_earnings_payout
  on public.driver_earnings(payout_id);
create index if not exists idx_driver_wallets_driver
  on public.driver_wallets(driver_id);
create index if not exists idx_driver_payouts_driver
  on public.driver_payouts(driver_id, week_start desc);
create index if not exists idx_driver_payouts_status
  on public.driver_payouts(status, created_at desc);
create index if not exists idx_driver_bonuses_driver
  on public.driver_bonuses(driver_id, earned_at desc);
create index if not exists idx_driver_bonuses_order
  on public.driver_bonuses(order_id);

alter table public.driver_earnings enable row level security;
alter table public.driver_wallets enable row level security;
alter table public.driver_payouts enable row level security;
alter table public.driver_bonuses enable row level security;

-- Keep the existing own-earnings contract. Production already has this
-- policy; the conditional block supplies it only to an older staging baseline.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'driver_earnings'
      and policyname = 'driver_earnings_own_access'
  ) then
    create policy driver_earnings_own_access
      on public.driver_earnings
      for select
      to authenticated
      using ((select auth.uid()) = driver_id);
  end if;
end;
$$;

grant select on table public.driver_earnings to authenticated;
grant all on table public.driver_earnings to service_role;

-- Wallet, bonus and payout rows are exposed only through the authenticated
-- Railway API. Payout rows contain a bank-detail snapshot and must never be
-- directly readable with a browser/mobile publishable key.
revoke all on table public.driver_wallets from anon, authenticated;
revoke all on table public.driver_payouts from anon, authenticated;
revoke all on table public.driver_bonuses from anon, authenticated;
grant all on table public.driver_wallets to service_role;
grant all on table public.driver_payouts to service_role;
grant all on table public.driver_bonuses to service_role;

commit;
