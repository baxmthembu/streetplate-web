-- SAFE OPERATIONAL ROLLBACK FOR payfast-atomic-processing.sql.
-- Disables the atomic RPC while preserving all financial records for audit.
-- Set PAYFAST_ATOMIC_RPC_ENABLED=false before running this rollback.

begin;

drop function if exists public.process_payfast_payment(
  uuid, numeric, text, timestamptz, numeric, numeric
);

-- Intentionally retain vendor_wallet_entries and vendor_wallets. Dropping
-- financial records is not a safe production rollback. Remove test-only tables
-- manually on an isolated staging branch after exporting and reconciling them.

commit;
