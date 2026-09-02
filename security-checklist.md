# StreetPlate website security checklist

Status key: ✅ implemented and verified; ⚠️ implemented in the application but
an infrastructure control remains; ⬜ requires an approved external change.

## Frontend security

| Status | Security measure                           | StreetPlate implementation                                                                                                                                                                          |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Use HTTPS everywhere                       | Production-host HTTP requests are redirected with `308`; production responses include HSTS and CSP `upgrade-insecure-requests`. Local HTTP remains available only for `localhost` and `127.0.0.1`.  |
| ✅     | Input validation and sanitization          | Public and authenticated actions use bounded, typed validation. Dynamic JSON-LD is escaped before insertion into HTML. Control characters and unsafe redirect values are rejected.                  |
| ✅     | Do not store sensitive data in the browser | Server secrets remain server-only. The browser stores only expected session/cart state; no service-role, Turnstile secret, PayFast secret, or backend credential is shipped to clients.             |
| ✅     | CSRF protection                            | Server Actions retain Next.js Origin/Host validation with a narrow production origin allowlist; auth cookies use `SameSite=Lax`. State-changing route handlers require authenticated bearer access. |
| ⚠️     | Never expose API keys in frontend          | Server secrets are not exposed. The Google Maps browser key is intentionally public and must remain restricted in Google Cloud to the production and local HTTP referrers.                          |

## Backend security

| Status | Security measure            | StreetPlate implementation                                                                                                                                                                                                                   |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Authentication fundamentals | Supabase Auth owns password hashing and session issuance. Server-side identity checks use verified claims/access tokens rather than trusting form identifiers.                                                                               |
| ⚠️     | Authorization checks        | Website mutations and private order routes require authenticated access and the backend remains the canonical authorization layer. The compatible RLS subset passed staging; full rehearsal still requires staging/production schema parity. |
| ✅     | API endpoint protection     | Private order access is authenticated and UUID-validated. OAuth callbacks validate codes and redirect destinations. Public operational probes expose status booleans only and are throttled.                                                 |
| ✅     | SQL injection prevention    | The website does not concatenate user input into SQL. Database hardening is supplied as proposal/rollback SQL and is not applied automatically.                                                                                              |
| ✅     | Basic security headers      | CSP, HSTS in production, frame denial, MIME sniffing prevention, referrer policy, permissions policy, cross-origin controls, and removal of the framework signature are configured globally.                                                 |
| ⚠️     | DDoS protection             | Atomic Upstash Redis counters enforce shared application quotas across website instances. The apex, `www.streetplate.co.za`, and `api.streetplate.co.za` are proxied through Cloudflare; explicit WAF rules remain an infrastructure task.   |

## Practical security habits

| Status | Security measure          | StreetPlate implementation                                                                                                                                                                                                                      |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Keep dependencies updated | Next.js and its ESLint config are pinned to `16.3.0`; vulnerable transitive PostCSS/Sharp versions are overridden with patched releases. `npm audit` reports zero vulnerabilities.                                                              |
| ✅     | Proper error handling     | Route handlers and actions return bounded user-safe messages and avoid returning upstream response bodies, exception details, internal URLs, or environment values.                                                                             |
| ⚠️     | Secure cookies            | Supabase cookies consistently use `Secure` in production, `SameSite=Lax`, and `Path=/`. They cannot be `HttpOnly` while the Supabase browser client reads/refreshes the shared session; changing that requires a server-only auth architecture. |
| ⚠️     | File upload security      | Vendor images are limited to 5 MB and validated by extension, declared MIME, magic bytes, safe filename, and randomized stored name. Malware scanning must be added at the backend/storage boundary for complete coverage.                      |
| ✅     | Rate limiting             | Auth, checkout, API, health, and readiness entry points use atomic Upstash Redis quotas shared across Preview/Production instances. Deployed environments fail closed if the shared store is missing or unavailable.                            |

## Required external follow-up

1. Point `www.streetplate.co.za` to a deployed website service; it is proxied
   but the current Railway backend target returns `404` at `/`.
2. Enable Supabase Auth leaked-password protection in the production dashboard.
3. Bring staging to production schema parity, apply the remainder of
   `supabase/proposals/rls-security-performance.sql`, rerun all role, Realtime,
   and payment tests, then request explicit production approval.
4. Add malware scanning/quarantine to the existing backend upload pipeline.
