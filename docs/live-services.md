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
- role-protected driver profile, availability, vehicle and bank-detail endpoints
- driver offer accept/reject, active-delivery reads and canonical status transitions
- driver earnings, wallet, payout and completed-delivery history endpoints
- authenticated `/drivers` offer/earnings events and order-participant `/chat` events

The browser never receives the Supabase service-role key, PayFast signing secrets, Cloudinary credentials, or the backend Google Maps key.

## Email delivery

- Supabase Auth uses Resend custom SMTP through the verified `streetplate.co.za` domain.
- Registration verification and password recovery are sent as `StreetPlate Accounts <accounts@streetplate.co.za>`.
- Order creation, successful payment and completed-delivery messages are reserved for `StreetPlate Orders <orders@streetplate.co.za>`.
- Opt-in promotional messages are reserved for `StreetPlate Marketing <marketing@streetplate.co.za>` and must include unsubscribe handling.
- The Resend credential is stored only in Supabase's encrypted SMTP configuration. It is not stored in this repository or exposed to the browser.

The `orders@` and `marketing@` sender identities require no additional Resend domain on the free plan. Actual order/payment/delivery sends must be triggered from the canonical shared backend after verified backend events; marketing sends require a consent-backed audience. Those hooks remain an approval-gated shared-backend change.

## Approval gates

No shared backend or database change was made. These services require a separate reviewed change:

1. **Private onboarding documents.** The shared project has no storage buckets or vendor/driver application tables. See `supabase/proposals/onboarding.sql` and `onboarding.rollback.sql`; do not apply them without staging and explicit approval.
2. **Customer-facing driver-location realtime.** The driver portal may emit foreground locations through the authenticated `/drivers` namespace, which derives the driver identity from the verified token. The separate `/tracking` namespace still does not verify ownership when a customer joins an order room, so customer web tracking continues to use the ownership-protected order API. Add an order-role authorization check before enabling that customer socket.
3. **Password reset compatibility.** Supabase can update the Auth password, but the legacy public `users.password_hash` fallback may become stale. Remove or synchronize that fallback in a separately approved backend change.
4. **Account deletion.** A service-role operation and retention policy are needed; the website does not fake deletion.
5. **PayFast return URLs.** Existing return/cancel destinations belong to the backend. The website opens PayFast separately and keeps its authenticated tracking page available.
6. **Admin portal.** The live role enum and backend contract do not expose a complete web-admin role/API. Existing admin tooling remains canonical.
7. **Transactional and marketing email hooks.** Add idempotent Resend sends after canonical order creation, verified PayFast ITN payment success and completed delivery. Marketing must remain isolated from transactional logic and send only to opted-in contacts. This requires a separately approved change to the shared backend; the website must not infer payment success from the browser return URL.

## Known inherited risks

- The legacy public vendor-detail response selects `vendors(*)`. The website consumes it server-side and maps only approved public fields, but the backend endpoint itself should be changed to a column allow-list.
- Realtime is Socket.IO, not Supabase Realtime; the live project currently publishes no tables.
- Driver contract compatibility was statically verified against the existing Express routes, Socket.IO handler and mobile driver API service. Live multi-role regression still requires an active staging backend and dedicated customer, vendor, driver and admin accounts.
