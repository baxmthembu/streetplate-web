import type { NextConfig } from "next";

function origin(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function websocketOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.origin;
  } catch {
    return null;
  }
}

const connectSources = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
  "https://places.googleapis.com",
  origin(process.env.NEXT_PUBLIC_SOCKET_URL),
  websocketOrigin(process.env.NEXT_PUBLIC_SOCKET_URL),
].filter(Boolean);
const turnstileOrigin = "https://challenges.cloudflare.com";
const googleMapsOrigins =
  "https://maps.googleapis.com https://maps.gstatic.com";
const isProduction = process.env.NODE_ENV === "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstileOrigin} ${googleMapsOrigins}${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSources.join(" ")}`,
  `frame-src ${turnstileOrigin}`,
  "form-action 'self' https://*.payfast.co.za",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // These are the only additional trusted hosts used in front of the app.
      // Next.js continues to enforce its Origin/Host comparison for CSRF.
      allowedOrigins: [
        "streetplate.co.za",
        "www.streetplate.co.za",
        ...(isProduction ? [] : ["localhost:3000", "127.0.0.1:3000"]),
      ],
      // Menu images are validated at 5 MB; this leaves only multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
