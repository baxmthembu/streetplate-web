import type { Metadata } from "next";
import { Clock3, Heart, MapPin, Search, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { DemoNotice } from "@/components/demo-notice";
import { MealCard } from "@/components/meal-card";
import { formatMinutes, formatRand } from "@/lib/format";
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
          <button className="favorite-button" type="button">
            <Heart size={19} aria-hidden="true" /> Save vendor
          </button>
        </div>
      </section>

      <section className="shell menu-layout">
        <div className="menu-main">
          {isDemo && <DemoNotice />}
          <div className="menu-topbar">
            <div>
              <p className="eyebrow">Made fresh</p>
              <h2>Menu</h2>
            </div>
            <label className="menu-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search this menu</span>
              <input placeholder="Search this menu" />
            </label>
          </div>
          {meals.length > 0 ? (
            <div className="meal-grid meal-grid-menu">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Menu integration is being connected safely.</h3>
              <p>
                The current backend vendor-detail endpoint exposes private
                vendor columns. StreetPlate web will not call it until a
                backwards-compatible safe public contract is approved.
              </p>
            </div>
          )}
        </div>
        <aside className="order-aside">
          <p className="eyebrow">Your order</p>
          <h2>Ready when you are</h2>
          <p>Add items from one vendor to start your StreetPlate order.</p>
          <div>
            <span>Subtotal</span>
            <strong>{formatRand(0)}</strong>
          </div>
          <a href="/cart" className="button button-orange">
            View cart
          </a>
        </aside>
      </section>
    </>
  );
}
