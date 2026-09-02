# Shared Supabase security review — 2026-07-31

This is a read-only review. No SQL, policy, Auth setting or extension change was applied.

## Security Advisor

- 13 findings total.
- One error: `public.spatial_ref_sys` is reported without RLS.
- Warnings: PostGIS is installed in `public`; `rls_auto_enable()` and PostGIS-owned `st_estimatedextent` overloads are executable through exposed roles; leaked-password protection is disabled.
- Informational: `token_blacklist` and `vendor_analytics_daily` have RLS enabled with no policies.

PostGIS-owned findings must be checked against current Supabase extension guidance before any change. They are not safe candidates for blind revocation or relocation.

## Performance Advisor

- 17 RLS initialization-plan warnings caused by row-by-row `auth.uid()` evaluation.
- 25 unused-index notices. An unused index is not automatically removable; the observation window and mobile/backend query workload must be reviewed first.

## Proposal

`supabase/proposals/rls-security-performance.sql` converts the 17 ownership policies to explicit `authenticated` targets, uses `(select auth.uid())`, adds explicit write checks, and revokes public execution of the custom `rls_auto_enable()` function. A paired rollback is included.

Before approval:

1. Resolve the mobile app gitlinks and inventory all direct Supabase queries.
2. Create a Supabase staging branch.
3. Convert the proposal with the Supabase CLI migration workflow.
4. Test customer, vendor, driver, admin and service-role backend workflows.
5. Rerun Security and Performance Advisors.
6. Review query plans and policy equivalence.
7. Request explicit production approval.

Official remediation references:

- <https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan>
- <https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable>
- <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>
