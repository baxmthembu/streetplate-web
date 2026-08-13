"use client";

import {
  Bike,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";

const links = [
  { href: "/driver", label: "Drive", icon: LayoutDashboard },
  { href: "/driver/earnings", label: "Earnings", icon: CircleDollarSign },
  { href: "/driver/wallet", label: "Wallet", icon: WalletCards },
  { href: "/driver/history", label: "History", icon: Clock3 },
  { href: "/driver/profile", label: "Profile", icon: UserRound },
];

export function DriverShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <section className="driver-portal">
      <aside className="driver-sidebar">
        <Link className="driver-sidebar-brand" href="/driver">
          <span>
            <Bike size={24} aria-hidden="true" />
          </span>
          <div>
            <strong>StreetPlate</strong>
            <small>Driver portal</small>
          </div>
        </Link>
        <nav aria-label="Driver dashboard">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/driver"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? "active" : ""}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button type="submit">
            <LogOut size={19} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </aside>
      <div className="driver-workspace">{children}</div>
      <nav
        className="driver-mobile-nav"
        aria-label="Driver dashboard mobile navigation"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/driver" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "active" : ""}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
