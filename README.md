# StreetPlate Web

The separate customer-facing web platform for StreetPlate, a South African local-food marketplace.

This repository is intentionally independent from [`baxmthembu/kasi-eats`](https://github.com/baxmthembu/kasi-eats). The mobile and backend repository is read-only reference material for this project.

## Phase-one scope

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4 with a custom StreetPlate design system
- Responsive home, discovery, vendor, cart, recruitment and legal pages
- Supabase SSR browser/server clients and request proxy
- Compatible email/password sign-in for existing accounts
- Server-side public vendor discovery through the existing Express API
- Explicit demo fallbacks when no backend URL is configured
- SEO metadata, sitemap, robots and generated Open Graph artwork
- Vitest and Testing Library setup
- ESLint, Prettier, CI and deployment documentation

Registration, password reset, checkout, payments, application uploads and live tracking are intentionally gated. The existing shared backend and database have compatibility/security issues that require a separately approved backend or database change. The website does not work around those controls in browser code.

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

## Environment variables

See [`.env.example`](./.env.example). The minimum values for shared authentication are:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Set `STREETPLATE_API_URL` to the existing backend origin without a trailing `/api` segment. Without it, public pages show clearly marked design fixtures.

## Commands

```bash
npm run dev
npm run check
npm run build
npm run format:check
```

`npm run check` runs linting, TypeScript validation and unit/component tests.

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

See [Architecture](./docs/architecture.md), [Database change process](./docs/database-change-process.md), [Deployment](./docs/deployment.md) and [Mobile impact](./docs/mobile-impact.md).
