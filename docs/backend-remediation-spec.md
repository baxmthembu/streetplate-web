# Existing backend remediation specification

These changes belong in `baxmthembu/kasi-eats`, which remains read-only. This file is a handoff specification, not authorization to edit that repository.

## Launch security

1. **Vendor details:** replace `vendors(*)` in the public detail route with an explicit allow-list matching the public list contract plus only required delivery fields. Add a contract test that rejects banking, identity, owner, internal-status and audit columns.
2. **Driver tracking:** before accepting `track_order`, load the order with the verified user ID and permit only its customer, assigned driver, vendor owner or approved admin. Reject all other users before joining an order room.
3. **Password source:** remove the legacy public `password_hash` authentication fallback or update it atomically whenever Supabase changes a password. Supabase Auth should be the canonical source.
4. **PayFast returns:** generate allow-listed website return/cancel URLs per environment; continue treating verified ITN data—not the browser redirect—as payment truth.
5. **Account deletion:** add an authenticated request workflow with session revocation, retention/legal holds, anonymisation rules, audit records and delayed service-role deletion.

## Verification matrix

- unauthenticated, wrong-customer and unassigned-driver order tracking attempts return 401/403
- mobile customer/vendor/driver flows preserve their current response shapes
- PayFast duplicate ITNs remain idempotent
- a Supabase-reset password works everywhere and the old password fails
- deletion cannot remove financial records required for retention
