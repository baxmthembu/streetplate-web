import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import { getDriverEarnings } from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

const periods = ["daily", "weekly", "all"] as const;
export default async function DriverEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = periods.includes(params.period as (typeof periods)[number])
    ? (params.period as (typeof periods)[number])
    : "weekly";
  let earningsData: Awaited<ReturnType<typeof getDriverEarnings>>;
  try {
    earningsData = await getDriverEarnings(period);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const { summary, earnings } = earningsData;
  return (
    <div className="driver-page">
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Your performance</p>
          <h1>Earnings</h1>
          <p>
            Transparent delivery pay, tips, bonuses and commission for every
            completed trip.
          </p>
        </div>
      </header>
      <nav className="driver-period-tabs" aria-label="Earnings period">
        {periods.map((item) => (
          <Link
            key={item}
            href={`/driver/earnings?period=${item}`}
            className={period === item ? "active" : ""}
          >
            {item === "daily"
              ? "Today"
              : item === "weekly"
                ? "This week"
                : "All time"}
          </Link>
        ))}
      </nav>
      <section className="driver-earnings-hero">
        <small>Net earnings</small>
        <strong>{formatRand(summary.total_net)}</strong>
        <span>
          {summary.delivery_count}{" "}
          {summary.delivery_count === 1 ? "delivery" : "deliveries"} ·{" "}
          {formatRand(summary.avg_per_delivery)} average
        </span>
      </section>
      <section className="driver-metric-grid driver-metric-grid-four">
        <article>
          <small>Tips</small>
          <strong>{formatRand(summary.total_tips)}</strong>
        </article>
        <article>
          <small>Bonuses</small>
          <strong>{formatRand(summary.total_bonuses)}</strong>
        </article>
        <article>
          <small>Commission</small>
          <strong>{formatRand(summary.total_commission)}</strong>
        </article>
        <article>
          <small>Deliveries</small>
          <strong>{summary.delivery_count}</strong>
        </article>
      </section>
      <section className="driver-section">
        <div className="driver-section-heading">
          <div>
            <p className="eyebrow">Payment ledger</p>
            <h2>Delivery breakdown</h2>
          </div>
        </div>
        {earnings.length === 0 ? (
          <div className="driver-empty">
            <h3>No earnings in this period</h3>
            <p>Completed deliveries will appear here automatically.</p>
          </div>
        ) : (
          <div className="driver-table-wrap">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Delivery</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Tip</th>
                  <th>Bonus</th>
                  <th>Net payout</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((earning) => (
                  <tr key={earning.id}>
                    <td>
                      <Link href={`/driver/deliveries/${earning.order_id}`}>
                        #{earning.order_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(earning.created_at))}
                    </td>
                    <td>{Number(earning.distance_km ?? 0).toFixed(1)} km</td>
                    <td>{formatRand(Number(earning.tip_amount ?? 0))}</td>
                    <td>{formatRand(Number(earning.bonus_amount ?? 0))}</td>
                    <td>
                      <strong>{formatRand(Number(earning.net_payout))}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
