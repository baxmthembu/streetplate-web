import {
  ArrowRight,
  Bike,
  CircleDollarSign,
  MapPin,
  Star,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import { DriverLivePanel } from "@/components/driver-live-panel";
import { DriverStatusForm } from "@/components/driver-status-form";
import {
  getDriverEarnings,
  getDriverProfile,
  getDriverWallet,
} from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

export default async function DriverDashboardPage() {
  let result: Awaited<
    ReturnType<
      () => Promise<
        [
          Awaited<ReturnType<typeof getDriverProfile>>,
          Awaited<ReturnType<typeof getDriverEarnings>>,
          Awaited<ReturnType<typeof getDriverWallet>>,
        ]
      >
    >
  >;
  try {
    result = await Promise.all([
      getDriverProfile(),
      getDriverEarnings("daily"),
      getDriverWallet(),
    ]);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const [driver, earnings, wallet] = result;
  const { user, profile, location, activeOrder } = driver;
  return (
    <div className="driver-page">
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Driver dashboard</p>
          <h1>Sawubona, {user.name.split(" ")[0]}</h1>
          <p>
            Manage today’s deliveries, availability and earnings in one place.
          </p>
        </div>
        <div className="driver-rating">
          <Star size={19} fill="currentColor" aria-hidden="true" />
          <strong>{Number(profile.rating ?? 5).toFixed(1)}</strong>
          <span>driver rating</span>
        </div>
      </header>

      <DriverLivePanel
        initialOnline={Boolean(location.is_online)}
        initialOrder={activeOrder}
      />

      <section className="driver-metric-grid" aria-label="Driver summary">
        <article>
          <span className="orange">
            <CircleDollarSign size={22} aria-hidden="true" />
          </span>
          <small>Today’s earnings</small>
          <strong>{formatRand(earnings.summary.total_net)}</strong>
          <Link href="/driver/earnings?period=daily">
            View breakdown <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>
        <article>
          <span className="yellow">
            <WalletCards size={22} aria-hidden="true" />
          </span>
          <small>Available balance</small>
          <strong>{formatRand(Number(wallet.wallet.available_balance))}</strong>
          <Link href="/driver/wallet">
            Open wallet <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>
        <article>
          <span className="green">
            <Bike size={22} aria-hidden="true" />
          </span>
          <small>Total deliveries</small>
          <strong>
            {profile.total_deliveries ?? wallet.wallet.total_deliveries ?? 0}
          </strong>
          <Link href="/driver/history">
            View history <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section className="driver-section">
        <div className="driver-section-heading">
          <div>
            <p className="eyebrow">Current journey</p>
            <h2>
              {activeOrder ? "Your active delivery" : "Ready when you are"}
            </h2>
          </div>
          {activeOrder && (
            <span className="driver-status-badge">
              {activeOrder.status.replaceAll("_", " ")}
            </span>
          )}
        </div>
        {activeOrder ? (
          <article className="driver-active-order">
            <div className="driver-active-route">
              <div>
                <span className="pickup">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Pick up from</small>
                  <h3>
                    {activeOrder.vendors?.business_name ?? "StreetPlate vendor"}
                  </h3>
                  <p>
                    {activeOrder.vendors?.address ?? "Vendor pickup location"}
                  </p>
                </div>
              </div>
              <div>
                <span className="dropoff">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Deliver to</small>
                  <h3>Customer address</h3>
                  <p>{activeOrder.delivery_address}</p>
                </div>
              </div>
            </div>
            <div className="driver-active-summary">
              <div>
                <small>Expected payout</small>
                <strong>
                  {formatRand(Number(activeOrder.driver_payout ?? 0))}
                </strong>
              </div>
              <Link
                className="button button-light"
                href={`/driver/deliveries/${activeOrder.id}`}
              >
                Delivery details
              </Link>
              <DriverStatusForm order={activeOrder} />
            </div>
          </article>
        ) : (
          <div className="driver-empty driver-empty-large">
            <span>
              <Bike size={36} aria-hidden="true" />
            </span>
            <h3>No active delivery</h3>
            <p>
              {location.is_online
                ? "You’re online. Keep this page open and a nearby offer will appear here."
                : "Go online above when you’re ready to receive nearby delivery offers."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
