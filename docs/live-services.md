# Live services and compatibility gates

## Reused without contract changes

- Supabase Auth accounts and SSR sessions
- `POST /api/auth/register` and `/api/auth/forgot-password`
- public vendor listing and server-whitelisted vendor/menu details
- customer profile, addresses and favourites endpoints
- server-priced `POST /api/orders`, customer-owned order reads and cancellation
- signed PayFast payment data and backend ITN verification
- authenticated `/orders` Socket.IO status events, with secure order polling as fallback
- delivered-order vendor and driver reviews

The browser never receives the Supabase service-role key, PayFast signing secrets, Cloudinary credentials, or the backend Google Maps key.

## Approval gates

No shared backend or database change was made. These services require a separate reviewed change:

1. **Private onboarding documents.** The shared project has no storage buckets or vendor/driver application tables. See `supabase/proposals/onboarding.sql` and `onboarding.rollback.sql`; do not apply them without staging and explicit approval.
2. **Driver-location realtime.** The existing `/tracking` Socket.IO namespace authenticates a user but does not verify ownership of the requested order. Web tracking therefore uses the ownership-protected order API. Add an order-role authorization check before enabling the location socket.
3. **Password reset compatibility.** Supabase can update the Auth password, but the legacy public `users.password_hash` fallback may become stale. Remove or synchronize that fallback in a separately approved backend change.
4. **Account deletion.** A service-role operation and retention policy are needed; the website does not fake deletion.
5. **PayFast return URLs.** Existing return/cancel destinations belong to the backend. The website opens PayFast separately and keeps its authenticated tracking page available.
6. **Admin portal.** The live role enum and backend contract do not expose a complete web-admin role/API. Existing admin tooling remains canonical.

## Known inherited risks

- The legacy public vendor-detail response selects `vendors(*)`. The website consumes it server-side and maps only approved public fields, but the backend endpoint itself should be changed to a column allow-list.
- Realtime is Socket.IO, not Supabase Realtime; the live project currently publishes no tables.
- Exact mobile source regression is unavailable because the customer, vendor and driver app paths are unresolved gitlinks in the reference checkout.
