import {
  BadgeCheck,
  Bike,
  CircleDollarSign,
  Clock3,
  FileText,
  Headphones,
  Landmark,
  Mail,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

import { DriverDataState } from "@/components/driver-data-state";
import {
  DriverBankForm,
  DriverSessions,
  DriverVehicleForm,
} from "@/components/driver-profile-forms";
import {
  getDriverProfile,
  getDriverSessions,
  getDriverWallet,
} from "@/lib/driver-api";
import { formatRand } from "@/lib/format";

export default async function DriverProfilePage() {
  let profileData: [
    Awaited<ReturnType<typeof getDriverProfile>>,
    Awaited<ReturnType<typeof getDriverWallet>>,
    Awaited<ReturnType<typeof getDriverSessions>>,
  ];
  try {
    profileData = await Promise.all([
      getDriverProfile(),
      getDriverWallet(),
      getDriverSessions().catch(() => ({ sessions: [] })),
    ]);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const [{ user, profile, location }, { wallet }, { sessions }] = profileData;
  return (
    <div className="driver-page">
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Driver account</p>
          <h1>Profile & settings</h1>
          <p>
            Keep the operational and payout information linked to your shared
            StreetPlate account up to date.
          </p>
        </div>
      </header>
      <section className="driver-profile-card">
        <div className="driver-avatar">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2>{user.name}</h2>
          <p>
            <Mail size={16} aria-hidden="true" />
            {user.email}
          </p>
          {user.phone && (
            <p>
              <Phone size={16} aria-hidden="true" />
              {user.phone}
            </p>
          )}
        </div>
        <span className="driver-verified">
          <BadgeCheck size={18} aria-hidden="true" />
          Driver account
        </span>
      </section>
      <section
        className="driver-profile-stats"
        aria-label="Driver account summary"
      >
        <article>
          <Bike size={20} />
          <strong>
            {profile.total_deliveries ?? wallet.total_deliveries ?? 0}
          </strong>
          <span>Deliveries</span>
        </article>
        <article>
          <Star size={20} fill="currentColor" />
          <strong>{Number(profile.rating ?? 5).toFixed(1)}</strong>
          <span>Rating</span>
        </article>
        <article>
          <CircleDollarSign size={20} />
          <strong>{formatRand(Number(wallet.available_balance))}</strong>
          <span>Wallet balance</span>
        </article>
        <article>
          <span
            className={`driver-live-dot ${location.is_online ? "online" : ""}`}
          />
          <strong>{location.is_online ? "Online" : "Offline"}</strong>
          <span>Availability</span>
        </article>
      </section>
      <nav
        className="driver-account-shortcuts"
        aria-label="Driver account shortcuts"
      >
        <Link href="/driver/earnings">
          <CircleDollarSign size={20} />
          <span>
            <strong>Earnings & payouts</strong>
            <small>Review delivery income</small>
          </span>
        </Link>
        <Link href="/driver/history">
          <Clock3 size={20} />
          <span>
            <strong>Delivery history</strong>
            <small>See completed trips</small>
          </span>
        </Link>
        <a href="mailto:support@streetplate.co.za">
          <Headphones size={20} />
          <span>
            <strong>Support</strong>
            <small>support@streetplate.co.za</small>
          </span>
        </a>
        <Link href="/legal/driver-terms">
          <FileText size={20} />
          <span>
            <strong>Driver terms</strong>
            <small>Read operating terms</small>
          </span>
        </Link>
        <Link href="/legal/privacy">
          <ShieldCheck size={20} />
          <span>
            <strong>Privacy policy</strong>
            <small>How StreetPlate protects data</small>
          </span>
        </Link>
      </nav>
      <section className="driver-settings-grid">
        <article className="driver-settings-card">
          <div className="driver-settings-heading">
            <span>
              <Bike size={22} aria-hidden="true" />
            </span>
            <div>
              <h2>Delivery vehicle</h2>
              <p>Used for dispatch and vehicle identification.</p>
            </div>
          </div>
          <DriverVehicleForm profile={profile} />
        </article>
        <article className="driver-settings-card" id="payout-details">
          <div className="driver-settings-heading">
            <span>
              <Landmark size={22} aria-hidden="true" />
            </span>
            <div>
              <h2>Payout details</h2>
              <p>Weekly driver settlements are sent to this account.</p>
            </div>
          </div>
          <DriverBankForm profile={profile} />
        </article>
      </section>
      <section className="driver-settings-card driver-session-card">
        <div className="driver-settings-heading">
          <span>
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>Devices & sessions</h2>
            <p>
              Review active mobile and web sessions and sign out devices you do
              not recognise.
            </p>
          </div>
        </div>
        <DriverSessions sessions={sessions} />
      </section>
      {/*<aside className="driver-security-note">
        <ShieldCheck size={23} aria-hidden="true" />
        <div>
          <h2>Shared account security</h2>
          <p>
            Your driver portal uses the same Supabase Auth account as the
            StreetPlate mobile apps. Changing your password or signing out
            affects this web session without changing the mobile API contracts.
          </p>
        </div>
      </aside>*/}
    </div>
  );
}
