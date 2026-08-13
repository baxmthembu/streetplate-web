-- Read-only post-application verification for StreetPlate Staging.

with protected_tables(table_name) as (values
  ('driver_earnings'),
  ('menu_categories'),
  ('menu_items'),
  ('order_items'),
  ('orders'),
  ('payments'),
  ('users'),
  ('vendors')
)
select
  table_name,
  has_table_privilege('anon', format('public.%I', table_name), 'SELECT') as anon_can_select,
  has_table_privilege('anon', format('public.%I', table_name), 'INSERT') or
    has_table_privilege('anon', format('public.%I', table_name), 'UPDATE') or
    has_table_privilege('anon', format('public.%I', table_name), 'DELETE') as anon_can_write,
  has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') as authenticated_can_select,
  has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT') or
    has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE') or
    has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE') as authenticated_can_write,
  has_table_privilege('service_role', format('public.%I', table_name), 'SELECT') and
    has_table_privilege('service_role', format('public.%I', table_name), 'INSERT') and
    has_table_privilege('service_role', format('public.%I', table_name), 'UPDATE') and
    has_table_privilege('service_role', format('public.%I', table_name), 'DELETE') as service_role_full_crud
from protected_tables
order by table_name;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and policyname in (
    'users_own_access',
    'orders_own_access',
    'order_items_own_access',
    'payments_own_access'
  )
order by tablename, policyname;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
