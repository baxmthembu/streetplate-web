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

## Release checklist

- Pull request reviewed and CI green
- Preview tested on narrow and desktop viewports
- No demo content visible when production data is expected
- Supabase Auth redirects and cookie domain verified
- Existing mobile logins and order flows smoke-tested
- PayFast remains sandbox until separately approved
- No unapproved migrations pending or applied
- Rollback is the previous Vercel deployment and, when applicable, a reviewed SQL rollback

No production deployment is performed by the initial implementation.
