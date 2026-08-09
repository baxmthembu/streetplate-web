# Checkout production readiness

Status: code and isolated staging database hardened; Railway deployment,
production migration approval and live payment validation pending.

## Current verified findings

- The website calculates the order total on the server and requests signed PayFast fields from the authenticated backend.
- Only a verified PayFast ITN may confirm an order; browser return/cancel URLs do not change payment state.
- ITN validation now checks the signature, merchant ID, PayFast source IP, order amount and PayFast server confirmation.
- Signing inputs and credentials are no longer written to debug logs.
- Production configuration rejects local or non-HTTPS callback URLs.
- The live shared project contains `orders` and `payments`, but does not contain `vendor_wallets`.
- Completed payment processing is intentionally disabled until the atomic database proposal is approved and applied.

## Verified isolated staging work

- The separate `StreetPlate Staging` Supabase project is healthy and contains a
  schema-only checkout baseline derived from live production metadata. No
  production customer or order data was copied.
- The baseline contains `users`, `vendors`, `menu_categories`, `menu_items`,
  `orders`, `order_items` and `payments`, with RLS enabled on every application
  table and the compatible production read policies.
- `vendor_wallets`, `vendor_wallet_entries` and
  `process_payfast_payment(...)` are installed on staging only.
- The verification script confirms RLS is enabled, browser roles cannot execute
  the payment RPC, and only `service_role` can execute it.
- The rolled-back database test verifies first completion, duplicate ITN
  idempotency, one-time vendor credit, order confirmation, amount mismatch
  rejection and cancelled-order rejection. It leaves no fixture rows behind.
- Staging exposed an ambiguity in `ON CONFLICT (order_id)` because output column
  names are PL/pgSQL variables. The proposal now targets named unique
  constraints and the full database test passes.
- Supabase security advisors report only the expected informational notices for
  service-role-only wallet tables with RLS and no client policies. Performance
  advisors report expected unused indexes because staging has no persistent
  test data.
- Production database objects and policies remain unchanged.

## Required staging sequence

1. Rotate the PayFast merchant key and passphrase before live payments. Treat any
   value exposed in logs, messages or support tooling as compromised.
2. Restore a public HTTPS backend deployment and set `API_URL` to its exact origin.
3. Verify the deployment's proxy topology, then set `TRUST_PROXY_HOPS` so `req.ip` is the actual PayFast source.
4. Use the Supabase CLI to turn the tested proposal into a tracked migration.
5. Configure a staging backend against `StreetPlate Staging`, set
   `PAYFAST_ATOMIC_RPC_ENABLED=true`, and create dedicated staging Auth users and
   vendor/menu fixtures.
6. Use PayFast Sandbox to complete, cancel, retry and replay an actual ITN while
   checking order, payment and wallet records.
7. Run the customer, vendor, driver and admin HTTP compatibility suite against
   the deployed staging backend.
8. Obtain explicit approval before applying the migration to production.
9. Switch to newly rotated live credentials and `PAYFAST_SANDBOX=false`, then
   run a controlled low-value production smoke transaction.

Before deploying the backend, run:

```bash
npm run check:payments:production
```

The command fails closed for sandbox/debug mode, local or non-HTTPS URLs,
placeholder credentials, an invalid proxy-hop setting, or disabled atomic RPC processing.

## Compatibility assessment

- Existing tables, columns, order statuses and API routes are not renamed or removed.
- `/api/payments/data` keeps its existing fields and adds only `environment`.
- `/api/payments/initiate` remains available for older clients.
- Mobile apps contain no direct queries for `payments` or `vendor_wallets`; affected access is through the existing backend routes.
- The new financial tables are RLS-enabled and service-role-only. Existing `orders` and `payments` RLS policies are unchanged.

## Production environment

Set secrets only in the deployment secret store, never in Git:

```dotenv
NODE_ENV=production
API_URL=https://api.streetplate.co.za
WEB_APP_URL=https://streetplate.co.za
PAYFAST_SANDBOX=false
PAYFAST_DEBUG=false
PAYFAST_ATOMIC_RPC_ENABLED=true
PAYFAST_VALIDATION_TIMEOUT_MS=10000
TRUST_PROXY_HOPS=1
```

`TRUST_PROXY_HOPS=1` is an example, not a universal value. Confirm the hosting topology before enabling it.
