# Deployment

## Recommended environments

- Local: developer machine with `.env.local`
- Staging: Vercel preview/branch environment connected to staging-safe backend values
- Production: Vercel production environment after explicit launch approval

The existing Railway-hosted Express API and shared Supabase project remain separate services.

## Vercel setup

1. Import `baxmthembu/streetplate-web`.
2. Set the framework preset to Next.js.
3. Set the production branch to `main`.
4. Add environment variables separately for Preview and Production.
5. Run `npm run check` and `npm run build` before promotion.
6. Verify auth callback/site URLs in Supabase before enabling login on a new domain.
7. Confirm backend CORS permits only approved website origins.
8. Do not add `SUPABASE_SERVICE_ROLE_KEY`, PayFast credentials, Cloudinary credentials or the backend Maps key to this website.
9. Configure `STREETPLATE_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the approved existing backend origin.
10. Configure the managed `streetplate-web` Cloudflare Turnstile widget values as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, server-only `TURNSTILE_SECRET`, and `TURNSTILE_HOSTNAMES=streetplate.co.za`. The widget itself permits localhost for development, but the Production backend allowlist must never contain `localhost` or `127.0.0.1`.
11. Run `npm run validate:production-env` in each configured deployment environment.
12. Configure the hosting health check to `/api/health` and gate traffic on `/api/readiness` returning HTTP 200.
13. Connect the Vercel-managed Upstash Redis resource to both Preview and Production. Confirm `KV_REST_API_URL` and server-only `KV_REST_API_TOKEN` exist in each environment, then redeploy so all instances share atomic rate-limit counters.

## Release checklist

- Pull request reviewed and CI green
- Preview tested on narrow and desktop viewports
- No demo content visible when production data is expected
- Supabase Auth redirects and cookie domain verified
- Turnstile succeeds across protected authentication and password forms, rejects missing, wrong-action, wrong-hostname and replayed tokens, and reports validation events in Cloudflare analytics
- Existing mobile logins and order flows smoke-tested
- Shared Redis limits tested in Preview, including a blocked request and `Retry-After` response metadata
- PayFast remains sandbox until separately approved
- No unapproved migrations pending or applied
- Rollback is the previous Vercel deployment and, when applicable, a reviewed SQL rollback
- Desktop/mobile Playwright tests and the opt-in staging account journey are green

No production deployment is performed by the initial implementation.
