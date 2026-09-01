import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lets server components read the current pathname (e.g. to render the
// /mobile/turnstile bridge without the site chrome) without duplicating
// Next.js's own route matching.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/:path*",
};
