import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Gift,
  Landmark,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import { getDriverPayouts, getDriverWallet } from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

export default async function DriverWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const params = await searchParams;
  const offset = Math.max(0, Number.parseInt(params.offset ?? "0", 10) || 0);
  const [walletResult, payoutsResult] = await Promise.allSettled([
    getDriverWallet(),
    getDriverPayouts(offset),
  ]);
  if (walletResult.status === "rejected") {
    return (
      <div className="driver-page">
        <DriverDataState error={walletResult.reason} />
      </div>
    );
  }
  const payoutsUnavailable = payoutsResult.status === "rejected";
  const walletData: [
    Awaited<ReturnType<typeof getDriverWallet>>,
    Awaited<ReturnType<typeof getDriverPayouts>>,
  ] = [
    walletResult.value,
    payoutsResult.status === "fulfilled"
      ? payoutsResult.value
      : { payouts: [], offset, limit: 20 },
  ];
  const [{ wallet, nextPayoutDate }, { payouts, limit }] = walletData;
  return (
    <div className="driver-page">
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Money centre</p>
          <h1>Wallet & payouts</h1>
          <p>
            See what is available, what is pending, and every weekly payout.
          </p>
        </div>
        <Link
          className="button button-light"
          href="/driver/profile#payout-details"
        >
          <Landmark size={18} aria-hidden="true" />
          Payout details
        </Link>
      </header>
      <section className="driver-wallet-hero">
        <div>
          <small>Available balance</small>
          <strong>{formatRand(Number(wallet.available_balance))}</strong>
          <span>Settled funds</span>
        </div>
        <div>
          <CalendarClock size={22} aria-hidden="true" />
          <p>
            <small>Next payout processing</small>
            <strong>
              {new Intl.DateTimeFormat("en-ZA", { dateStyle: "full" }).format(
                new Date(nextPayoutDate),
              )}
            </strong>
          </p>
        </div>
      </section>
      <section className="driver-metric-grid driver-metric-grid-four">
        <article>
          <span className="orange">
            <Banknote size={21} aria-hidden="true" />
          </span>
          <small>Pending balance</small>
          <strong>{formatRand(Number(wallet.pending_balance))}</strong>
        </article>
        <article>
          <span className="green">
            <TrendingUp size={21} aria-hidden="true" />
          </span>
          <small>Lifetime earnings</small>
          <strong>{formatRand(Number(wallet.lifetime_earnings))}</strong>
        </article>
        <article>
          <span className="yellow">
            <Gift size={21} aria-hidden="true" />
          </span>
          <small>Total tips</small>
          <strong>{formatRand(Number(wallet.total_tips))}</strong>
        </article>
        <article>
          <span className="orange">
            <Gift size={21} aria-hidden="true" />
          </span>
          <small>Total bonuses</small>
          <strong>{formatRand(Number(wallet.total_bonuses))}</strong>
        </article>
      </section>
      <section className="driver-section">
        <div className="driver-section-heading">
          <div>
            <p className="eyebrow">Weekly settlements</p>
            <h2>Payout history</h2>
          </div>
        </div>
        {payoutsUnavailable ? (
          <div className="driver-section-notice" role="status">
            <AlertTriangle size={22} aria-hidden="true" />
            <div>
              <h3>Payout history is not available yet</h3>
              <p>
                Your live wallet is working, but payout history has not been
                enabled in the shared StreetPlate database. No balance data is
                affected.
              </p>
            </div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="driver-empty">
            <h3>No payouts yet</h3>
            <p>
              Weekly payouts appear here after your first completed payout
              cycle.
            </p>
          </div>
        ) : (
          <div className="driver-payout-list">
            {payouts.map((payout) => (
              <article key={payout.id}>
                <div>
                  <span className={`driver-status-badge ${payout.status}`}>
                    {payout.status.replaceAll("_", " ")}
                  </span>
                  <h3>
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                    }).format(new Date(payout.week_start))}{" "}
                    –{" "}
                    {new Intl.DateTimeFormat("en-ZA", {
                      dateStyle: "medium",
                    }).format(new Date(payout.week_end))}
                  </h3>
                  <p>
                    {payout.delivery_count} deliveries ·{" "}
                    {formatRand(Number(payout.tips_total ?? 0))} tips ·{" "}
                    {formatRand(Number(payout.bonuses_total ?? 0))} bonuses
                  </p>
                </div>
                <strong>{formatRand(Number(payout.total_amount))}</strong>
                <details className="driver-payout-breakdown">
                  <summary>View payout details</summary>
                  <div>
                    <span>Distance fees</span>
                    <strong>
                      {formatRand(Number(payout.distance_fee_total ?? 0))}
                    </strong>
                  </div>
                  <div>
                    <span>Tips</span>
                    <strong>
                      {formatRand(Number(payout.tips_total ?? 0))}
                    </strong>
                  </div>
                  <div>
                    <span>Bonuses</span>
                    <strong>
                      {formatRand(Number(payout.bonuses_total ?? 0))}
                    </strong>
                  </div>
                  <div>
                    <span>Platform fees</span>
                    <strong>
                      −{formatRand(Number(payout.commission_total ?? 0))}
                    </strong>
                  </div>
                  {payout.bank_name && (
                    <p>
                      Paid to {payout.bank_name} ···
                      {payout.account_number?.slice(-4)}
                    </p>
                  )}
                  {payout.admin_notes && <p>Note: {payout.admin_notes}</p>}
                  {payout.paid_at && (
                    <p>
                      Paid{" "}
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "long",
                      }).format(new Date(payout.paid_at))}
                    </p>
                  )}
                </details>
              </article>
            ))}
          </div>
        )}
        <div className="driver-pagination">
          {offset > 0 && (
            <Link href={`/driver/wallet?offset=${Math.max(0, offset - limit)}`}>
              Newer payouts
            </Link>
          )}
          {payouts.length === limit && (
            <Link href={`/driver/wallet?offset=${offset + limit}`}>
              Older payouts
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
