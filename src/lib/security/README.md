# Website route security

The helpers in this directory provide defense in depth for StreetPlate's Next.js
route handlers:

- validated and hashed proxy IP hints for rate-limit partitioning;
- shared, atomic Redis fixed-window request limits in Preview and Production;
- consistent non-cacheable JSON and redirect responses;
- UUID, OAuth-code, and trusted-origin validation.

## Deployment boundary

Preview and Production use an atomic Upstash Redis counter shared by every
website instance. Redis keys contain only a one-way hash of the application
namespace and validated client partition, and deployment tiers use separate
namespaces. If Redis is missing or unavailable in a deployed environment, the
limiter fails closed. Local development and tests retain a bounded in-process
fallback so localhost does not depend on external infrastructure. Forwarded IP
headers remain proxy hints, not an authentication factor.

Production must retain an upstream CDN/WAF rate limit for `streetplate.co.za`
and `api.streetplate.co.za`. Configure the proxy to overwrite client-supplied
forwarded-IP headers. Redis protects application quotas; the CDN/WAF remains the
first line of defense against volumetric traffic.

Health and readiness endpoints intentionally remain unauthenticated so load
balancers can use them. Their responses contain only booleans and service
status, never environment values, credentials, internal URLs, or exception
details.
