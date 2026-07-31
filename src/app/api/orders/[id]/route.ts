import { NextResponse } from "next/server";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import type { CustomerOrder } from "@/lib/commerce-types";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/orders/[id]">,
) {
  const { id } = await params;
  try {
    const payload = await streetPlateApi<{ order: CustomerOrder }>(
      `/orders/${encodeURIComponent(id)}`,
    );
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = error instanceof StreetPlateApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order unavailable" },
      { status },
    );
  }
}
