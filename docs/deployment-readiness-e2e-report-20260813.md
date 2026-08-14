# StreetPlate web deployment readiness and E2E report

Date: 14 August 2026

Branch: `feature/initial-streetplate-web`

Audited commit: `01a8ba2352eed76b30cb5ae7dbd905c3d5c5a6a8`

Scope: StreetPlate website and staging services only; no mobile repository
changes

## Release verdict

The application is ready for continued testing on its Vercel **Preview**, but it
must not be promoted to production yet. The exact audited commit builds and
deploys cleanly, all GitHub checks pass, the public desktop/mobile journeys
pass, and the approved staging customer and driver sessions work. Remaining
production blockers are listed below and include legal approval, an
authenticated vendor journey, delivery-radius behaviour, and several product
claims that are not yet backed by complete website functionality.

## Exact release evidence

- GitHub Actions run `31778688746` passed on the audited commit:
  - `validate`: passed, including format, lint, TypeScript, unit/component tests
    and the optimized build.
  - `browser-tests`: passed across desktop and mobile Chromium.
- Vercel Preview deployment
  `dpl_41gyAndCvFouv2RpqsHtM8CsCE2k` is `READY` and was built from the audited
  commit.
- The final report-head Preview `dpl_2xPVyquZ6SGapccTrBdBoZSttPbD` returned
  HTTP 200 from `/api/health` with `status: ok` and HTTP 200 from
  `/api/readiness` with configuration, API and Auth checks all true. The probe
  used an authenticated temporary Vercel share session because Deployment
  Protection is enabled.
- Vercel reported no runtime error clusters and no error/fatal logs for that
  Preview during the authenticated audit.
- ESLint: passed with no errors or warnings.
- Next route type generation and TypeScript: passed.
- Vitest: 39 files, 110 tests passed.
- Prettier: all matched files passed.
- Next.js 16.3.0 optimized production build: passed; all application routes
  compiled and 23 static pages generated.
- Dependency audit: zero known vulnerabilities at the time of this audit.
- Local production-build Playwright matrix: 18 passed and 2 credential-gated
  live-account tests skipped across Desktop Chrome and Pixel 7.
- Serious/critical Axe violations on covered public pages: zero.

## Public and signed-out journeys verified

- Home and discovery render without horizontal overflow at desktop/mobile
  viewports.
- Live staging vendor discovery, menu data and food imagery load.
- Google Places returns South African address suggestions without requiring a
  StreetPlate account.
- Category deep links apply the matching food-type filter.
- Vendor menu search shows matches and an accessible no-result state.
- Cart persistence, selected image, increment/decrement and subtotal updates.
- Signed-out checkout redirects to `/sign-in?next=/checkout` and no longer hangs
  indefinitely if Auth/API calls stall.
- Vendor and driver protected routes preserve their requested destination.
- Auth callback errors show safe, actionable messages.
- Health/readiness response shapes and browser security headers are covered by
  automated tests.
- Public accessibility checks cover home, discovery, registration and privacy.

## Authenticated customer journey verified on the final Preview

The user-approved staging Turnstile check was completed through the normal form;
no CAPTCHA token was injected or bypassed.

- Customer sign-in redirected to `/account` and the authenticated header/session
  rendered correctly.
- Profile, saved addresses, active orders, favourite vendors and order history
  loaded from the shared staging backend.
- A synthetic address was created, selected at checkout and then deleted.
- The staging vendor was added to favourites, appeared in the account, and was
  then removed.
- `E2E Staging Kota` was added to the cart; checkout displayed a canonical
  R45.00 item price, R15.00 delivery fee and R60.00 total.
- The authenticated checkout created a staging order and reached
  `/checkout/payment`.
- The generated payment form used `POST` and targeted
  `https://sandbox.payfast.co.za/eng/process`.
- The order tracker showed the awaiting-payment status, item, delivery fee,
  total, delivery address and cancellation controls.
- The synthetic order was cancelled after the tracking check. No vendor was
  asked to prepare it and no payment was submitted.
- Customer sign-out completed successfully.

## Authenticated driver journey verified on the final Preview

The separately approved staging driver Turnstile check was completed through
the normal form; no CAPTCHA token was injected or bypassed.

- Driver sign-in preserved `next=/driver`, passed the server-side role guard and
  opened the driver dashboard.
- Dashboard greeting, availability state, active-delivery state, earnings,
  wallet and history links loaded.
- Earnings and delivery breakdown loaded with a valid empty state.
- Wallet and full payout history loaded with a valid empty state.
- Delivery history loaded with a valid empty state.
- Profile, vehicle settings, payout details and device/session sections loaded.
- Driver sign-out completed successfully.
- `Go online` correctly refused to enable without browser location permission.
  Location permission was not granted during this audit, so online location
  streaming and live-offer recovery remain unverified in the deployed browser.

## Defects repaired during the audit

- Added bounded Auth/API request timeouts and a fail-closed checkout error state.
- Classified missing non-production Supabase configuration as an unauthenticated
  boundary (`401`) so protected CI journeys reach sign-in, while
  `/api/readiness` remains fail-closed.
- Added focused access-token regression tests.
- Applied discovery `?category=` deep links.
- Wired vendor menu filtering and its no-result state.
- Removed the demo notice for live cart items.
- Corrected the saved-address sign-in destination.
- Added safe auth callback messages.
- Corrected Turnstile group semantics for accessibility.
- Added driver role authorization, failed online-state rollback, Socket.IO
  polling/reconnect fallback and refreshed-chat deduplication.
- Updated stale Playwright locators/fixtures and made external-service journeys
  serial to avoid cross-test contention.
- Added production Node 22 pinning and excluded local Codex/log artifacts from
  source and formatting gates.

## Staging data changes

- One explicitly synthetic item, `E2E Staging Kota`, remains attached to the
  existing `StreetPlate Staging Kitchen` vendor so menu and cart journeys can
  run.
- The authenticated checkout created one synthetic order, which was cancelled
  during cleanup and remains in staging as audit history.
- The temporary address and favourite were removed.
- No DDL, migration, RLS policy, production data or production database was
  changed by this audit.

## Production blockers

1. The six legal documents still identify themselves as draft and require
   approved business/privacy contacts and South African legal review.
2. Staging lacks a dedicated approved vendor E2E account, so the complete live
   vendor dashboard and mutation journey is not yet verified end to end.
3. Delivery location is collected and geocoded, but discovery does not yet apply
   distance/radius filtering or location-based delivery fee calculation.
4. Vendor/driver recruitment copy promises application document upload and
   tracking that the current website does not implement.
5. Driver `Call customer` is signalling/UI only; there is no WebRTC media
   transport and microphone permission remains intentionally disabled.
6. Driver online location streaming and live-offer recovery need a separately
   approved location-permission test with a suitable staging delivery fixture.
7. Production email/Resend completion remains a separate paused task.
8. The synthetic staging customer and driver passwords should be rotated before
   those accounts are reused because a form-state diagnostic surfaced them in
   the audit transcript. No production credential was exposed.

## PayFast cutoff

The audit created the staging order and inspected the generated PayFast sandbox
form, but did not click `Open secure PayFast payment` and did not submit any
request to PayFast. No real payment data or money was transmitted.

## Mobile impact

- Mobile repository files changed: 0
- Mobile dependencies changed: 0
- Mobile configuration changed: 0
- Existing API contracts intentionally broken: 0
- Supabase production migrations applied by this audit: 0
- Supabase production RLS policies changed by this audit: 0
- Staging-only persistent fixtures added: 1 menu item and 1 cancelled audit
  order
- Shared web/mobile compatibility unit and route tests completed: yes
