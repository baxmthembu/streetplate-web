-- Run on an isolated staging project after payfast-atomic-processing.sql.
-- All fixtures and financial writes are rolled back when the test completes.

begin;

do $$
declare
  v_customer uuid := gen_random_uuid();
  v_vendor_user uuid := gen_random_uuid();
  v_vendor uuid := gen_random_uuid();
  v_order uuid := gen_random_uuid();
  v_cancelled_order uuid := gen_random_uuid();
  v_first boolean;
  v_second boolean;
  v_rejected boolean := false;
begin
  insert into public.users(id, email, password_hash, name, role)
  values
    (v_customer, 'checkout-customer@example.invalid', 'staging-only', 'Checkout Customer', 'customer'),
    (v_vendor_user, 'checkout-vendor@example.invalid', 'staging-only', 'Checkout Vendor', 'vendor');

  insert into public.vendors(id, user_id, business_name, is_open)
  values (v_vendor, v_vendor_user, 'Checkout Test Vendor', true);

  insert into public.orders(
    id, customer_id, vendor_id, subtotal, delivery_fee, total, status,
    delivery_address
  ) values (
    v_order, v_customer, v_vendor, 85.00, 15.00, 100.00, 'pending',
    'Staging test address'
  );

  select already_processed into v_first
  from public.process_payfast_payment(
    v_order, 100.00, 'PF-STAGING-1', now(), 15.00, 85.00
  );
  if v_first then
    raise exception 'first processing incorrectly reported duplicate';
  end if;

  select already_processed into v_second
  from public.process_payfast_payment(
    v_order, 100.00, 'PF-STAGING-1', now(), 15.00, 85.00
  );
  if not v_second then
    raise exception 'duplicate processing was not detected';
  end if;

  if (
    select count(*) from public.payments
    where public.payments.order_id = v_order and status = 'completed'
  ) <> 1 then
    raise exception 'expected one completed payment';
  end if;

  if (
    select count(*) from public.vendor_wallet_entries
    where public.vendor_wallet_entries.order_id = v_order and amount = 85.00
  ) <> 1 then
    raise exception 'expected one wallet entry';
  end if;

  if not exists (
    select 1 from public.vendor_wallets
    where public.vendor_wallets.vendor_id = v_vendor
      and pending_balance = 85.00
      and lifetime_earnings = 85.00
      and total_orders = 1
  ) then
    raise exception 'wallet totals are incorrect';
  end if;

  if not exists (
    select 1 from public.orders
    where public.orders.id = v_order
      and status = 'confirmed'
      and payment_confirmed_at is not null
  ) then
    raise exception 'order was not confirmed';
  end if;

  begin
    perform * from public.process_payfast_payment(
      v_order, 99.00, 'PF-STAGING-TAMPER', now(), 14.85, 84.15
    );
  exception when sqlstate '22003' then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'amount mismatch was not rejected';
  end if;

  insert into public.orders(
    id, customer_id, vendor_id, subtotal, delivery_fee, total, status,
    delivery_address
  ) values (
    v_cancelled_order, v_customer, v_vendor, 85.00, 15.00, 100.00,
    'cancelled', 'Staging test address'
  );

  v_rejected := false;
  begin
    perform * from public.process_payfast_payment(
      v_cancelled_order, 100.00, 'PF-STAGING-CANCELLED', now(), 15.00, 85.00
    );
  exception when sqlstate 'P0001' then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'cancelled order payment was not rejected';
  end if;
end;
$$;

rollback;
