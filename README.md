# StreetPlate Web

The separate customer and driver web platform for StreetPlate, a South African local-food marketplace.

This repository is intentionally independent from [`baxmthembu/kasi-eats`](https://github.com/baxmthembu/kasi-eats). The mobile and backend repository is read-only reference material for this project.

## Live web scope

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4 with a custom StreetPlate design system
- Responsive home, discovery, vendor, cart, recruitment and legal pages
- Supabase SSR browser/server clients and request proxy
- Compatible email/password sign-in for existing accounts
- Cloudflare Turnstile protection for authentication and password recovery
- Server-side public vendor discovery through the existing Express API
- Live registration, password recovery, customer profile, addresses and favourites
- Live menus, one-vendor cart, server-validated checkout and PayFast handoff
- Customer-owned order history, status updates, cancellation and reviews
- Protected driver dashboard with availability, live delivery offers and foreground location updates
- Driver delivery workflow, Google Maps handoff, customer chat and canonical status transitions
- Driver earnings, wallet, weekly payouts, delivery history, vehicle and bank details
- Explicit demo fallbacks only when no backend URL is configured
- SEO metadata, sitemap, robots and generated Open Graph artwork
- Vitest and Testing Library setup
- ESLint, Prettier, CI and deployment documentation

Private onboarding documents, account deletion, customer-facing live driver tracking and a new admin portal remain approval-gated. See [Live services](./docs/live-services.md) for the exact compatibility boundary.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Add the existing Supabase project's browser-safe URL and publishable key to `.env.local`. Never add a service-role key to a `NEXT_PUBLIC_` variable.

### Local backend while Railway is unavailable

The website can load the existing `kasi-eats/backend` locally while continuing
to use the shared hosted Supabase project:

```bash
npm run dev:backend:local
```

The safe local launcher does not edit the `kasi-eats` repository. It also
disables the backend's automatic delivery-offer expiry interval and weekly
payout scheduler so starting a development server cannot perform those
production housekeeping writes against the shared database. User-triggered API
actions still use the existing authenticated backend contracts.

Point local website values at the launcher and restart Next.js:

```dotenv
STREETPLATE_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_SOCKET_URL=http://127.0.0.1:5000
```

The launcher automatically detects the standard OneDrive checkout. On another
computer, set `STREETPLATE_BACKEND_DIR` in the terminal environment before
starting it.

The managed `streetplate-web` Cloudflare Turnstile widget allows `streetplate.co.za`, `localhost` and `127.0.0.1`. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, server-only `TURNSTILE_SECRET`, and `TURNSTILE_HOSTNAMES`. Local development may allow all three hostnames; Production must set `TURNSTILE_HOSTNAMES=streetplate.co.za`. Never expose `TURNSTILE_SECRET` through a `NEXT_PUBLIC_` variable. Tokens on protected forms are verified server-side for success, exact action and exact hostname, and failed submissions reset the widget for a fresh single-use token.

## Environment variables

See [`.env.example`](./.env.example). The minimum values for shared authentication are:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Set `STREETPLATE_API_URL` to the existing backend origin with or without a trailing `/api` segment. Set `NEXT_PUBLIC_SOCKET_URL` to the existing Socket.IO origin. Without the live API, commerce and driver operations show explicit unavailable states; the website never invents driver balances, deliveries or offers.

Preview and Production also require `KV_REST_API_URL` and the server-only `KV_REST_API_TOKEN` from the connected Vercel Upstash resource. These values power one atomic rate-limit quota across every website instance. Local development falls back to a bounded in-memory limiter and does not require Redis.

An authenticated driver account enters at `/driver`. The browser must allow precise location while online. Web location sharing is foreground-only, so the dashboard tab must stay open during a delivery; the mobile driver app remains the better choice for background tracking.

## Commands

```bash
npm run dev
npm run check
npm run build
npm run format:check
npm run test:e2e
npm run validate:production-env
```

`npm run check` runs linting, TypeScript validation and unit/component tests. `npm run check:all` adds a production build and desktop/mobile browser journeys.

## Branch strategy

- `main`: protected, releasable code only
- `feature/*`: implementation work and pull requests
- `fix/*`: focused bug fixes
- `docs/*`: documentation-only work

The initial implementation branch is `feature/initial-streetplate-web`. Changes reach `main` through pull requests; direct development pushes to `main` are not allowed.

## Shared-system boundaries

- `baxmthembu/kasi-eats` files, branches, dependencies and configuration must remain unchanged.
- Existing API contracts remain unchanged unless a separate change is reviewed and approved.
- Supabase migrations are proposal-only until staging review and explicit approval.
- The existing Express backend remains the canonical order, price, PayFast and dispatch boundary.
- The existing Socket.IO service remains the realtime system; the website will not add a second one.

See [Architecture](./docs/architecture.md), [Live services](./docs/live-services.md), [Production readiness](./docs/production-readiness.md), [Security review](./docs/security-review-20260731.md), [Operations](./docs/operations-runbook.md), [Database change process](./docs/database-change-process.md), [Deployment](./docs/deployment.md) and [Mobile impact](./docs/mobile-impact.md).
