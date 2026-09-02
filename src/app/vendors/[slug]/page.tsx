import type { Metadata } from "next";
import { Clock3, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { DemoNotice } from "@/components/demo-notice";
import { ProtectedMutationForm } from "@/components/protected-mutation-form";
import { VendorMenu } from "@/components/vendor-menu";
import { VendorOrderAside } from "@/components/vendor-order-aside";
import { saveVendor } from "@/app/account/actions";
import { formatMinutes, formatRand } from "@/lib/format";
import { safeJsonForHtml } from "@/lib/safe-json";
import { getVendorBySlug } from "@/lib/streetplate-api";

type Props = PageProps<"/vendors/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { vendor } = await getVendorBySlug(slug);
  if (!vendor) return { title: "Vendor not found" };
  return {
    title: vendor.name,
    description: vendor.description,
  };
}

export default async function VendorPage({ params }: Props) {
  const { slug } = await params;
  const { vendor, meals, isDemo } = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: vendor.name,
    description: vendor.description,
    servesCuisine: vendor.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonForHtml(structuredData) }}
      />
      <section className={`vendor-hero tone-${vendor.accent}`}>
        <div className="shell vendor-hero-inner">
          <div className="vendor-monogram">{vendor.category.slice(0, 1)}</div>
          <div className="vendor-hero-copy">
            <p className="eyebrow">{vendor.category}</p>
            <h1>{vendor.name}</h1>
            <p>{vendor.description}</p>
            <div className="vendor-facts">
              <span>
                <Star size={16} aria-hidden="true" /> {vendor.rating.toFixed(1)}
              </span>
              <span>
                <Clock3 size={16} aria-hidden="true" />{" "}
                {formatMinutes(...vendor.eta)}
              </span>
              <span>
                <MapPin size={16} aria-hidden="true" /> {vendor.neighbourhood}
              </span>
              <span>{formatRand(vendor.deliveryFee)} delivery</span>
            </div>
          </div>
          <div>
            <ProtectedMutationForm
              action={saveVendor}
              buttonClassName="favorite-button"
              buttonLabel="Save vendor"
              fields={{
                vendorId: vendor.id,
                path: `/vendors/${vendor.slug}`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="shell menu-layout">
        <div className="menu-main">
          {isDemo && <DemoNotice />}
          <VendorMenu meals={meals} />
        </div>
        <VendorOrderAside vendorId={vendor.id} />
      </section>
    </>
  );
}
