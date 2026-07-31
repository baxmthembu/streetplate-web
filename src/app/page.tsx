import {
  ArrowRight,
  Bike,
  Check,
  ChevronRight,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DemoNotice } from "@/components/demo-notice";
import { MealCard } from "@/components/meal-card";
import { VendorCard } from "@/components/vendor-card";
import { categories } from "@/lib/site-data";
import { getMarketplace } from "@/lib/streetplate-api";

const faqs = [
  {
    question: "What is StreetPlate?",
    answer:
      "StreetPlate connects customers with independent local food businesses and delivery partners.",
  },
  {
    question: "How do I know if delivery is available?",
    answer:
      "Enter your delivery location to see vendors serving your area. Coverage depends on each vendor's delivery zone.",
  },
  {
    question: "Can I use the same account on mobile and web?",
    answer:
      "Yes. The website is designed around the same StreetPlate Supabase account and profile used by the mobile apps.",
  },
];

export default async function Home() {
  const { vendors, meals, isDemo } = await getMarketplace();

  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              Food delivery, rooted in community
            </p>
            <h1>Local food, delivered from your community.</h1>
            <p className="hero-lead">
              Discover home kitchens, township vendors, spaza shops and local
              food businesses near you.
            </p>
            <form className="location-search" action="/discover">
              <MapPin aria-hidden="true" size={22} />
              <label className="sr-only" htmlFor="delivery-location">
                Enter your delivery location
              </label>
              <input
                id="delivery-location"
                name="location"
                placeholder="Enter your delivery location"
                autoComplete="street-address"
              />
              <button type="submit">
                Find food <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>
            <div className="hero-actions">
              <Link href="/discover" className="text-link">
                <LocateFixed size={17} aria-hidden="true" />
                Use my current location
              </Link>
              <span>or</span>
              <Link href="/join" className="text-link">
                Sign in for saved addresses
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-logo-card">
              <Image
                className="hero-logo-image"
                src="/brand/streetplate-logo-master.png"
                alt="StreetPlate delivery rider logo"
                width={2000}
                height={2000}
                sizes="(max-width: 680px) 88vw, (max-width: 980px) 520px, 42vw"
                priority
                unoptimized
              />
            </div>
            <div className="art-stamp">
              <ShieldCheck size={22} aria-hidden="true" />
              Local & trusted
            </div>
          </div>
        </div>
      </section>

      <section className="section shell" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore by craving</p>
            <h2 id="categories-title">Local favourites</h2>
          </div>
          <Link href="/discover">
            See all <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={`/discover?category=${encodeURIComponent(category.label)}`}
              className="category-card"
            >
              <span className={`category-symbol tone-${category.tone}`}>
                <Image
                  className="category-image"
                  src={category.image}
                  alt=""
                  fill
                  sizes="74px"
                />
              </span>
              <strong>{category.label}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Close to you</p>
              <h2>Nearby vendors</h2>
            </div>
            <Link href="/discover">
              Browse vendors <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {isDemo && <DemoNotice />}
          <div className="vendor-grid">
            {vendors.slice(0, 3).map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Popular right now</p>
            <h2>Meals worth discovering</h2>
          </div>
          <Link href="/discover">
            View menu picks <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="meal-grid">
          {meals.slice(0, 6).map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </section>

      <section className="section shell">
        <div className="how-panel">
          <div>
            <p className="eyebrow">Simple from start to finish</p>
            <h2>How StreetPlate works</h2>
            <p>
              A familiar ordering experience designed for local food businesses
              and South African communities.
            </p>
          </div>
          <ol className="steps">
            <li>
              <span>
                <MapPin aria-hidden="true" />
              </span>
              <div>
                <strong>Set your location</strong>
                <p>See vendors that can deliver to you.</p>
              </div>
            </li>
            <li>
              <span>
                <UtensilsCrossed aria-hidden="true" />
              </span>
              <div>
                <strong>Choose your meal</strong>
                <p>Browse menus, local favourites and specials.</p>
              </div>
            </li>
            <li>
              <span>
                <Bike aria-hidden="true" />
              </span>
              <div>
                <strong>Track delivery</strong>
                <p>Follow your order from kitchen to doorstep.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section shell">
        <div className="join-grid">
          <article className="join-card vendor-join">
            <Store size={32} aria-hidden="true" />
            <p className="eyebrow">For local food businesses</p>
            <h2>Grow with StreetPlate</h2>
            <p>
              Reach nearby customers while keeping your menu and availability in
              your hands.
            </p>
            <ul>
              <li>
                <Check size={16} aria-hidden="true" /> Local discovery
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Menu management
              </li>
              <li>
                <Check size={16} aria-hidden="true" /> Order notifications
              </li>
            </ul>
            <Link href="/become-a-vendor" className="button button-dark">
              Become a vendor <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
          <article className="join-card driver-join">
            <Bike size={32} aria-hidden="true" />
            <p className="eyebrow">For delivery partners</p>
            <h2>Deliver in your area</h2>
            <p>
              Apply to help local food move through your community. Earnings
              vary by availability and completed deliveries.
            </p>
            <Link href="/become-a-driver" className="button button-light">
              Become a driver <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>

      <section className="section faq-section">
        <div className="shell faq-grid">
          <div>
            <p className="eyebrow">Good to know</p>
            <h2>Frequently asked questions</h2>
          </div>
          <div>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="shell newsletter-inner">
          <div>
            <p className="eyebrow">Stay close to the plate</p>
            <h2>Local flavour, new neighbourhoods, useful updates.</h2>
          </div>
          <form>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Email address"
              required
            />
            <button type="submit">
              Join the waitlist <Search size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
