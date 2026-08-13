/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { CircleDollarSign, Clock3, Landmark, WalletCards } from "lucide-react";
import { VendorDataError } from "@/app/vendor/page";
import { formatRand } from "@/lib/format";
import {
  getVendorEarnings,
  getVendorPayouts,
  getVendorWallet,
} from "@/lib/vendor-api";

export default async function VendorEarningsPage() {
  try {
    const [{ wallet }, { payouts }, earnings] = await Promise.all([
      getVendorWallet(),
      getVendorPayouts(),
      getVendorEarnings(),
    ]);
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Money & settlements</p>
            <h1>Earnings</h1>
            <p>See available funds, pending order income and payout history.</p>
          </div>
        </header>
        <section className="vendor-metric-grid">
          <article>
            <span>
              <WalletCards size={21} />
            </span>
            <small>Available balance</small>
            <strong>{formatRand(Number(wallet.available_balance))}</strong>
          </article>
          <article>
            <span>
              <Clock3 size={21} />
            </span>
            <small>Pending balance</small>
            <strong>{formatRand(Number(wallet.pending_balance))}</strong>
          </article>
          <article>
            <span>
              <CircleDollarSign size={21} />
            </span>
            <small>Lifetime earnings</small>
            <strong>{formatRand(Number(wallet.lifetime_earnings))}</strong>
          </article>
          <article>
            <span>
              <Landmark size={21} />
            </span>
            <small>Orders paid</small>
            <strong>{wallet.total_orders}</strong>
          </article>
        </section>
        <section className="vendor-dashboard-panel">
          <div className="panel-heading">
            <h2>Payout history</h2>
            <span>{formatRand(earnings.total)} reported earnings</span>
          </div>
          {payouts.length ? (
            <div className="vendor-payout-table">
              <div className="table-head">
                <span>Date</span>
                <span>Status</span>
                <span>Amount</span>
              </div>
              {payouts.map((payout) => (
                <div key={payout.id}>
                  <span>
                    {new Date(
                      payout.processed_at ?? payout.created_at,
                    ).toLocaleDateString("en-ZA")}
                  </span>
                  <span className={`vendor-status ${payout.status}`}>
                    {payout.status}
                  </span>
                  <strong>{formatRand(Number(payout.amount))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="vendor-empty-state">
              <Landmark size={28} />
              <strong>No payouts yet</strong>
              <p>Completed settlements will appear here.</p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
