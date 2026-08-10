-- SAFE OPERATIONAL ROLLBACK.
-- Disable the vendor payout routes/cron before running this file. Financial
-- and banking records are intentionally retained for audit and recovery.

begin;

revoke all on table public.vendor_bank_details from service_role;
revoke all on table public.vendor_payouts from service_role;

commit;
