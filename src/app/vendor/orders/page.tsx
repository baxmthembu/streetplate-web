/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { Clock3 } from "lucide-react";
import Link from "next/link";
import { VendorDataError } from "@/app/vendor/page";
import { getVendorOrders } from "@/lib/vendor-api";
import { formatRand } from "@/lib/format";
import { vendorStatusLabels } from "@/lib/vendor-types";

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "active" } = await searchParams;
  try {
    const { orders } = await getVendorOrders("limit=100");
    const filtered = orders.filter((order) =>
      status === "all"
        ? true
        : status === "active"
          ? !["delivered", "cancelled"].includes(order.status)
          : order.status === status,
    );
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Order management</p>
            <h1>Orders</h1>
            <p>
              Confirm orders, keep preparation moving and hand completed meals
              to drivers.
            </p>
          </div>
        </header>
        <nav className="vendor-filter-tabs" aria-label="Order filters">
          {[
            "active",
            "pending",
            "preparing",
            "ready_for_pickup",
            "delivered",
            "cancelled",
            "all",
          ].map((value) => (
            <Link
              key={value}
              href={`/vendor/orders?status=${value}`}
              className={status === value ? "active" : ""}
            >
              {value.replaceAll("_", " ")}
            </Link>
          ))}
        </nav>
        {filtered.length ? (
          <div className="vendor-card-list">
            {filtered.map((order) => (
              <Link
                className="vendor-order-card"
                href={`/vendor/orders/${order.id}`}
                key={order.id}
              >
                <div className="vendor-order-icon">
                  <Clock3 size={21} />
                </div>
                <div>
                  <small>
                    {new Date(order.created_at).toLocaleString("en-ZA")}
                  </small>
                  <h2>Order #{order.order_number ?? order.id.slice(0, 8)}</h2>
                  <p>
                    {order.order_items
                      ?.map((item) => `${item.quantity}× ${item.name}`)
                      .join(", ") || "Order items"}
                  </p>
                </div>
                <div>
                  <span className={`vendor-status ${order.status}`}>
                    {vendorStatusLabels[order.status]}
                  </span>
                  <strong>{formatRand(Number(order.total))}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="vendor-empty-state vendor-empty-wide">
            <Clock3 size={30} />
            <strong>No {status.replaceAll("_", " ")} orders</strong>
            <p>Orders matching this filter will appear here.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
