# StreetPlate web deployment readiness and E2E report

Date: 20 August 2026

Branch: `feature/initial-streetplate-web`

Audited base commit: `0449a2497a9365cf361add637e1f0de69f23b4d3`

Audited candidate: the base commit plus the vendor-earnings resilience fix,
expanded public-route browser coverage and local-editor ignore rules described
below. These candidate changes were still local and uncommitted when this
report was written.

Scope: StreetPlate website and staging services only. The final PayFast
submission was intentionally excluded. The `kasi-eats` mobile/backend
repository remained read-only.

## Release verdict

**Not ready for production promotion yet.**

The website is healthy enough for continued Vercel Preview testing. The exact
local candidate passes formatting, linting, type checking, 113 unit/component
tests, an optimized Next.js build, 26 desktop/mobile browser journeys, and a
fresh production dependency audit. Earlier approved manual staging journeys
also verified customer, driver, and vendor sessions through real Turnstile.

Production promotion is still blocked by the items in the Production blockers
section. The most important functional defect is a backend route-ordering bug
that prevents the vendor wallet and payout-history endpoints from being
reached. The web candidate now fails gracefully and continues to show canonical
completed-payment earnings, but restoring the complete earnings experience
requires a separately approved backend change.

## Exact automated evidence for the local candidate

- Prettier: passed; all matched files use the configured style.
- ESLint: passed with no errors or warnings.
- Next route type generation and TypeScript: passed.
- Vitest: 40 files and 113 tests passed.
- Next.js 16.3.0 optimized production build: passed; every route compiled and
  23 static pages were generated.
- Production-mode Playwright on an isolated built server:
  - Desktop Chrome: 13 passed and 1 credential-gated test skipped.
  - Pixel 7/mobile Chromium: 13 passed and 1 credential-gated test skipped.
  - Total: 26 passed, 2 skipped and 0 failed in 2.1 minutes.
- Serious/critical Axe violations on the covered public pages: zero.
- `npm audit --omit=dev`: zero known production dependency vulnerabilities on
  20 August 2026.
- A first Playwright attempt against a reused development server became
  unresponsive and produced five click/layout failures. All five disappeared
  when rerun against a clean optimized server; a targeted reproduction passed
  8/8, the original isolated suite passed 18/18 covered tests, and the expanded
  final suite passed 26/26 covered tests. They were stale development-server
  failures, not release-artifact defects.

## Published Preview and CI state

- PR #1 is open, draft, mergeable and clean against `main`:
  <https://github.com/baxmthembu/streetplate-web/pull/1>.
- The branch and PR currently point to `0449a24`.
- GitHub checks for that published commit are green: validation, browser tests,
  Vercel deployment and Vercel Preview Comments.
- Vercel deployment `dpl_FNn5PVpPJ3cB4zuZGawNYosDzAZm` is `READY` at the
  branch Preview alias.
- The current deployment had no grouped runtime errors in the inspected
  seven-day window. One historical `/discover` upstream socket-close belonged
  to an older deployment.
- The local vendor-earnings candidate is newer than that Preview and therefore
  still needs an authorized commit/push, exact-SHA CI, and a final Preview smoke
  test before it can be considered the release candidate.
- The Vercel project reports Node 24.x while `package.json` and GitHub CI target
  Node 22.x. The project runtime should be aligned to Node 22 before production.
- Vercel's current production target is still the old initial-main deployment,
  not this feature branch.

## Public and signed-out journeys verified

- Home and discovery render without horizontal overflow at desktop and mobile
  viewports.
- Live staging vendors, menu data and food imagery load.
- Google Places returns South African address suggestions without requiring a
  StreetPlate account.
- Category deep links apply the matching food-type filter.
- Vendor menu search shows matches and an accessible no-result state.
- Cart persistence, selected image, increment/decrement and subtotal updates.
- Signed-out checkout redirects to `/sign-in?next=/checkout` and no longer
  hangs indefinitely if Auth/API calls stall.
- Vendor and driver protected routes preserve their requested destination.
- Auth callback errors show safe, actionable messages.
- Health/readiness response shapes and browser security headers are covered by
  automated tests.
- Public accessibility coverage includes home, discovery, registration and
  privacy pages.
- A route matrix verifies all 15 public entry/legal pages at desktop and mobile
  widths, including their primary headings and horizontal-overflow boundaries.
- Customer, vendor and driver registration forms expose every required field
  and remain disabled until Turnstile verification.
- Forgot-password and update-password forms expose their required inputs and
  remain disabled until Turnstile verification.
- Unknown legal-document paths render the branded not-found UI with a `noindex`
  robots directive, including Next.js streamed not-found responses.

## Authenticated customer journey verified on Preview

This approved manual check used the normal Turnstile form; no CAPTCHA token was
injected or bypassed.

- Customer sign-in redirected to `/account` and rendered the authenticated
  header/session.
- Profile, saved addresses, active orders, favourites and order history loaded
  from the shared staging backend.
- A synthetic address was created, selected at checkout and deleted.
- The staging vendor was added to favourites and then removed.
- `E2E Staging Kota` was added to the cart. Checkout displayed the canonical
  R45.00 item price, R15.00 delivery fee and R60.00 total.
- Checkout created a staging order and reached `/checkout/payment`.
- The payment form used `POST` and targeted
  `https://sandbox.payfast.co.za/eng/process`.
- The order tracker displayed its awaiting-payment state, item, delivery fee,
  total, address and cancellation control.
- The synthetic order was cancelled. No payment was submitted and no vendor
  was asked to prepare it.
- Customer sign-out succeeded.

## Authenticated vendor journey verified on Preview

This separately approved manual check also used the normal Turnstile form.

- Vendor sign-in reached `/vendor` through the server-side role guard.
- Dashboard, orders, promotions, insights, reviews and account routes loaded.
- Store availability was changed and restored.
- A menu item's availability was changed and restored.
- `/vendor/earnings` exposed a real backend defect: wallet and payout-history
  requests returned `Vendor not found`.

### Vendor earnings diagnosis and candidate mitigation

The backend mounts the generic `/api/vendors/:id` route before the protected
`/api/vendors/wallet` and `/api/vendors/payouts` routes. The generic route
therefore treats `wallet` and `payouts` as vendor IDs. Live read-only checks
returned HTTP 404 instead of the expected authenticated endpoint response.

The website candidate now:

- treats analytics earnings as the canonical page read model;
- uses `Promise.allSettled` so optional settlement endpoints cannot blank the
  complete page;
- shows completed-payment history when live balance/payout history is
  unavailable;
- displays an explicit partial-data notice; and
- maps the backend's actual payout fields, `total_amount` and `paid_at`.

Three focused tests cover a healthy settlement response, the shadowed-route
fallback, and canonical earnings failure. Full wallet/payout restoration still
requires moving the backend payout route mount before the generic vendor route.
No backend file was changed in this audit.

## Authenticated driver journey verified on Preview

This separately approved manual check used the normal Turnstile form.

- Driver sign-in preserved `next=/driver`, passed the server-side role guard
  and opened the driver dashboard.
- Dashboard greeting, availability, active-delivery state, earnings, wallet and
  history links loaded.
- Earnings/delivery breakdown, wallet, payout history and delivery history
  rendered valid empty states.
- Profile, vehicle settings, payout details and device/session sections loaded.
- Driver sign-out succeeded.
- `Go online` correctly refused to enable without browser location permission.
  Because permission was not granted, online location streaming and live-offer
  recovery remain unverified in a deployed browser.

## Authentication fixture status

- The synthetic staging customer, driver and vendor Auth passwords were
  rotated after an earlier diagnostic surfaced form state.
- All three confirmed Auth users still match exactly one corresponding
  `public.users` profile; their identities and role links remain intact.
- The new passwords were not retained by the local test environment. Automated
  authenticated Playwright tests therefore skip instead of using stale or
  unsafe credentials.
- Safe recovery is the normal staging `/forgot-password` flow followed by the
  newest recovery email and `/reset-password`. Save the new values directly in
  the ignored `.env.staging.local` and a password manager; never put them in
  source control or chat.
- `E2E_VENDOR_EMAIL` is also absent locally and must be copied from Supabase
  Authentication Users before the vendor fixture can be automated.
- Do not delete/recreate these users or edit `auth.users` passwords with SQL.

## Defects repaired during the wider audit

- Added bounded Auth/API timeouts and a fail-closed checkout error state.
- Classified missing non-production Supabase configuration as an
  unauthenticated boundary while keeping readiness fail-closed.
- Added focused access-token regression tests.
- Applied discovery `?category=` deep links.
- Wired vendor-menu filtering and its no-result state.
- Removed the demo notice for live cart items.
- Corrected the saved-address sign-in destination.
- Added safe auth callback messages.
- Corrected Turnstile group semantics for accessibility.
- Added driver role authorization, online-state rollback, Socket.IO
  polling/reconnect fallback and refreshed-chat deduplication.
- Updated stale Playwright locators/fixtures and made external-service journeys
  serial.
- Added deterministic public-route, registration, recovery and invalid-legal
  browser coverage across desktop and mobile viewports.
- Added production Node 22 pinning and excluded local development metadata and
  logs from source/formatting gates.
- Added the vendor-earnings partial-data fallback described above.

## Staging data and system changes

- One synthetic item, `E2E Staging Kota`, remains attached to `StreetPlate
Staging Kitchen` for menu/cart journeys.
- One synthetic checkout order was created, cancelled during cleanup, and left
  in staging as audit history.
- Temporary address and favourite changes were removed.
- Vendor availability and menu availability were restored after their tests.
- No production DDL, migration, RLS policy, Auth user, order or storage object
  was changed by this audit.

## Production blockers

1. Publish the local vendor-earnings candidate, obtain green exact-SHA CI, and
   smoke-test the resulting Vercel Preview.
2. Fix the backend vendor route ordering so wallet and payout history are fully
   functional. This needs explicit authorization for the read-only `kasi-eats`
   repository and its Railway staging-first deployment.
3. Recover the three synthetic staging credentials through the canonical reset
   flow and rerun authenticated customer/vendor/driver automation.
4. Grant test-browser location permission with a suitable staging delivery
   fixture, then verify driver location streaming and live-offer recovery.
5. The six legal documents still label themselves drafts and require approved
   business/privacy contacts and South African legal review.
6. Discovery captures/geocodes delivery location but does not yet apply
   distance/radius filtering or location-based delivery fee calculation.
7. Vendor/driver recruitment copy promises application document upload and
   tracking that the current website does not implement.
8. Driver `Call customer` provides signalling/UI only; there is no WebRTC media
   transport and microphone permission remains intentionally disabled.
9. Production email/Resend completion remains a separate paused task.
10. Align the Vercel runtime to Node 22, configure the final Production
    environment, merge the draft PR only after approvals, and promote the
    verified deployment rather than the old initial-main deployment.

## PayFast cutoff

The audit created a staging order and inspected the generated PayFast sandbox
form, but did not click `Open secure PayFast payment` and did not submit a
request to PayFast. No real payment data or money was transmitted.

## Mobile impact

- Mobile repository files changed: 0
- Mobile dependencies changed: 0
- Mobile configuration changed: 0
- Existing API contracts intentionally broken: 0
- Supabase production migrations applied by this audit: 0
- Supabase production RLS policies changed by this audit: 0
- Shared web/mobile compatibility unit and route tests completed: yes
