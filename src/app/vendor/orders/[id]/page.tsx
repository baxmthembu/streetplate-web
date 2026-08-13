/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { ArrowLeft, MapPin, PackageCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorDataError } from "@/app/vendor/page";
import { VendorOrderStatusForm } from "@/components/vendor-forms";
import { StreetPlateApiError } from "@/lib/backend";
import { formatRand } from "@/lib/format";
import { getVendorOrder } from "@/lib/vendor-api";
import { vendorStatusLabels } from "@/lib/vendor-types";

export default async function VendorOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const { order } = await getVendorOrder(id);
    return (
      <div className="vendor-page">
        <Link className="vendor-back-link" href="/vendor/orders">
          <ArrowLeft size={17} />
          Back to orders
        </Link>
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Order detail</p>
            <h1>#{order.order_number ?? order.id.slice(0, 8)}</h1>
            <p>Placed {new Date(order.created_at).toLocaleString("en-ZA")}</p>
          </div>
          <span className={`vendor-status ${order.status}`}>
            {vendorStatusLabels[order.status]}
          </span>
        </header>
        <div className="vendor-detail-grid">
          <section className="vendor-dashboard-panel">
            <h2>Items to prepare</h2>
            <div className="vendor-menu-list">
              {order.order_items.map((item) => (
                <div key={item.id}>
                  <div>
                    <strong>
                      {item.quantity} × {item.name}
                    </strong>
                    {item.notes && <span>Note: {item.notes}</span>}
                  </div>
                  <strong>
                    {formatRand(Number(item.price) * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="vendor-order-total">
              <span>Subtotal</span>
              <strong>{formatRand(Number(order.subtotal))}</strong>
              <span>Order total</span>
              <strong>{formatRand(Number(order.total))}</strong>
            </div>
            {order.special_instructions && (
              <aside className="vendor-note">
                <PackageCheck size={20} />
                <div>
                  <strong>Special instructions</strong>
                  <p>{order.special_instructions}</p>
                </div>
              </aside>
            )}
          </section>
          <aside className="vendor-dashboard-panel">
            <h2>Fulfilment</h2>
            <div className="vendor-address">
              <MapPin size={21} />
              <div>
                <small>Deliver to</small>
                <p>{order.delivery_address}</p>
              </div>
            </div>
            <VendorOrderStatusForm order={order} />
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 404)
      notFound();
    return <VendorDataError error={error} />;
  }
}
