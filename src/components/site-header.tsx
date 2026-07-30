import { MapPin, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <>
      <div className="announcement">
        <p>Made for local flavour, built for South African communities.</p>
        <Link href="/join">Join StreetPlate</Link>
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
            <Link
              className="icon-link"
              href="/cart"
              aria-label="Open your cart"
            >
              <ShoppingBag size={20} aria-hidden="true" />
            </Link>
            <Link
              className="icon-link desktop-account"
              href="/sign-in"
              aria-label="Sign in"
            >
              <UserRound size={20} aria-hidden="true" />
            </Link>
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
