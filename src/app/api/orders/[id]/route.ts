import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import type { CustomerOrder } from "@/lib/commerce-types";
import { rateLimitRequest } from "@/lib/security/rate-limit";
import {
  secureJson,
  tooManyRequests,
  withRateLimitHeaders,
} from "@/lib/security/responses";
import { isUuid } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

function publicOrderError(error: unknown): { status: number; message: string } {
  if (!(error instanceof StreetPlateApiError)) {
    return {
      status: 500,
      message: "Order details are temporarily unavailable.",
    };
  }

  switch (error.status) {
    case 401:
      return { status: 401, message: "Sign in to view this order." };
    case 403:
      return { status: 403, message: "You cannot view this order." };
    case 404:
      return { status: 404, message: "Order not found." };
    case 429:
      return { status: 429, message: "Please wait before refreshing again." };
    case 503:
      return {
        status: 503,
        message: "Order details are temporarily unavailable.",
      };
    default:
      return {
        status: 502,
        message: "Order details are temporarily unavailable.",
      };
  }
}

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/orders/[id]">,
) {
  const rateLimit = await rateLimitRequest(request, "order-detail", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  const { id } = await params;
  if (!isUuid(id)) {
    return withRateLimitHeaders(
      secureJson({ error: "A valid order ID is required." }, { status: 400 }),
      rateLimit,
    );
  }

  try {
    const payload = await streetPlateApi<{ order: CustomerOrder }>(
      `/orders/${encodeURIComponent(id)}`,
    );
    return withRateLimitHeaders(secureJson(payload), rateLimit);
  } catch (error) {
    const publicError = publicOrderError(error);
    return withRateLimitHeaders(
      secureJson(
        { error: publicError.message },
        { status: publicError.status },
      ),
      rateLimit,
    );
  }
}
