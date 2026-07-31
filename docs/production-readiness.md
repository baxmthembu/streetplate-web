# Production readiness

## Implemented in this repository

- production environment name and HTTPS validation
- liveness (`/api/health`) and dependency readiness (`/api/readiness`) endpoints
- global and route-level recoverable error experiences
- structured server error logging through Next.js instrumentation
- CSP, HSTS, framing, MIME, referrer and permissions headers
- private-route search-engine exclusions
- desktop/mobile Playwright journeys, cart persistence and automated accessibility checks
- opt-in live account journey using dedicated staging credentials
- two-stage CI: static/unit/build validation followed by browser tests
- standard Next.js Node output compatible with Vercel previews and `next start`

## Required before a production deployment

1. Merge the reviewed pull request into `main`.
2. Import the GitHub repository into Vercel and create separate Preview and Production environments.
3. Configure every required variable from `.env.example`; run `npm run validate:production-env` in the deployment environment.
4. Set Supabase Site URL and redirect allow-list entries for preview and production domains.
5. Allow those origins in the existing Express/Socket.IO backend CORS configuration.
6. Configure custom SMTP, email confirmation, leaked-password protection, CAPTCHA and appropriate Auth rate limits in Supabase.
7. Run `npm run test:e2e:live` against staging using a dedicated customer account.
8. Complete PayFast sandbox, vendor, driver and mobile regression journeys before enabling live payments.
9. Obtain South African legal review and publish real privacy/support contacts.

Production deployment is intentionally blocked when `/api/readiness` returns HTTP 503.

## Rollback

- Website: promote the previous known-good Vercel deployment.
- Configuration: restore the previous environment-variable version and re-deploy because browser-prefixed values are fixed at build time.
- Database: use only the reviewed rollback paired with an approved migration; never improvise a destructive rollback in production.
