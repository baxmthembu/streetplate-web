-- Run on staging after payfast-atomic-processing.sql.
-- Read-only verification: raises an exception when a required safety property is missing.

do $$
begin
  if to_regclass('public.vendor_wallets') is null then
    raise exception 'vendor_wallets was not created';
  end if;
  if to_regclass('public.vendor_wallet_entries') is null then
    raise exception 'vendor_wallet_entries was not created';
  end if;
  if to_regprocedure(
    'public.process_payfast_payment(uuid,numeric,text,timestamp with time zone,numeric,numeric)'
  ) is null then
    raise exception 'process_payfast_payment was not created';
  end if;
  if not (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.vendor_wallets'::regclass
  ) then
    raise exception 'RLS is disabled on vendor_wallets';
  end if;
  if not (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.vendor_wallet_entries'::regclass
  ) then
    raise exception 'RLS is disabled on vendor_wallet_entries';
  end if;
  if has_function_privilege(
    'anon',
    'public.process_payfast_payment(uuid,numeric,text,timestamp with time zone,numeric,numeric)',
    'execute'
  ) then
    raise exception 'anon can execute process_payfast_payment';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.process_payfast_payment(uuid,numeric,text,timestamp with time zone,numeric,numeric)',
    'execute'
  ) then
    raise exception 'authenticated can execute process_payfast_payment';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.process_payfast_payment(uuid,numeric,text,timestamp with time zone,numeric,numeric)',
    'execute'
  ) then
    raise exception 'service_role cannot execute process_payfast_payment';
  end if;
  if has_table_privilege('anon', 'public.vendor_wallets', 'select')
     or has_table_privilege('authenticated', 'public.vendor_wallets', 'select')
     or has_table_privilege('anon', 'public.vendor_wallet_entries', 'select')
     or has_table_privilege('authenticated', 'public.vendor_wallet_entries', 'select') then
    raise exception 'financial tables are readable by a client role';
  end if;
  if not has_table_privilege('service_role', 'public.vendor_wallets', 'select,insert,update,delete')
     or not has_table_privilege('service_role', 'public.vendor_wallet_entries', 'select,insert,update,delete') then
    raise exception 'service_role is missing financial table privileges';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_proc
    where oid = 'public.process_payfast_payment(uuid,numeric,text,timestamp with time zone,numeric,numeric)'::regprocedure
      and prosecdef
      and proconfig @> array['search_path=""']
  ) then
    raise exception 'process_payfast_payment is not a hardened security-definer function';
  end if;
end;
$$;

select 'payfast atomic processing verification passed' as result;
