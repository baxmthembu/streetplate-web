-- Read-only verification for the private vendor payout infrastructure.

do $$
begin
  if to_regclass('public.vendor_bank_details') is null then
    raise exception 'vendor_bank_details was not created';
  end if;
  if to_regclass('public.vendor_payouts') is null then
    raise exception 'vendor_payouts was not created';
  end if;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vendors'
      and column_name in (
        'bank_name', 'account_holder', 'account_number', 'branch_code',
        'account_type', 'bank_details_updated_at'
      )
  ) then
    raise exception 'bank details were added to the publicly readable vendors table';
  end if;
  if has_table_privilege('anon', 'public.vendor_bank_details', 'select')
     or has_table_privilege('authenticated', 'public.vendor_bank_details', 'select')
     or has_table_privilege('anon', 'public.vendor_payouts', 'select')
     or has_table_privilege('authenticated', 'public.vendor_payouts', 'select') then
    raise exception 'private payout tables are readable by a client role';
  end if;
  if not has_table_privilege(
    'service_role', 'public.vendor_bank_details', 'select,insert,update,delete'
  ) or not has_table_privilege(
    'service_role', 'public.vendor_payouts', 'select,insert,update,delete'
  ) then
    raise exception 'service_role is missing vendor payout privileges';
  end if;
  if not (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.vendor_bank_details'::regclass
  ) or not (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.vendor_payouts'::regclass
  ) then
    raise exception 'RLS is not enabled on private payout tables';
  end if;
end;
$$;

select 'vendor payout infrastructure verification passed' as result;
