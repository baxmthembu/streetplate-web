# Operations runbook

## Service signals

- `/api/health`: process liveness; expected HTTP 200.
- `/api/readiness`: environment, backend API and Supabase Auth dependencies; expected HTTP 200 before traffic is enabled.
- Vercel/server logs: search for `streetplate_request_error` structured events.
- Existing backend logs remain authoritative for PayFast ITNs, order creation and dispatch.

## Incident priorities

- **P0:** incorrect payment state, cross-account data exposure, leaked secret, or widespread order duplication. Disable affected traffic, preserve logs, rotate exposed credentials and involve payment/security owners.
- **P1:** sign-in, checkout, vendor discovery or order tracking unavailable for many users. Roll back the website if correlated with a release; otherwise escalate to the backend/Supabase owner.
- **P2:** isolated UI, content or non-critical notification problem. Record, reproduce and schedule a normal fix.

Never retry an order or payment automatically unless the backend provides a verified idempotency key. Never mark an order paid from a browser return URL.

## Required owner-supplied details

- support contact and on-call owner
- privacy and information-officer contact
- PayFast merchant support path
- legal retention schedule
- recovery objectives and backup/PITR plan
