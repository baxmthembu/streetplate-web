# StreetPlate web deployment readiness and E2E report

Date: 13 August 2026

Branch: `feature/initial-streetplate-web`

Scope: StreetPlate website only; no mobile repository changes

## Release verdict

The application is suitable for a Vercel **preview deployment**, but it must not
be promoted to production yet. The optimized application builds cleanly and the
public desktop/mobile journeys pass. Production promotion remains blocked by
unapproved draft legal copy, unverified Vercel runtime variables/readiness, and
authenticated journeys that require a user-approved Cloudflare Turnstile solve.

## Automated evidence

- ESLint: passed with no errors or warnings.
- Next route type generation and TypeScript: passed.
- Vitest: 38 files, 108 tests passed.
- Prettier: all matched files passed.
- Next.js 16.3.0 optimized production build: passed; all application routes
  compiled and 23 static pages generated.
- Dependency audit: zero known vulnerabilities at the time of this audit.
- Playwright staging release journeys: 10/10 passed across Desktop Chrome and
  Pixel 7.
- Playwright public/accessibility/security journeys: 8/8 passed across Desktop
  Chrome and Pixel 7.
- Serious/critical Axe violations on the covered public pages: zero.

## Journeys verified

- Home and discovery render without horizontal overflow at desktop/mobile
  viewports.
- Live staging vendor discovery and food imagery load.
- Google Places returns South African address suggestions without requiring a
  StreetPlate account.
- Category deep links apply the matching food-type filter.
- Vendor menu search shows matches and an accessible no-result state.
- Cart persistence, selected item, increment/decrement and subtotal updates.
- Signed-out checkout redirects to `/sign-in?next=/checkout` and no longer hangs
  indefinitely if Auth/API calls stall.
- Vendor and driver protected routes preserve their requested destination.
- Auth callback errors show safe, actionable messages.
- Health/readiness response shapes and browser security headers.
- Public accessibility checks for home, discovery, registration and privacy.

## Defects repaired during the audit

- Added bounded Auth/API request timeouts and a fail-closed checkout error state.
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

## Staging data change

One explicitly synthetic item, `E2E Staging Kota`, was added to the existing
`StreetPlate Staging Kitchen` vendor so menu and cart journeys could run. No DDL,
migration, RLS policy, production data or production database was changed.

## Production blockers

1. The six legal documents still identify themselves as draft and require
   approved business/privacy contacts and South African legal review.
2. Vercel Preview and Production must contain all required variables from
   `.env.example`, including Upstash Redis. A deployed `/api/readiness` must
   return HTTP 200 before promotion.
3. Authenticated customer and driver journeys are pending explicit permission to
   solve each Cloudflare Turnstile challenge. No CAPTCHA was bypassed.
4. Staging lacks a dedicated approved vendor E2E account, so vendor mutations
   were covered by unit/component tests and static/browser route checks, not a
   complete live vendor session.
5. Delivery location is collected and geocoded, but discovery does not yet apply
   distance/radius filtering or location-based delivery fee calculation.
6. Vendor/driver recruitment copy promises application document upload and
   tracking that the current website does not implement.
7. Driver “Call customer” is signalling/UI only; there is no WebRTC media
   transport and microphone permission is intentionally disabled.
8. Production email/Resend completion remains a separate paused task.

## PayFast cutoff

No request was submitted to the PayFast gateway and no final payment action was
performed. A future authenticated staging run may create a pending order and
inspect `/checkout/payment`, but must stop before the PayFast form is submitted.

## Mobile impact

- Mobile repository files changed: 0
- Mobile dependencies changed: 0
- Mobile configuration changed: 0
- Existing API contracts intentionally broken: 0
- Supabase production migrations applied by this audit: 0
- Supabase production RLS policies changed by this audit: 0
- Staging-only data fixtures added: 1 menu item
- Shared web/mobile compatibility unit and route tests completed: yes
