/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import {
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Landmark,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { VendorDataError } from "@/app/vendor/page";
import { formatRand } from "@/lib/format";
import {
  getVendorEarnings,
  getVendorPayouts,
  getVendorWallet,
} from "@/lib/vendor-api";

export default async function VendorEarningsPage() {
  try {
    const [walletResult, payoutsResult, earningsResult] =
      await Promise.allSettled([
        getVendorWallet(),
        getVendorPayouts(),
        getVendorEarnings(),
      ]);

    // Earnings is the canonical read model for this page. Wallet and payout
    // history are optional enhancements so a failure in either endpoint does
    // not hide otherwise valid earnings data from the vendor.
    if (earningsResult.status === "rejected") throw earningsResult.reason;

    const earnings = earningsResult.value;
    const wallet =
      walletResult.status === "fulfilled" ? walletResult.value.wallet : null;
    const payouts =
      payoutsResult.status === "fulfilled" ? payoutsResult.value.payouts : null;
    const settlementDataAvailable = wallet !== null && payouts !== null;
    const unavailableSettlementLabel = [
      wallet === null ? "Live balance" : null,
      payouts === null ? "payout history" : null,
    ]
      .filter(Boolean)
      .join(" and ");

    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Money & settlements</p>
            <h1>Earnings</h1>
            <p>See available funds, pending order income and payout history.</p>
          </div>
        </header>
        {wallet ? (
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
        ) : (
          <section className="vendor-metric-grid">
            <article>
              <span>
                <CircleDollarSign size={21} />
              </span>
              <small>This month&apos;s reported earnings</small>
              <strong>{formatRand(earnings.total)}</strong>
            </article>
            <article>
              <span>
                <ReceiptText size={21} />
              </span>
              <small>Completed payments</small>
              <strong>{earnings.transactions.length}</strong>
            </article>
          </section>
        )}
        {!settlementDataAvailable ? (
          <div className="vendor-data-notice" role="status">
            <CircleAlert size={20} aria-hidden="true" />
            <p>
              {unavailableSettlementLabel}{" "}
              {wallet === null && payouts === null ? "are" : "is"} temporarily
              unavailable. Your completed-payment earnings are still shown
              below.
            </p>
          </div>
        ) : null}
        <section className="vendor-dashboard-panel">
          <div className="panel-heading">
            <h2>{payouts ? "Payout history" : "Completed payment history"}</h2>
            <span>{formatRand(earnings.total)} reported earnings</span>
          </div>
          {payouts?.length ? (
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
                      payout.paid_at ?? payout.created_at,
                    ).toLocaleDateString("en-ZA")}
                  </span>
                  <span className={`vendor-status ${payout.status}`}>
                    {payout.status}
                  </span>
                  <strong>{formatRand(Number(payout.total_amount))}</strong>
                </div>
              ))}
            </div>
          ) : payouts === null && earnings.transactions.length ? (
            <div className="vendor-payout-table">
              <div className="table-head">
                <span>Date</span>
                <span>Order</span>
                <span>Amount</span>
              </div>
              {earnings.transactions.map((transaction) => (
                <div key={transaction.id}>
                  <span>
                    {new Date(
                      transaction.paid_at ?? transaction.created_at,
                    ).toLocaleDateString("en-ZA")}
                  </span>
                  <span>
                    {transaction.orders?.order_number
                      ? `#${transaction.orders.order_number}`
                      : "Completed"}
                  </span>
                  <strong>
                    {formatRand(Number(transaction.vendor_payout))}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="vendor-empty-state">
              <Landmark size={28} />
              <strong>
                {payouts === null
                  ? "No completed payments yet"
                  : "No payouts yet"}
              </strong>
              <p>
                {payouts === null
                  ? "Completed order payments will appear here."
                  : "Completed settlements will appear here."}
              </p>
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
