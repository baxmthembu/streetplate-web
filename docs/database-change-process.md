# Database change process

No database change is included or applied in the initial website phase.

For every proposed shared Supabase change:

1. Inspect the live schema and registered migration history.
2. Inspect all affected RLS policies, grants, functions and triggers.
3. Identify mobile, backend and admin queries using the affected objects.
4. Explain the requirement and why the website cannot adapt safely.
5. Add forward migration SQL under `supabase/migrations/`.
6. Add tested rollback SQL and operational notes.
7. Confirm existing columns, statuses, functions, buckets and contracts remain compatible.
8. Run customer, vendor, driver and admin compatibility tests.
9. Apply and validate on staging.
10. Wait for explicit production approval.

Never rename or delete existing shared database objects as part of a website-only change.
