import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

type RecruitmentPageProps = {
  audience: "vendor" | "driver";
  title: string;
  description: string;
  benefits: string[];
  steps: string[];
};

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
            <span>{isVendor ? "V" : "D"}</span>
            <strong>{isVendor ? "Local business" : "Delivery partner"}</strong>
            <small>Application criteria apply</small>
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
          {benefits.map((benefit) => (
            <article key={benefit}>
              <Check aria-hidden="true" />
              <h3>{benefit}</h3>
            </article>
          ))}
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
            <h2>Secure onboarding comes first</h2>
            <p>
              Identity, food-safety and banking documents must use private
              storage and signed access. The current Supabase project has no
              storage buckets, so the application form will only be enabled
              after a reviewed migration and private-storage design receive
              explicit approval.
            </p>
            <Link href="/legal/privacy">Read the privacy approach</Link>
            <hr />
            <h3>Create your shared StreetPlate account</h3>
            <p>
              This uses the existing mobile/backend registration contract.
              Document verification remains gated until private storage is
              approved.
            </p>
            <RegisterForm role={audience} />
          </aside>
        </div>
      </section>
    </>
  );
}
