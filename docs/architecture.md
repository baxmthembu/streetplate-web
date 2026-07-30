# Architecture

## Runtime

- Next.js App Router on Vercel is the recommended web runtime.
- Server Components render public discovery and marketplace content.
- Small Client Components handle forms and cart interaction.
- Supabase SSR uses request-scoped server clients, secure cookies and `auth.getClaims()` for trusted server-side identity.
- The existing Express API remains the canonical commerce boundary.
- The existing Socket.IO server remains the realtime boundary.

## Data paths

Public vendor listing uses the existing `GET /api/vendors` contract because it returns an explicit public-safe projection. The website deliberately does not call `GET /api/vendors/:id` in phase one because that route selects every vendor column, including fields that should not be public.

Authenticated writes should flow through one of two reviewed paths:

1. Existing Express endpoints where the current mobile contract and server-side business rules are sound.
2. Supabase user-scoped queries only after the relevant RLS policy has been verified for customer, vendor, driver and admin workflows.

The browser never receives the Supabase service-role key, PayFast passphrase, Google server key or Cloudinary secret.

## Compatibility gates

- Registration currently creates both `auth.users` and `public.users` through the backend. Direct Supabase sign-up could create an orphan profile.
- Password reset currently risks desynchronising the Supabase password and the backend's duplicate password hash.
- Checkout must not trust browser prices; order totals need a transactional backend calculation.
- Vendor/driver compliance uploads require new private storage and access policies.
- Realtime tracking requires order-scoped Socket.IO authorization before web rollout.

Each gate must be resolved in a separate, backwards-compatible change with staging validation and explicit approval.
