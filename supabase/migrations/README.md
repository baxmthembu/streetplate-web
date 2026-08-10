# Supabase migrations

This directory contains CLI-generated, reviewed forward migrations.

The PayFast production-readiness migrations are additive: they do not rename or
remove existing tables, columns, statuses, functions, triggers, buckets, roles,
or API contracts. Matching operational rollback, verification and transactional
staging-test SQL lives in `supabase/proposals/`.

Every shared database change must still follow `docs/database-change-process.md`.
