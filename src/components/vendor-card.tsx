import { Clock3, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { formatMinutes, formatRand } from "@/lib/format";
import type { Vendor } from "@/lib/site-data";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <article className="vendor-card">
      <Link href={`/vendors/${vendor.slug}`} className="card-stretch">
        <div className={`food-visual tone-${vendor.accent}`}>
          <span>{vendor.category.slice(0, 1)}</span>
          {vendor.promoted && <strong>Featured</strong>}
          <span className={`status ${vendor.isOpen ? "open" : "closed"}`}>
            {vendor.isOpen ? "Open" : "Closed"}
          </span>
        </div>
        <div className="vendor-card-body">
          <div>
            <p className="eyebrow">{vendor.category}</p>
            <h3>{vendor.name}</h3>
          </div>
          <p>{vendor.description}</p>
          <div className="meta-row">
            <span>
              <Star size={14} aria-hidden="true" /> {vendor.rating.toFixed(1)}
            </span>
            <span>
              <Clock3 size={14} aria-hidden="true" />{" "}
              {formatMinutes(...vendor.eta)}
            </span>
          </div>
          <div className="meta-row subtle">
            <span>
              <MapPin size={14} aria-hidden="true" /> {vendor.neighbourhood}
            </span>
            <span>{formatRand(vendor.deliveryFee)} delivery</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
