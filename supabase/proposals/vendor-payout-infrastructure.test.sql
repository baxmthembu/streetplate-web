-- Transactional staging test. All fixtures are rolled back.

begin;

do $$
declare
  v_vendor_user uuid := gen_random_uuid();
  v_vendor uuid := gen_random_uuid();
  v_rejected boolean := false;
begin
  insert into public.users(id, email, password_hash, name, role)
  values (
    v_vendor_user,
    'payout-vendor@example.invalid',
    'staging-only',
    'Payout Vendor',
    'vendor'
  );

  insert into public.vendors(id, user_id, business_name, is_open)
  values (v_vendor, v_vendor_user, 'Payout Test Vendor', true);

  insert into public.vendor_bank_details(
    vendor_id, bank_name, account_holder, account_number, branch_code,
    account_type
  ) values (
    v_vendor, 'Test Bank', 'Payout Vendor', '0000000000', '000000',
    'savings'
  );

  insert into public.vendor_payouts(
    vendor_id, week_start, week_end, total_amount, order_count, status,
    bank_name, account_holder, account_number, branch_code, account_type
  ) values (
    v_vendor, date '2026-08-03', date '2026-08-09', 85.00, 1, 'pending',
    'Test Bank', 'Payout Vendor', '0000000000', '000000', 'savings'
  );

  if not exists (
    select 1 from public.vendor_payouts
    where vendor_id = v_vendor
      and total_amount = 85.00
      and status = 'pending'
  ) then
    raise exception 'vendor payout snapshot was not stored';
  end if;

  begin
    insert into public.vendor_payouts(
      vendor_id, week_start, week_end, total_amount, order_count, status
    ) values (
      v_vendor, date '2026-08-10', date '2026-08-16', 10.00, 0, 'invalid'
    );
  exception when check_violation then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'invalid payout status was not rejected';
  end if;
end;
$$;

rollback;
