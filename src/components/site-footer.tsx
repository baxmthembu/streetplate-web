import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/auth/actions";

type AccountRole = "customer" | "vendor" | "driver" | "admin" | null;

export function SiteFooter({
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
    <footer className="site-footer" id="footer-navigation">
      <div className="shell footer-grid">
        <div>
          <Link href="/" aria-label="StreetPlate home">
            <Image
              className="footer-brand-logo"
              src="/brand/streetplate-logo-compact.png"
              alt="StreetPlate"
              width={164}
              height={164}
              sizes="164px"
              unoptimized
            />
          </Link>
          <p className="footer-copy">
            Local food, delivered from your community.
          </p>
        </div>
        <div>
          <h2>Discover</h2>
          <Link href="/discover">Find food</Link>
          <Link href="/discover?category=kota">Kota near me</Link>
          <Link href="/discover?category=home-cooked">Home cooked meals</Link>
        </div>
        <div>
          <h2>{isSignedIn ? "Your account" : "Join us"}</h2>
          {isSignedIn ? (
            <>
              <Link href={accountHref}>
                {role === "vendor"
                  ? "Vendor settings"
                  : role === "driver"
                    ? "Driver profile"
                    : "Account"}
              </Link>
              <Link href={ordersHref}>
                {role === "driver" ? "Delivery history" : "Orders"}
              </Link>
              <form className="footer-auth-form" action={signOut}>
                <button className="footer-auth-button" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/join">Create an account</Link>
              <Link href="/become-a-vendor">Become a vendor</Link>
              <Link href="/become-a-driver">Become a driver</Link>
            </>
          )}
        </div>
        <div>
          <h2>Legal</h2>
          <Link href="/legal/privacy">Privacy policy</Link>
          <Link href="/legal/terms">Terms & conditions</Link>
          <Link href="/legal/cookies">Cookie policy</Link>
          <Link href="/legal/refunds">Refunds & cancellations</Link>
          <Link href="/legal/vendor-terms">Vendor terms</Link>
          <Link href="/legal/driver-terms">Driver terms</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} StreetPlate</span>
      </div>
    </footer>
  );
}
