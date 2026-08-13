/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

import { VendorAvailabilityForm } from "@/components/vendor-forms";
import {
  getVendorAnalytics,
  getVendorMenu,
  getVendorOrders,
  getVendorProfile,
  getVendorUser,
} from "@/lib/vendor-api";
import { formatRand } from "@/lib/format";

export default async function VendorDashboardPage() {
  try {
    const [{ user }, { vendor }, { menu }, { orders }, analytics] =
      await Promise.all([
        getVendorUser(),
        getVendorProfile(),
        getVendorMenu(),
        getVendorOrders("limit=30"),
        getVendorAnalytics("day"),
      ]);
    const activeOrders = orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    );
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Vendor dashboard</p>
            <h1>Sawubona, {user.name.split(" ")[0]}</h1>
            <p>Run {vendor.business_name} from one clear workspace.</p>
          </div>
          <div className="vendor-heading-action">
            <span
              className={`vendor-open-badge ${vendor.is_open ? "open" : "closed"}`}
            >
              {vendor.is_open ? "Open for orders" : "Store closed"}
            </span>
            <VendorAvailabilityForm open={Boolean(vendor.is_open)} />
          </div>
        </header>
        <section
          className="vendor-metric-grid"
          aria-label="Today’s business summary"
        >
          <article>
            <span>
              <Clock3 size={21} />
            </span>
            <small>Active orders</small>
            <strong>{activeOrders.length}</strong>
            <Link href="/vendor/orders">
              Manage orders <ArrowRight size={14} />
            </Link>
          </article>
          <article>
            <span>
              <CircleDollarSign size={21} />
            </span>
            <small>Today’s revenue</small>
            <strong>{formatRand(analytics.revenue)}</strong>
            <Link href="/vendor/earnings">
              View earnings <ArrowRight size={14} />
            </Link>
          </article>
          <article>
            <span>
              <UtensilsCrossed size={21} />
            </span>
            <small>Available items</small>
            <strong>
              {menu.filter((item) => item.is_available !== false).length}
            </strong>
            <Link href="/vendor/menu">
              Manage menu <ArrowRight size={14} />
            </Link>
          </article>
          <article>
            <span>
              <Star size={21} />
            </span>
            <small>Customer rating</small>
            <strong>
              {Number(analytics.avgRating || vendor.rating || 0).toFixed(1)}
            </strong>
            <Link href="/vendor/reviews">
              Read reviews <ArrowRight size={14} />
            </Link>
          </article>
        </section>
        <section className="vendor-dashboard-grid">
          <article className="vendor-dashboard-panel">
            <div className="panel-heading">
              <h2>Orders requiring attention</h2>
              <Link href="/vendor/orders">View all</Link>
            </div>
            {activeOrders.length ? (
              <div className="vendor-order-list">
                {activeOrders.slice(0, 6).map((order) => (
                  <Link href={`/vendor/orders/${order.id}`} key={order.id}>
                    <div>
                      <strong>
                        #{order.order_number ?? order.id.slice(0, 8)}
                      </strong>
                      <span>{order.status.replaceAll("_", " ")}</span>
                    </div>
                    <strong>{formatRand(Number(order.total))}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="vendor-empty-state">
                <Store size={28} />
                <strong>No active orders</strong>
                <p>New paid orders will appear here.</p>
              </div>
            )}
          </article>
          <article className="vendor-dashboard-panel">
            <div className="panel-heading">
              <h2>Menu pulse</h2>
              <Link href="/vendor/menu">Edit menu</Link>
            </div>
            {menu.length ? (
              <div className="vendor-menu-list">
                {menu.slice(0, 6).map((item) => (
                  <div key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.category ?? "Menu item"}</span>
                    </div>
                    <div>
                      <strong>{formatRand(Number(item.price))}</strong>
                      <span
                        className={
                          item.is_available === false
                            ? "unavailable"
                            : "available"
                        }
                      >
                        {item.is_available === false
                          ? "Unavailable"
                          : "Available"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vendor-empty-state">
                <UtensilsCrossed size={28} />
                <strong>Your menu is empty</strong>
                <p>Add the first item customers can order.</p>
              </div>
            )}
          </article>
        </section>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}

export function VendorDataError({ error }: { error: unknown }) {
  return (
    <div className="vendor-page">
      <div className="vendor-error">
        <Store size={32} />
        <h1>Vendor workspace unavailable</h1>
        <p>
          {error instanceof Error ? error.message : "Please retry shortly."}
        </p>
      </div>
    </div>
  );
}
