import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/components/cart-provider";
import { CookieConsent } from "@/components/cookie-consent";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://streetplate.co.za";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StreetPlate | Local food, delivered",
    template: "%s | StreetPlate",
  },
  description:
    "Discover home kitchens, township vendors, spaza shops and local food businesses near you.",
  icons: {
    apple: [
      {
        url: "/brand/streetplate-logo-compact.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "StreetPlate",
    title: "Local food, delivered from your community.",
    description:
      "Discover nearby local food businesses and order your favourites.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>
        <CartProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
