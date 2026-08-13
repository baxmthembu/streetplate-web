-- SAFE OPERATIONAL ROLLBACK.
-- Disable the driver payout routes and weekly payout cron before running.
-- Financial history is retained intentionally for audit and recovery.

begin;

revoke all on table public.driver_wallets from service_role;
revoke all on table public.driver_payouts from service_role;
revoke all on table public.driver_bonuses from service_role;

-- The legacy driver_earnings object and all additive columns remain in place
-- so existing delivery records are never destroyed during an incident.

commit;
