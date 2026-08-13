import { MapPin, Menu, Search } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";

import { Brand } from "./brand";
import { CartLink } from "./cart-link";

type AccountRole = "customer" | "vendor" | "driver" | "admin" | null;

export function SiteHeader({
  isSignedIn,
  role = null,
}: {
  isSignedIn: boolean;
  role?: AccountRole;
}) {
  const accountHref =
    role === "vendor"
      ? "/vendor/account"
      : role === "driver"
        ? "/driver/profile"
        : "/account";
  const ordersHref =
    role === "vendor"
      ? "/vendor/orders"
      : role === "driver"
        ? "/driver/history"
        : "/account#order-history";
  return (
    <>
      <div className="announcement">
        <p>Made for local flavour, built for South African communities.</p>
        <Link href={isSignedIn ? ordersHref : "/join"}>
          {isSignedIn ? "View your orders" : "Join StreetPlate"}
        </Link>
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/discover">Find food</Link>
            <Link href="/become-a-vendor">For vendors</Link>
            <Link href="/become-a-driver">For drivers</Link>
          </nav>
          <div className="header-actions">
            <Link className="location-pill" href="/discover">
              <MapPin size={16} aria-hidden="true" />
              <span>Choose location</span>
            </Link>
            <Link
              className="icon-link"
              href="/discover"
              aria-label="Search StreetPlate"
            >
              <Search size={20} aria-hidden="true" />
            </Link>
            <CartLink />
            <nav className="desktop-auth-nav" aria-label="Account navigation">
              {isSignedIn ? (
                <>
                  <Link className="header-auth-link" href={accountHref}>
                    {role === "vendor"
                      ? "Vendor"
                      : role === "driver"
                        ? "Driver"
                        : "Account"}
                  </Link>
                  <Link className="header-auth-link" href={ordersHref}>
                    Orders
                  </Link>
                  <form className="header-sign-out-form" action={signOut}>
                    <button className="header-auth-link" type="submit">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="header-auth-link" href="/sign-in">
                    Sign in
                  </Link>
                  <Link className="header-create-account" href="/join">
                    Create account
                  </Link>
                </>
              )}
            </nav>
            <Link
              className="icon-link mobile-menu"
              href="#footer-navigation"
              aria-label="Open navigation"
            >
              <Menu size={22} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
