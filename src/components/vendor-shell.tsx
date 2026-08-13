"use client";

import {
  BadgePercent,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";

const links = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/orders", label: "Orders", icon: ClipboardList },
  { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/vendor/promotions", label: "Promos", icon: BadgePercent },
  { href: "/vendor/insights", label: "Insights", icon: BarChart3 },
  { href: "/vendor/earnings", label: "Earnings", icon: WalletCards },
  { href: "/vendor/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/vendor/account", label: "Settings", icon: Settings },
];

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <section className="vendor-portal">
      <aside className="vendor-sidebar">
        <Link className="vendor-sidebar-brand" href="/vendor">
          <span>
            <UtensilsCrossed size={23} aria-hidden="true" />
          </span>
          <div>
            <strong>StreetPlate</strong>
            <small>Vendor workspace</small>
          </div>
        </Link>
        <nav aria-label="Vendor dashboard">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/vendor"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button type="submit">
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </aside>
      <main className="vendor-workspace">{children}</main>
      <nav className="vendor-mobile-nav" aria-label="Vendor mobile navigation">
        {links.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active =
            href === "/vendor" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
