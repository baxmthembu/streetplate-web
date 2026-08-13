-- Transactional staging contract test. All fixtures are rolled back.

begin;

do $$
declare
  v_driver uuid := gen_random_uuid();
  v_earning uuid;
  v_payout uuid;
  duplicate_rejected boolean := false;
  invalid_status_rejected boolean := false;
begin
  insert into public.users(id, email, password_hash, name, role)
  values (
    v_driver,
    'payout-driver@example.invalid',
    'staging-only',
    'Payout Driver',
    'driver'
  );

  insert into public.driver_wallets(
    driver_id, pending_balance, lifetime_earnings, total_tips,
    total_bonuses, total_deliveries
  ) values (v_driver, 92.50, 92.50, 10.00, 5.00, 3);

  insert into public.driver_payouts(
    driver_id, week_start, week_end, total_amount, delivery_fee_total,
    distance_fee_total, tips_total, bonuses_total, commission_total,
    delivery_count, status, bank_name, account_holder, account_number,
    branch_code, account_type
  ) values (
    v_driver, date '2026-08-03', date '2026-08-09', 92.50, 90.00,
    90.00, 10.00, 5.00, 12.50, 3, 'pending', 'Test Bank',
    'Payout Driver', '0000000000', '000000', 'savings'
  ) returning id into v_payout;

  insert into public.driver_earnings(
    driver_id, amount, delivery_fee_amount, distance_km, distance_fee,
    tip_amount, bonus_amount, platform_commission, net_payout, status,
    payout_id
  ) values (
    v_driver, 92.50, 90.00, 6.00, 90.00, 10.00, 5.00, 12.50,
    92.50, 'processed', v_payout
  ) returning id into v_earning;

  insert into public.driver_bonuses(
    driver_id, bonus_type, amount, reason, status
  ) values (v_driver, 'weekend', 5.00, 'Staging payout test', 'credited');

  if not exists (
    select 1
    from public.driver_payouts
    where id = v_payout
      and driver_id = v_driver
      and total_amount = 92.50
      and delivery_count = 3
      and status = 'pending'
  ) then
    raise exception 'driver payout history row was not stored';
  end if;

  if not exists (
    select 1
    from public.driver_earnings
    where id = v_earning
      and payout_id = v_payout
      and status = 'processed'
  ) then
    raise exception 'driver earnings were not linked to the payout';
  end if;

  -- Mirrors the weekly service's pending-to-available wallet movement.
  update public.driver_wallets
  set pending_balance = 0,
      available_balance = 92.50,
      updated_at = now()
  where driver_id = v_driver;

  if not exists (
    select 1
    from public.driver_wallets
    where driver_id = v_driver
      and pending_balance = 0
      and available_balance = 92.50
  ) then
    raise exception 'driver wallet payout movement failed';
  end if;

  -- Mirrors the admin approval and paid lifecycle used by the Railway API.
  update public.driver_payouts
  set status = 'approved', processed_at = now(), updated_at = now()
  where id = v_payout;
  update public.driver_payouts
  set status = 'paid', paid_at = now(), updated_at = now()
  where id = v_payout;

  if not exists (
    select 1
    from public.driver_payouts
    where id = v_payout
      and status = 'paid'
      and processed_at is not null
      and paid_at is not null
  ) then
    raise exception 'admin payout lifecycle failed';
  end if;

  begin
    insert into public.driver_payouts(
      driver_id, week_start, week_end, total_amount
    ) values (v_driver, date '2026-08-03', date '2026-08-09', 1.00);
  exception when unique_violation then
    duplicate_rejected := true;
  end;
  if not duplicate_rejected then
    raise exception 'duplicate weekly payout was not rejected';
  end if;

  begin
    insert into public.driver_payouts(
      driver_id, week_start, week_end, total_amount, status
    ) values (
      v_driver, date '2026-08-10', date '2026-08-16', 1.00, 'invalid'
    );
  exception when check_violation then
    invalid_status_rejected := true;
  end;
  if not invalid_status_rejected then
    raise exception 'invalid payout status was not rejected';
  end if;
end;
$$;

rollback;
