# Driver payout history database change

## Requirement

The existing Railway API already implements driver wallet, earnings, weekly
payout generation, driver history and admin payout-management endpoints. The
shared production Supabase project is missing part of the schema those routes
query, causing `/api/drivers/payouts` to fail when the website or driver mobile
app requests payout history.

## Objects affected

- `driver_earnings`: additive payout-breakdown, status and payout-link columns.
- `driver_wallets`: new private balance summary table.
- `driver_payouts`: new private weekly history and bank-snapshot table.
- `driver_bonuses`: new private bonus audit table used while crediting earnings.

No existing table, column, enum value, function, trigger, storage bucket,
realtime channel, order status or API contract is renamed or removed.

## Access and RLS

All affected tables have RLS enabled. Existing authenticated read access to a
driver's own `driver_earnings` is retained. Wallet, payout and bonus records are
not granted to `anon` or `authenticated`; the existing authenticated Railway API
uses `service_role` and continues to enforce driver/admin authorization before
returning data. This prevents payout bank snapshots from being exposed through
the public Data API.

## Query compatibility audit

- Driver website: calls `GET /api/drivers/wallet` and
  `GET /api/drivers/payouts?offset=&limit=`.
- Driver mobile app: uses the same two endpoints; the payout UI expects the
  existing column names preserved by the migration.
- Railway weekly cron and admin routes: create, list, approve, reject and mark
  `driver_payouts` paid; link `driver_earnings.payout_id`; move balances in
  `driver_wallets`; and write `driver_bonuses`.
- Customer app: does not query these payout objects.
- Vendor app: uses separate `vendor_*` payout objects and is unchanged.

## Rollout and rollback

The forward migration is
`supabase/migrations/20260812090000_driver_payout_infrastructure.sql`. Staging
verification and transactional fixtures are in `supabase/proposals/`. The safe
operational rollback revokes backend access but deliberately retains financial
records for audit and recovery.

## Rollout status

- StreetPlate Staging: applied and verified on 2026-08-12.
- Shared production Supabase: applied with explicit approval and recorded as
  migration `20260812193847_driver_payout_infrastructure` on 2026-08-12.
- Production verification: schema, constraints, foreign keys, RLS, grants,
  payout lifecycle and fixture rollback passed.
- Railway health check: HTTP 200.
- Protected driver payout route: reachable and correctly returns HTTP 401
  without a driver access token.
