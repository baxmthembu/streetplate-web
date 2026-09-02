# Production cutover runbook

Ordered procedure for taking StreetPlate web to production, with the
verification required before each step and the rollback if it fails.

Written 2026-08-29 against `streetplate-web@0860f34` and `kasi-eats@99f69e4`.
Re-verify the fact table below before executing — it ages.

## Facts this runbook depends on

| Thing                         | Value                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Production backend            | Railway project `renewed-healing`, service `kasi-eats`                         |
| Production backend domains    | `www.streetplate.co.za`, `api.streetplate.co.za` (both port 5000)              |
| Current production deployment | `2f46a0d7-21c5-42f7-b6d9-18773a9adade`, commit `4753661` (main)                |
| Staging backend               | service `streetplate-staging`, `streetplate-staging-production.up.railway.app` |
| Production Supabase           | `zpygivfrlqndkgvgwrji`                                                         |
| Staging Supabase              | `nmxcmfkgtnhjhzmvqmrb`                                                         |
| Website                       | Vercel project `streetplate-web`, team `baxmthembus-projects`                  |
| Backend change                | PR #7, `feature/production-readiness-security` @ `99f69e4`                     |
| Website change                | PR #1, `feature/initial-streetplate-web` @ `370837b` (draft)                   |

Note that **`www.streetplate.co.za` currently points at the Railway backend
service**, not at a separate website host. The DNS cutover moves `www` to
Vercel while `api` stays on Railway.

## STOP — blocking defect found before this runbook can run

**Deploying PR #7 to production right now takes the production backend down.**

`server.js:11` requires `src/middleware/rateLimiter`, which calls
`createDistributedStore()` at module scope (lines 24, 38, 52). That function
throws when Redis credentials are absent and `NODE_ENV=production`:

```js
if (!url || !token) {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Distributed rate limiting is not configured for production.');
  }
```

The throw happens at `require` time, so the process exits before the server
listens. Railway restarts it, and it exits again — a crash loop.

The production `kasi-eats` service is missing three variables that staging has:

| Variable            | staging | production                                     |
| ------------------- | ------- | ---------------------------------------------- |
| `KV_REST_API_URL`   | present | **MISSING**                                    |
| `KV_REST_API_TOKEN` | present | **MISSING**                                    |
| `RESEND_API_KEY`    | present | **MISSING** (only `RESEND_ORDERS_FROM` is set) |

Both domains are served by that one service, so the outage would take down the
current website and the API used by all three mobile apps at the same time.

Fix this in Step 2 before anything else. Do not skip it.

## Preconditions

Every one of these must hold. They are gates, not suggestions.

- [ ] `bash scripts/run-staging-verification.sh` exits 0 (Phases A–H)
- [ ] `bash scripts/check-mobile-turnstile.sh` reports WIRED, or NOT WIRED has
      been fixed in the apps and released
- [ ] Legal documents carry approved contacts and have had SA legal review
- [ ] Product-gap copy resolved (location-radius filtering, recruitment claims)
- [ ] Production Supabase **Site URL is not `http://localhost:3000`** — if it
      is, every real password reset and email confirmation dead-ends. Staging
      has this problem today; confirm production does not.
- [ ] Production Supabase security advisors reviewed
- [ ] A maintenance window agreed. Step 3 restarts the API that currently
      serves both the website and all three mobile apps.

## Why the order is what it is

The website posts `turnstile_token` to the backend's `/auth/register`
(`src/app/auth/actions.ts:367`). On `main`, that route is
`checkExact(validateRegister)` with **zero** `turnstile_token` entries, and
`checkExact` rejects unknown fields.

So the website returns **400 on registration** against today's production
backend. The backend must go first. Deploying the website first produces a site
where nobody can sign up.

---

## Step 1 — Freeze and record

1. Announce the window. Stop other merges to `main` in both repositories.
2. Record the rollback targets:
   - backend deployment `2f46a0d7-21c5-42f7-b6d9-18773a9adade` (commit `4753661`)
   - current DNS records for `www.streetplate.co.za`, with their TTLs
3. Confirm `kasi-eats@main` is still `4753661`. If it moved, re-run the
   preconditions — someone else shipped.

**Rollback:** nothing to undo.

---

## Step 2 — Add the missing production backend variables

On Railway → `renewed-healing` → `kasi-eats` → Variables, add:

- `KV_REST_API_URL` — the Upstash REST URL. Must start `https://`.
- `KV_REST_API_TOKEN` — the Upstash REST token. Must contain no `*`; a masked
  placeholder is non-empty and will pass the boot check, then fail every
  request with a 500 because `passOnStoreError` is `false`.
- `RESEND_API_KEY` — the restricted sending key.
- `RATE_LIMIT_NAMESPACE` — already present; confirm it differs from staging's
  value so the two tiers do not share rate-limit buckets.

**Use a production Upstash database, not the staging one.** Sharing it means
staging traffic consumes production quota.

Do not deploy yet. Adding variables may trigger a redeploy of the _current_
commit, which is safe — `4753661` does not read them.

**Verify:** the variable list shows all three names. Values stay redacted;
that is expected and correct.

**Rollback:** remove the variables. Harmless while `main` is deployed.

---

## Step 3 — Merge PR #7 and deploy the backend

1. Confirm PR #7 is `mergeable_state: clean` and CI is green on `99f69e4`.
2. Merge to `main`.
3. Let Railway deploy `kasi-eats`.

**Verify, in this order — do not proceed on a partial pass:**

```
GET https://api.streetplate.co.za/api/health      -> 200
GET https://api.streetplate.co.za/api/readiness   -> 200
```

Readiness must report `configured`, `supabase`, `redis` and `malwareScanner`
all `true`. `redis: false` means Step 2's credentials are wrong.

Then check the Railway deploy logs for a clean boot — the four ✅/🚀 lines, and
specifically **no** `Distributed rate limiting is not configured for
production`.

Then confirm the API still serves real traffic: one authenticated request
through a route mounted after the limiter (anything under `/api/vendors`), and
confirm it returns 200 rather than 500. A 500 here means Redis credentials are
present but invalid.

**Rollback:** Railway → `kasi-eats` → Deployments → redeploy
`2f46a0d7-21c5-42f7-b6d9-18773a9adade`. Then revert the merge commit on `main`
so the next deploy does not reapply it.

---

## Step 4 — Confirm the mobile apps still work

Do this **before** touching DNS, while the website is still on Railway and a
backend rollback is cheap.

On a real device or simulator against production, for each of customer, vendor
and driver: sign in, register a throwaway account, and run a password update.

A **400** naming `turnstile_token` means that app does not send the field.
Roll the backend back (Step 3 rollback) and fix the app before continuing.

**Rollback:** Step 3 rollback.

---

## Step 5 — Promote the website to Vercel production

1. Take PR #1 out of draft, confirm checks, merge to `main`.
2. Confirm Vercel production environment variables are set — in particular
   `STREETPLATE_API_URL` pointing at `https://api.streetplate.co.za`,
   `NEXT_PUBLIC_SUPABASE_URL` at the **production** project
   (`zpygivfrlqndkgvgwrji`, not staging), and `TURNSTILE_HOSTNAMES` containing
   `streetplate.co.za` with **no** `localhost` entries.
3. Promote the build to production in Vercel.

**Verify on the Vercel production URL, before DNS moves:**

- `/api/health` and `/api/readiness` return 200
- sign-in works for a real account
- registration completes — this is the `turnstile_token` path that Step 3 fixed
- browser console is free of errors

**Rollback:** Vercel → Deployments → promote the previous production
deployment. DNS has not moved, so nothing public is affected yet.

---

## Step 6 — DNS cutover

Only after Step 5 verifies on the Vercel URL.

1. **Lower the TTL on `www.streetplate.co.za` to 60s and wait for the old TTL
   to expire.** Do this hours ahead. Cutting over on a long TTL means a slow,
   partial rollback.
2. In Cloudflare, repoint `www.streetplate.co.za` from Railway to Vercel per
   Vercel's instructions for the domain.
3. Leave `api.streetplate.co.za` alone. It must keep pointing at Railway.
4. Remove `www.streetplate.co.za` from the Railway `kasi-eats` service only
   after traffic has drained and you are confident — this is the slowest part
   to undo.

**Verify:**

- `https://www.streetplate.co.za` serves the new site
- `https://api.streetplate.co.za/api/health` still returns 200
- a full signed-in journey on the real domain: browse, sign in, add to cart,
  reach checkout — stop before paying
- certificate valid, no mixed-content warnings

**Rollback:** restore the previous `www` record. With a 60s TTL this is minutes.
This is why Step 6.1 exists.

---

## Step 7 — Controlled PayFast transaction

**Requires its own explicit approval. It moves real money.**

1. Confirm `PAYFAST_SANDBOX=false` and `PAYFAST_DEBUG=false` in production.
2. Place one low-value real order end to end.
3. Reconcile: PayFast dashboard, the ITN callback recorded in the backend, the
   order row, and the vendor wallet entry. All four must agree.
4. Refund it.

**Verify:** the ITN was received and validated — not merely that the payment
succeeded at PayFast. The ITN path is the part that has historically broken.

**Rollback:** refund. If ITN handling is wrong, set `PAYFAST_SANDBOX=true` to
stop taking payments while you fix it.

---

## Post-cutover watch

For the first 24 hours:

- Railway `kasi-eats` 5xx rate — should stay at 0, as it has for the last week
- Railway deploy logs for Redis or Supabase errors
- Vercel runtime errors
- Supabase advisors on the production project
- the first real registration and the first real password reset, end to end

## Known issues that are not blockers

Neither blocks cutover; both are worth fixing after.

1. **The production config validator never runs.** `backend/scripts/checkProductionEnv.js`
   is thorough and fail-closed, but `railway.json` starts `node server.js` and
   nothing invokes `check:production`. Run it manually against the production
   variable set before Step 3 — it would have caught the missing Redis and
   Resend variables on its own. Wiring it into boot needs to be
   production-only, since it demands `PAYFAST_SANDBOX=false` and would crash
   staging.

2. **`resolveVendorId` returns 500, not 404**, for a user with no vendor row
   (`backend/src/routes/vendorPayouts.js:25`). Cosmetic, but it pollutes 5xx
   alerting during exactly the window you will be watching 5xx rates.
