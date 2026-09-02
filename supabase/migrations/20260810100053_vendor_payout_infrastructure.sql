-- Private vendor banking and weekly payout records used by the trusted API.
-- Banking fields deliberately do not live on public.vendors because that
-- table has a public read policy for marketplace discovery.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.vendor_bank_details (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  bank_name varchar(100) not null,
  account_holder varchar(255) not null,
  account_number varchar(50) not null,
  branch_code varchar(20) not null,
  account_type varchar(20) not null check (account_type in ('savings', 'cheque', 'current')),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  week_start date not null,
  week_end date not null check (week_end >= week_start),
  total_amount numeric(10, 2) not null check (total_amount > 0),
  order_count integer not null default 0 check (order_count >= 0),
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'approved', 'processing', 'paid', 'rejected')),
  bank_name varchar(100),
  account_holder varchar(255),
  account_number varchar(50),
  branch_code varchar(20),
  account_type varchar(20),
  admin_notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, week_start)
);

create index if not exists idx_vendor_payouts_vendor_week
  on public.vendor_payouts(vendor_id, week_start desc);
create index if not exists idx_vendor_payouts_status_created
  on public.vendor_payouts(status, created_at desc);

alter table public.vendor_bank_details enable row level security;
alter table public.vendor_payouts enable row level security;

revoke all on table public.vendor_bank_details from anon, authenticated;
revoke all on table public.vendor_payouts from anon, authenticated;
grant all on table public.vendor_bank_details to service_role;
grant all on table public.vendor_payouts to service_role;

commit;
