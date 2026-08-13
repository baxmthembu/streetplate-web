import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CartProvider } from "@/components/cart-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { createClient } from "@/lib/supabase/server";

import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif",
});

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: claimData, error: claimError } =
    (await supabase?.auth.getClaims()) ?? { data: null, error: null };
  const isSignedIn = !claimError && Boolean(claimData?.claims?.sub);
  let role: "customer" | "vendor" | "driver" | "admin" | null = null;
  if (isSignedIn && claimData?.claims?.sub && supabase) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", claimData.claims.sub)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  return (
    <html
      lang="en-ZA"
      className={`${notoSans.variable} ${notoSerif.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <CartProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <SiteHeader isSignedIn={isSignedIn} role={role} />
          <main id="main-content">{children}</main>
          <SiteFooter isSignedIn={isSignedIn} role={role} />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
