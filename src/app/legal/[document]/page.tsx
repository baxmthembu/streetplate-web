import type { Metadata } from "next";
import { notFound } from "next/navigation";

const documents = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "This draft explains how StreetPlate intends to handle personal information across customer, vendor and driver journeys.",
    sections: [
      [
        "Information we use",
        "Account details, contact information, delivery addresses, order activity and support communications may be processed to provide the service.",
      ],
      [
        "Location information",
        "Precise location should only be used with clear permission for delivery, vendor discovery and active order tracking.",
      ],
      [
        "Your choices",
        "The final policy will describe access, correction, objection, portability and deletion request processes.",
      ],
    ],
  },
  terms: {
    title: "Terms and Conditions",
    intro:
      "These draft terms outline the intended relationship between StreetPlate and website users.",
    sections: [
      [
        "Using StreetPlate",
        "Customers must provide accurate delivery and contact information and use the platform lawfully.",
      ],
      [
        "Orders and availability",
        "Vendor availability, preparation times and delivery estimates can change. Final terms must define when an order becomes binding.",
      ],
      [
        "Payments",
        "Payment status must be confirmed by trusted server-side records, not browser redirects.",
      ],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "This draft explains the limited cookies needed for secure sessions and core website operation.",
    sections: [
      [
        "Essential cookies",
        "Supabase SSR authentication uses secure session cookies so signed-in pages can verify the current user.",
      ],
      [
        "Preferences",
        "Optional preferences should be stored only with a clear purpose and appropriate consent.",
      ],
      [
        "Analytics",
        "No non-essential analytics or advertising cookies should be enabled before consent requirements are implemented.",
      ],
    ],
  },
  refunds: {
    title: "Refund and Cancellation Policy",
    intro:
      "This draft describes the topics a final reviewed policy must cover without promising automatic outcomes.",
    sections: [
      [
        "Cancellations",
        "Eligibility may depend on vendor acceptance, food preparation and driver assignment status.",
      ],
      [
        "Refund review",
        "Refunds should be tied to verified payment and order records and reviewed under the final approved policy.",
      ],
      [
        "Support",
        "The production site must provide a clear channel for customers to raise order and payment concerns.",
      ],
    ],
  },
} as const;

type Props = PageProps<"/legal/[document]">;

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { document } = await params;
  const content = documents[document as keyof typeof documents];
  return { title: content?.title ?? "Legal information" };
}

export default async function LegalPage({ params }: Props) {
  const { document } = await params;
  const content = documents[document as keyof typeof documents];
  if (!content) notFound();

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell">
          <p className="eyebrow">Editable legal draft</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <article className="shell content-page content-narrow legal-copy">
        <div className="legal-warning">
          This is product-preparation copy, not legal advice. It requires review
          by a qualified South African lawyer before publication.
        </div>
        {content.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <h2>Privacy contact</h2>
        <p>
          A production privacy contact address and data-request process must be
          confirmed before launch.
        </p>
      </article>
    </>
  );
}
