-- Read-only verification for the complete driver payout infrastructure.

do $$
declare
  required_column text;
begin
  if to_regclass('public.driver_earnings') is null
     or to_regclass('public.driver_wallets') is null
     or to_regclass('public.driver_payouts') is null
     or to_regclass('public.driver_bonuses') is null then
    raise exception 'one or more driver payout tables are missing';
  end if;

  foreach required_column in array array[
    'delivery_fee_amount', 'distance_km', 'distance_fee', 'tip_amount',
    'bonus_amount', 'platform_commission', 'net_payout', 'status', 'payout_id'
  ] loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'driver_earnings'
        and column_name = required_column
    ) then
      raise exception 'driver_earnings.% is missing', required_column;
    end if;
  end loop;

  if has_table_privilege('anon', 'public.driver_wallets', 'select')
     or has_table_privilege('authenticated', 'public.driver_wallets', 'select')
     or has_table_privilege('anon', 'public.driver_payouts', 'select')
     or has_table_privilege('authenticated', 'public.driver_payouts', 'select')
     or has_table_privilege('anon', 'public.driver_bonuses', 'select')
     or has_table_privilege('authenticated', 'public.driver_bonuses', 'select') then
    raise exception 'a private driver payout table is readable by a client role';
  end if;

  if not has_table_privilege('service_role', 'public.driver_wallets', 'select,insert,update,delete')
     or not has_table_privilege('service_role', 'public.driver_payouts', 'select,insert,update,delete')
     or not has_table_privilege('service_role', 'public.driver_bonuses', 'select,insert,update,delete') then
    raise exception 'service_role is missing driver payout privileges';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('driver_earnings', 'driver_wallets', 'driver_payouts', 'driver_bonuses')
      and not c.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on every driver payout table';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.driver_earnings'::regclass
      and conname = 'driver_earnings_payout_id_fkey'
  ) then
    raise exception 'driver_earnings payout foreign key is missing';
  end if;
end;
$$;

select 'driver payout infrastructure verification passed' as result;
