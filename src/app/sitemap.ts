import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://streetplate.co.za";
  const routes = [
    "",
    "/discover",
    "/become-a-vendor",
    "/become-a-driver",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/refunds",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
