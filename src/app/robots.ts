import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://streetplate.co.za";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/discover",
        "/vendors/",
        "/become-a-vendor",
        "/become-a-driver",
      ],
      disallow: [
        "/account",
        "/api/",
        "/auth/",
        "/checkout",
        "/forgot-password",
        "/orders/",
        "/reset-password",
        "/sign-in",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
