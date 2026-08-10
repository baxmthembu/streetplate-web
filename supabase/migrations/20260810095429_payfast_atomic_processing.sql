-- Atomically records a verified PayFast payment, confirms its order and
-- credits the vendor exactly once. Existing database objects are not renamed
-- or removed; the new financial tables remain service-role-only.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.vendor_wallets (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null unique references public.vendors(id) on delete cascade,
  available_balance numeric(10, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(10, 2) not null default 0 check (pending_balance >= 0),
  lifetime_earnings numeric(10, 2) not null default 0 check (lifetime_earnings >= 0),
  total_orders integer not null default 0 check (total_orders >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_wallet_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  entry_type text not null default 'payfast_order' check (entry_type = 'payfast_order'),
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_wallet_entries_vendor_created
  on public.vendor_wallet_entries(vendor_id, created_at desc);

alter table public.vendor_wallets enable row level security;
alter table public.vendor_wallet_entries enable row level security;

-- No anon/authenticated policies are created. The service role reaches these
-- objects only through the trusted backend and bypasses RLS by design.
revoke all on table public.vendor_wallets from anon, authenticated;
revoke all on table public.vendor_wallet_entries from anon, authenticated;
grant all on table public.vendor_wallets to service_role;
grant all on table public.vendor_wallet_entries to service_role;

create or replace function public.process_payfast_payment(
  p_order_id uuid,
  p_amount numeric,
  p_pf_payment_id text,
  p_paid_at timestamptz,
  p_commission numeric,
  p_vendor_payout numeric
)
returns table (
  order_id uuid,
  customer_id uuid,
  vendor_id uuid,
  already_processed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_credit_inserted boolean := false;
  v_expected_commission numeric;
begin
  select *
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if v_order.customer_id is null or v_order.vendor_id is null then
    raise exception 'Order ownership is incomplete' using errcode = '23502';
  end if;

  if p_paid_at is null or nullif(btrim(p_pf_payment_id), '') is null then
    raise exception 'PayFast payment metadata is incomplete' using errcode = '23502';
  end if;

  if p_amount <= 0 or abs(v_order.total - p_amount) > 0.01 then
    raise exception 'Payment amount mismatch' using errcode = '22003';
  end if;

  v_expected_commission := round(p_amount * 0.15, 2);
  if p_commission < 0
     or p_vendor_payout <= 0
     or abs(p_commission - v_expected_commission) > 0.01
     or abs(p_vendor_payout - (p_amount - v_expected_commission)) > 0.01
     or abs((p_commission + p_vendor_payout) - p_amount) > 0.01 then
    raise exception 'Payment split mismatch' using errcode = '22003';
  end if;

  if v_order.status = 'cancelled'::public.order_status then
    raise exception 'Cancelled orders cannot be confirmed' using errcode = 'P0001';
  end if;

  insert into public.payments (
    order_id,
    amount,
    method,
    status,
    payfast_payment_id,
    commission,
    vendor_payout,
    paid_at
  ) values (
    p_order_id,
    p_amount,
    'payfast',
    'completed'::public.payment_status,
    p_pf_payment_id,
    p_commission,
    p_vendor_payout,
    p_paid_at
  )
  on conflict on constraint payments_order_id_key do update set
    amount = excluded.amount,
    method = excluded.method,
    status = excluded.status,
    payfast_payment_id = coalesce(public.payments.payfast_payment_id, excluded.payfast_payment_id),
    commission = excluded.commission,
    vendor_payout = excluded.vendor_payout,
    paid_at = coalesce(public.payments.paid_at, excluded.paid_at);

  insert into public.vendor_wallet_entries (order_id, vendor_id, amount)
  values (p_order_id, v_order.vendor_id, p_vendor_payout)
  on conflict on constraint vendor_wallet_entries_order_id_key do nothing
  returning true into v_credit_inserted;

  if coalesce(v_credit_inserted, false) then
    insert into public.vendor_wallets (
      vendor_id,
      pending_balance,
      lifetime_earnings,
      total_orders,
      updated_at
    ) values (
      v_order.vendor_id,
      p_vendor_payout,
      p_vendor_payout,
      1,
      now()
    )
    on conflict on constraint vendor_wallets_vendor_id_key do update set
      pending_balance = public.vendor_wallets.pending_balance + excluded.pending_balance,
      lifetime_earnings = public.vendor_wallets.lifetime_earnings + excluded.lifetime_earnings,
      total_orders = public.vendor_wallets.total_orders + 1,
      updated_at = now();
  end if;

  update public.orders
     set status = case
                    when status = 'pending'::public.order_status
                      then 'confirmed'::public.order_status
                    else status
                  end,
         payment_confirmed_at = coalesce(payment_confirmed_at, p_paid_at),
         updated_at = now()
   where id = p_order_id;

  return query
  select
    p_order_id,
    v_order.customer_id,
    v_order.vendor_id,
    not coalesce(v_credit_inserted, false);
end;
$$;

revoke all on function public.process_payfast_payment(
  uuid, numeric, text, timestamptz, numeric, numeric
) from public, anon, authenticated;
grant execute on function public.process_payfast_payment(
  uuid, numeric, text, timestamptz, numeric, numeric
) to service_role;

commit;
