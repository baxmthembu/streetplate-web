import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isProductionHostname =
    hostname === "streetplate.co.za" || hostname === "www.streetplate.co.za";
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  if (
    isProductionHostname &&
    (forwardedProtocol === "http" ||
      (!forwardedProtocol && request.nextUrl.protocol === "http:"))
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return Response.redirect(secureUrl, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
