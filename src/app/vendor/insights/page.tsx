/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import {
  BarChart3,
  CircleDollarSign,
  ShoppingBag,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { VendorDataError } from "@/app/vendor/page";
import { formatRand } from "@/lib/format";
import { getVendorAnalytics, getVendorTopItems } from "@/lib/vendor-api";

export default async function VendorInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const value = (await searchParams).period;
  const period = value === "day" || value === "month" ? value : "week";
  try {
    const [analytics, { items }] = await Promise.all([
      getVendorAnalytics(period),
      getVendorTopItems(),
    ]);
    const max = Math.max(...items.map((item) => item.quantity), 1);
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Business performance</p>
            <h1>Insights</h1>
            <p>
              Track sales, order volume, ratings and the meals customers choose
              most.
            </p>
          </div>
          <nav className="vendor-filter-tabs">
            {["day", "week", "month"].map((item) => (
              <Link
                key={item}
                className={period === item ? "active" : ""}
                href={`/vendor/insights?period=${item}`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </header>
        <section className="vendor-metric-grid">
          <article>
            <span>
              <CircleDollarSign size={21} />
            </span>
            <small>Revenue</small>
            <strong>{formatRand(analytics.revenue)}</strong>
          </article>
          <article>
            <span>
              <ShoppingBag size={21} />
            </span>
            <small>Orders</small>
            <strong>{analytics.orderCount}</strong>
          </article>
          <article>
            <span>
              <BarChart3 size={21} />
            </span>
            <small>Completed</small>
            <strong>{analytics.completedOrders}</strong>
          </article>
          <article>
            <span>
              <Star size={21} />
            </span>
            <small>Average rating</small>
            <strong>{Number(analytics.avgRating).toFixed(1)}</strong>
          </article>
        </section>
        <section className="vendor-dashboard-panel vendor-top-items">
          <div className="panel-heading">
            <h2>Top-selling items</h2>
            <Trophy size={21} />
          </div>
          {items.length ? (
            items.map((item, index) => (
              <div className="vendor-bar-row" key={`${item.name}-${index}`}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} sold · {formatRand(item.revenue)}
                  </span>
                </div>
                <div>
                  <i
                    style={{
                      width: `${Math.max(8, (item.quantity / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="vendor-empty-state">
              <BarChart3 size={28} />
              <strong>Not enough sales data yet</strong>
              <p>Your best sellers will appear after completed orders.</p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
