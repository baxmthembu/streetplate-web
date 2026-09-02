import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

type RecruitmentPageProps = {
  audience: "vendor" | "driver";
  title: string;
  description: string;
  benefits: string[];
  steps: string[];
};

const driverBenefitVisuals = [
  {
    src: "/food/driver-benefit-familiar-areas.png",
    alt: "A delivery rider navigating a familiar neighbourhood",
  },
  {
    src: "/food/driver-benefit-availability.png",
    alt: "A delivery rider choosing available hours on a phone",
  },
  {
    src: "/food/driver-benefit-offers.png",
    alt: "A delivery rider viewing delivery offers in the app",
  },
  {
    src: "/food/driver-benefit-completed.png",
    alt: "A delivery rider reviewing completed deliveries",
  },
] as const;

export function RecruitmentPage({
  audience,
  title,
  description,
  benefits,
  steps,
}: RecruitmentPageProps) {
  const isVendor = audience === "vendor";

  return (
    <>
      <section
        className={`recruitment-hero ${isVendor ? "vendor-recruit" : "driver-recruit"}`}
      >
        <div className="shell recruitment-grid">
          <div>
            <p className="eyebrow">
              {isVendor
                ? "Grow your food business"
                : "Deliver in your community"}
            </p>
            <h1>{title}</h1>
            <p>{description}</p>
            <a href="#application" className="button button-dark">
              Register interest <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="recruitment-art">
            <Image
              src={
                isVendor
                  ? "/food/vendor-recruitment-flat.png"
                  : "/food/driver-recruitment-flat.png"
              }
              alt={
                isVendor
                  ? "A local food vendor serving a freshly prepared takeaway meal from a township container kitchen"
                  : "A helmeted StreetPlate delivery partner riding a scooter through a township neighbourhood"
              }
              fill
              priority
              sizes="(max-width: 800px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Why StreetPlate</p>
            <h2>Built around local opportunity</h2>
          </div>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit, index) => {
            const visual = isVendor ? undefined : driverBenefitVisuals[index];
            return (
              <article
                className={visual ? "benefit-visual" : undefined}
                key={benefit}
              >
                {visual ? (
                  <div className="benefit-image">
                    <Image
                      src={visual.src}
                      alt={visual.alt}
                      fill
                      sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <Check aria-hidden="true" />
                )}
                <h3>{benefit}</h3>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell application-layout" id="application">
          <div>
            <p className="eyebrow">Application journey</p>
            <h2>What to expect</h2>
            <ol>
              {steps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="application-gate">
            <ShieldCheck size={34} aria-hidden="true" />
            <Link href="/legal/privacy">Read the privacy approach</Link>
            <hr />
            <h3>Create your shared StreetPlate account</h3>
            <RegisterForm role={audience} />
            {!isVendor && (
              <Link
                className="returning-account-link"
                href="/sign-in?next=/driver"
              >
                Already a StreetPlate driver? Sign in to your account.
              </Link>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
