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

## Driver portal

The protected `/driver` route family uses the same Supabase SSR session as mobile and delegates authorization to existing role-protected Express endpoints. Server Components fetch profile, active delivery, earnings, wallet, payouts, history and order chat. Server Actions send availability, offer, delivery-status, vehicle, bank and chat mutations through the same bearer-authenticated API contracts.

The client connects to the existing authenticated `/drivers` Socket.IO namespace for offers and earnings/wallet invalidation. Browser geolocation is emitted only while the driver is online and the portal is open. The `/chat` namespace independently verifies order participation before joining an order room. No Supabase tables, RLS policies, publications or realtime channels were added.

## Compatibility gates

- Registration currently creates both `auth.users` and `public.users` through the backend. Direct Supabase sign-up could create an orphan profile.
- Password reset currently risks desynchronising the Supabase password and the backend's duplicate password hash.
- Checkout must not trust browser prices; order totals need a transactional backend calculation.
- Vendor/driver compliance uploads require new private storage and access policies.
- Customer-facing live tracking remains disabled until the `/tracking` room join verifies order participation. The driver portal can safely emit locations through the authenticated `/drivers` namespace, while customer pages continue using the ownership-protected order endpoint.

Each gate must be resolved in a separate, backwards-compatible change with staging validation and explicit approval.
