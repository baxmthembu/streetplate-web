import {
  Check,
  ChevronLeft,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import { DriverStatusForm } from "@/components/driver-status-form";
import { getDriverOrder } from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

const deliverySteps = [
  { status: "confirmed", label: "Pick up" },
  { status: "picked_up", label: "Collected" },
  { status: "on_the_way", label: "En route" },
  { status: "delivered", label: "Done" },
] as const;

function mapsLink(
  latitude?: number | null,
  longitude?: number | null,
  address?: string | null,
) {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : address;
  return query
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
    : null;
}

export default async function DriverDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let orderData: Awaited<ReturnType<typeof getDriverOrder>>;
  try {
    orderData = await getDriverOrder(id);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const { order } = orderData;
  const pickupMap = mapsLink(
    order.vendors?.latitude,
    order.vendors?.longitude,
    order.vendors?.address,
  );
  const dropoffMap = mapsLink(
    order.delivery_latitude,
    order.delivery_longitude,
    order.delivery_address,
  );
  const progressStatus =
    order.status === "ready_for_pickup" ? "confirmed" : order.status;
  const currentStep = deliverySteps.findIndex(
    ({ status }) => status === progressStatus,
  );
  return (
    <div className="driver-page">
      <Link className="driver-back-link" href="/driver">
        <ChevronLeft size={18} aria-hidden="true" />
        Back to Drive
      </Link>
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">
            {order.order_number ?? `Delivery #${order.id.slice(0, 8)}`}
          </p>
          <h1>Active delivery</h1>
          <p>
            Follow the pickup and drop-off sequence, then update the status at
            each milestone.
          </p>
        </div>
        <span className="driver-status-badge">
          {order.status.replaceAll("_", " ")}
        </span>
      </header>
      <ol className="driver-order-progress" aria-label="Delivery progress">
        {deliverySteps.map((step, index) => (
          <li
            key={step.status}
            className={index <= currentStep ? "complete" : ""}
          >
            <span>
              {index < currentStep ? (
                <Check size={18} strokeWidth={3} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <strong>{step.label}</strong>
          </li>
        ))}
      </ol>
      <section className="driver-delivery-grid">
        <article className="driver-journey-card">
          <div className="driver-route-points driver-route-points-large">
            <div>
              <span className="pickup">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <div>
                <small>1 · Pick up</small>
                <h2>{order.vendors?.business_name ?? "StreetPlate vendor"}</h2>
                <p>{order.vendors?.address ?? "Vendor pickup location"}</p>
                {pickupMap && (
                  <a href={pickupMap} target="_blank" rel="noreferrer">
                    <Navigation size={16} aria-hidden="true" />
                    Navigate to pickup
                  </a>
                )}
              </div>
            </div>
            <div>
              <span className="dropoff">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <div>
                <small>2 · Drop off</small>
                <h2>Customer</h2>
                <p>{order.delivery_address}</p>
                {dropoffMap && (
                  <a href={dropoffMap} target="_blank" rel="noreferrer">
                    <Navigation size={16} aria-hidden="true" />
                    Navigate to customer
                  </a>
                )}
              </div>
            </div>
          </div>
          <DriverStatusForm order={order} />
        </article>
        <aside className="driver-delivery-summary">
          <span>
            <PackageCheck size={25} aria-hidden="true" />
          </span>
          <h2>Delivery summary</h2>
          <div>
            <small>Your payout</small>
            <strong>{formatRand(Number(order.driver_payout ?? 0))}</strong>
          </div>
          {order.tip_amount != null && (
            <div>
              <small>Customer tip</small>
              <strong>{formatRand(Number(order.tip_amount))}</strong>
            </div>
          )}
          <Link
            className="button button-dark"
            href={`/driver/deliveries/${order.id}/chat`}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Message customer
          </Link>
          <p className="small-print">
            For safety, the dashboard opens turn-by-turn directions in Google
            Maps. Confirm statuses only after completing each physical step.
          </p>
        </aside>
      </section>
      {order.order_items && order.order_items.length > 0 && (
        <section className="driver-section">
          <div className="driver-section-heading">
            <div>
              <p className="eyebrow">Pickup check</p>
              <h2>Order items</h2>
            </div>
          </div>
          <div className="driver-item-list">
            {order.order_items.map((item, index) => (
              <div key={item.id ?? `${item.name}-${index}`}>
                <span>{item.quantity}×</span>
                <strong>{item.name}</strong>
                {item.price != null && (
                  <small>
                    {formatRand(Number(item.price) * item.quantity)}
                  </small>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
