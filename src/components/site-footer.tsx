import Link from "next/link";

import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer-navigation">
      <div className="shell footer-grid">
        <div>
          <Brand />
          <p className="footer-copy">
            Local food, delivered from your community.
          </p>
          <p className="footer-small">Built in South Africa.</p>
        </div>
        <div>
          <h2>Discover</h2>
          <Link href="/discover">Find food</Link>
          <Link href="/discover?category=kota">Kota near me</Link>
          <Link href="/discover?category=home-cooked">Home-cooked meals</Link>
        </div>
        <div>
          <h2>Join us</h2>
          <Link href="/become-a-vendor">Become a vendor</Link>
          <Link href="/become-a-driver">Become a driver</Link>
          <Link href="/join">Create an account</Link>
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
        <span>Legal copy requires review by a South African lawyer.</span>
      </div>
    </footer>
  );
}
