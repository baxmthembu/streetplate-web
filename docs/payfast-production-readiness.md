# PayFast production readiness

## Scope

The checkout continues to use the existing `orders` and `payments` contracts.
Two additive migrations provide atomic payment completion and the private vendor
payout infrastructure required by the existing backend.

- `20260810095429_payfast_atomic_processing.sql`
- `20260810100053_vendor_payout_infrastructure.sql`

No existing table, column, enum value, function, trigger, bucket, role or
realtime channel is renamed or removed.

## Safety properties

- A browser return URL never marks an order paid.
- A completed payment requires a valid PayFast merchant, signature, source IP,
  amount and PayFast server confirmation.
- Payment completion, order confirmation and the vendor 85% credit commit in
  one PostgreSQL transaction.
- A unique order ledger entry makes retries idempotent and prevents double
  vendor credits.
- PostgreSQL independently enforces the 15% StreetPlate / 85% vendor split.
- Failed or late notifications cannot downgrade a completed payment.
- Vendor wallet, bank and payout tables are unavailable to `anon` and
  `authenticated`; the trusted backend service role is the only caller.
- Bank details are not added to `vendors`, because that marketplace table is
  publicly readable.

## Staging evidence

Both migrations were applied to StreetPlate Staging before production. The
verification and transactional tests passed for:

- RLS, grants and hardened security-definer configuration
- exact amount and 15/85 split validation
- duplicate ITN idempotency
- cancelled-order rejection
- missing PayFast payment-ID rejection
- wallet and ledger totals
- private bank storage and payout snapshots
- invalid payout status rejection
- unchanged `orders`, `payments`, order-status and payment-status contracts

All fixture and financial writes in the test scripts are rolled back.

Supabase security/performance advisors reported informational notices only. The
new financial tables intentionally have RLS with no client policies, producing
the documented default-deny informational lint.

## Mobile compatibility

The customer, vendor and driver applications do not query the new financial
tables or RPC directly. They keep using the existing backend routes and existing
`orders`/`payments` fields. The bank-details API response retains its existing
`bank_details_updated_at` field even though storage moves to a private table.

- Mobile repository application files changed: 0
- Mobile dependencies changed: 0
- Mobile configuration changed: 0
- Existing API contracts broken: 0

The isolated backend branch changes backend and database reference files only.

## Deployment order

1. Run both forward migrations and their read-only verification scripts.
2. Deploy the reviewed backend PR on Node 22.
3. Set `API_URL`, `WEB_APP_URL`, `TRUST_PROXY_HOPS`,
   `PAYFAST_VALIDATION_TIMEOUT_MS` and `PAYFAST_ATOMIC_RPC_ENABLED=true`.
4. Keep `PAYFAST_DEBUG=false`; switch `PAYFAST_SANDBOX=false` only with newly
   rotated live merchant credentials.
5. Confirm `/api/health`, create a low-value real order, complete payment, and
   reconcile PayFast, `payments`, `orders`, wallet entry, wallet total and email.

## Rollback

Set `PAYFAST_ATOMIC_RPC_ENABLED=false` before rolling back the backend. Use the
operational rollback SQL in `supabase/proposals/`. Financial and banking records
are deliberately preserved for audit rather than dropped.
