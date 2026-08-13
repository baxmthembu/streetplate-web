import { MapPin, Star } from "lucide-react";
import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import { getDriverHistory } from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

export default async function DriverHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const params = await searchParams;
  const offset = Math.max(0, Number.parseInt(params.offset ?? "0", 10) || 0);
  let historyData: Awaited<ReturnType<typeof getDriverHistory>>;
  try {
    historyData = await getDriverHistory(offset);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const { orders, limit } = historyData;
  const total = orders.reduce(
    (sum, order) =>
      sum + Number(order.earnings?.net_payout ?? order.driver_payout ?? 0),
    0,
  );
  const now = new Date();
  const monthOrders = orders.filter((order) => {
    const date = new Date(order.updated_at ?? order.created_at ?? 0);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
  const monthTotal = monthOrders.reduce(
    (sum, order) =>
      sum + Number(order.earnings?.net_payout ?? order.driver_payout ?? 0),
    0,
  );
  return (
    <div className="driver-page">
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Completed work</p>
          <h1>Delivery history</h1>
          <p>
            Review completed trips, payouts, distance and customer feedback.
          </p>
        </div>
        {orders.length > 0 && (
          <div className="driver-rating">
            <strong>{formatRand(total)}</strong>
            <span>shown on this page</span>
          </div>
        )}
      </header>
      <section className="driver-history-summary">
        <div>
          <small>This month</small>
          <strong>{formatRand(monthTotal)}</strong>
          <span>Total earned</span>
        </div>
        <div>
          <small>Completed</small>
          <strong>{monthOrders.length}</strong>
          <span>Deliveries this month</span>
        </div>
      </section>
      {orders.length === 0 ? (
        <div className="driver-empty driver-empty-large">
          <h2>No completed deliveries yet</h2>
          <p>
            Your delivered orders will appear here with their final earning
            breakdown.
          </p>
        </div>
      ) : (
        <section className="driver-history-grid">
          {orders.map((order) => (
            <Link
              href={`/driver/deliveries/${order.id}`}
              key={order.id}
              className="driver-history-card"
            >
              <div className="driver-history-top">
                <div>
                  <small>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.updated_at ?? Date.now()))}
                  </small>
                  <h2>
                    {order.vendors?.business_name ?? "StreetPlate vendor"}
                  </h2>
                </div>
                <strong>
                  {formatRand(
                    Number(
                      order.earnings?.net_payout ?? order.driver_payout ?? 0,
                    ),
                  )}
                </strong>
              </div>
              <p>
                <MapPin size={16} aria-hidden="true" />
                {order.delivery_address}
              </p>
              <div className="driver-history-meta">
                <span>
                  {Number(order.earnings?.distance_km ?? 0).toFixed(1)} km
                </span>
                <span>
                  {formatRand(Number(order.earnings?.tip_amount ?? 0))} tip
                </span>
                {order.review && (
                  <span>
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    {order.review.rating}
                  </span>
                )}
              </div>
              {order.review?.comment && (
                <blockquote>“{order.review.comment}”</blockquote>
              )}
            </Link>
          ))}
        </section>
      )}
      <div className="driver-pagination">
        {offset > 0 && (
          <Link href={`/driver/history?offset=${Math.max(0, offset - limit)}`}>
            Newer deliveries
          </Link>
        )}
        {orders.length === limit && (
          <Link href={`/driver/history?offset=${offset + limit}`}>
            Older deliveries
          </Link>
        )}
      </div>
    </div>
  );
}
