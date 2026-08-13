# Security implementation report — 12 August 2026

## Outcome

The StreetPlate website now implements the application-level controls in
`security-checklist.md`. The work intentionally leaves shared database and
external infrastructure changes unapplied until their separate approvals and
compatibility checks are complete.

## Implemented controls

- Production HTTPS redirect, HSTS, CSP upgrade, and a broader set of global
  browser security headers.
- Narrow Server Action origin allowlist and a 6 MB transport ceiling for the
  5 MB validated image limit.
- Consistent Supabase `Secure`/`SameSite=Lax` cookie behavior across browser,
  proxy, and server clients.
- Authentication, checkout, operational-probe, order-route, and callback rate
  limits backed by atomic Upstash Redis counters shared across deployed
  instances. Local development retains a bounded in-process fallback.
- Strict UUID, OAuth code, internal redirect, text-field, numeric, and upload
  validation.
- Authenticated order API forwarding and user-safe upstream error responses.
- Vendor upload validation covering maximum size, MIME type, extension, magic
  signature, safe original name, and randomized stored name.
- Safe JSON-LD serialization to prevent dynamic values from closing a script
  element.
- Next.js upgraded from 16.2.12 to 16.3.0, with patched PostCSS and Sharp
  transitive versions pinned. The final dependency audit reports zero known
  vulnerabilities.

## Supabase review

Production project `zpygivfrlqndkgvgwrji` was inspected read-only. On 13 August
2026, the schema-compatible subset of the proposal was applied and tested on
staging project `nmxcmfkgtnhjhzmvqmrb`. Production was not changed. See
`docs/rls-staging-rehearsal-20260813.md`.

The production advisor still reports platform/database items that cannot be
closed safely from website code alone:

- RLS is disabled on the PostGIS `spatial_ref_sys` table in the exposed schema.
- the internal `rls_auto_enable()` helper and PostGIS estimated-extent helpers
  have broader execute grants than required;
- leaked-password protection is disabled;
- moving the PostGIS extension out of `public` needs a separate spatial upgrade
  rehearsal.

The existing proposal and rollback scripts were extended to address the first
two SQL-controlled findings while preserving names and service-role backend
access:

- `supabase/proposals/rls-security-performance.sql`
- `supabase/proposals/rls-security-performance.rollback.sql`

The production scripts remain proposal-only. Staging is missing many production
tables and PostGIS objects, so it cannot yet prove the full migration. Bring
staging to schema parity, apply the remainder, verify all application roles plus
Realtime and payments, rerun the advisors, and obtain explicit production
approval before applying anything to production.

## Cloudflare review

The Cloudflare zone is active. The apex, `www.streetplate.co.za`, and
`api.streetplate.co.za` are proxied. Railway TLS, API health, and the Socket.IO
handshake were verified through Cloudflare on 13 August 2026.

The `www` hostname still targets a Railway backend service that returns `404` at
the root. Point it to the eventual website deployment. PayFast ITN and auth
redirect regression tests remain required after that routing change. Add
Cloudflare rate-limit rules for public auth, checkout, and API paths.

## Known architectural limits

- Application quotas are shared through Upstash Redis in Preview and
  Production. This remains defense in depth; Cloudflare WAF controls are still
  required for volumetric traffic before it reaches the application.
- Supabase browser-session cookies cannot be `HttpOnly` without replacing the
  browser-side session refresh flow with a server-only authentication design.
- File signatures reject disguised content but are not malware scanning.
- The Google Maps browser key is designed to be client-visible and must be
  restricted by HTTP referrer and API scope in Google Cloud.

## Mobile and shared-backend impact

- Mobile repository files changed: **0**
- Mobile dependencies changed: **0**
- Mobile configuration changed: **0**
- Existing API contracts changed: **0**
- Supabase staging migrations applied by this security pass: **1**
- Supabase production migrations applied by this security pass: **0**
- RLS policies changed in production by this security pass: **0**
- Read-only mobile compatibility inspection completed: **yes**
- Compatible staging subset execution: **passed**
- Full staging compatibility execution: **pending schema parity**
