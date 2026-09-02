# RLS staging rehearsal — 13 August 2026

## Result

Migration `20260813101504_rls_security_performance_staging_rehearsal` was
applied to StreetPlate Staging (`nmxcmfkgtnhjhzmvqmrb`). No production database
change was made.

The initial staging project contained only 15 public tables. It has since been
brought to schema parity without copying production data. Staging now has all
34 production public tables, identical column fingerprints for all 33
StreetPlate-owned tables, the production enum values, and PostGIS.

## Applied changes

- Removed `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`
  privileges from `anon` and `authenticated` on the eight existing shared
  tables covered by the production proposal.
- Kept `SELECT` grants so public catalogue and authenticated owned-record reads
  continue to work through RLS.
- Limited the `users`, `orders`, `order_items`, and `payments` ownership
  policies to `authenticated`.
- Preserved full `service_role` CRUD for the Railway backend and admin flows.
- Left public vendor/menu read policies unchanged.
- Added the 19 missing production tables as empty staging structures.
- Added PostGIS and its managed `spatial_ref_sys` object.
- Explicitly closed legacy default Data API grants on the new private tables.
- Registered `orders`, `delivery_offers`, `driver_locations`, `messages`, and
  `notifications` in `supabase_realtime`.

Forward, rollback, and verification SQL are stored in:

- `supabase/proposals/rls-security-performance.staging.sql`
- `supabase/proposals/rls-security-performance.staging.rollback.sql`
- `supabase/proposals/rls-security-performance.staging.verify.sql`
- `supabase/migrations/20260813111503_staging_production_parity.sql`
- `supabase/migrations/20260813122637_staging_parity_privilege_hardening.sql`
- `supabase/proposals/staging-production-parity.rollback.sql`
- `supabase/proposals/staging-production-parity.verify.sql`

## Tests completed

Transactional test fixtures were created and fully rolled back. Assertions
passed for:

- anonymous users reading public vendors/menu but not profiles or orders;
- customers reading only their profile, orders, order items, and payments;
- vendors reading their profile and public vendor catalogue record;
- drivers reading their assigned order, order items, and earnings;
- backend/admin `service_role` reading all fixture records;
- anonymous and authenticated direct writes being denied;
- full backend `service_role` CRUD remaining available;
- RLS remaining enabled on every staging public table;
- rollback SQL restoring the observed baseline grants and policy targets inside
  a transaction, followed by rollback to the hardened state;
- zero test rows remaining after the rehearsal.
- exact public table parity: 34 tables in production and staging;
- exact column fingerprints for all 33 StreetPlate-owned public tables;
- PostGIS installed and five intended Realtime publications present;
- a second rollback-safe role test covering customer/driver ownership,
  anonymous denial, public catalogue reads, and backend `service_role` writes.

Post-migration security advisors contain informational `rls_enabled_no_policy`
notices for backend-only wallet, payout, bonus, analytics, token blacklist, and
bank-detail tables. Those tables have no `anon` or `authenticated` grants. The
remaining PostGIS notices concern the extension-managed `spatial_ref_sys`
relation and PostGIS functions in the public schema; the staging migration role
cannot change the owner-managed relation. Performance notices are expected
unused-index messages because staging contains only synthetic data.

## Test identities and backend status

Three isolated, confirmed staging Auth identities are linked to synthetic
profiles:

- `baxmthembu2002+streetplate-staging-customer@gmail.com`
- `baxmthembu2002+streetplate-staging-vendor@gmail.com`
- `baxmthembu2002+streetplate-staging-driver@gmail.com`

Password-grant sign-in succeeded for all three identities. Their staging-only
credentials are kept in ignored local environment configuration and are not
committed.

The isolated Railway service is deployed as `streetplate-staging` from
`baxmthembu/kasi-eats` (`main`, `/backend`) at:

- `https://streetplate-staging-production.up.railway.app`

The service is pinned to Supabase project `nmxcmfkgtnhjhzmvqmrb`, uses PayFast
sandbox mode, and has a separate backend JWT secret. Its health endpoint passed,
its public vendor endpoint returned only the synthetic `StreetPlate Staging
Kitchen`, and authenticated customer, vendor, and driver endpoint checks all
returned the expected role. This proves the staging deployment is not reading
the production Supabase project.

## Production approval gate

Production approval should **not** be requested automatically. Schema, PostGIS,
Realtime, database-level RLS rehearsal, confirmed role sessions, and isolated
backend smoke tests are complete. A production RLS change still requires the
owner's separate explicit approval after reviewing this report and the forward
and rollback SQL. Full payment regression remains a separate sandbox test. The
production proposal and rollback remain unapplied.
