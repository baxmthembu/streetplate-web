import type { Metadata } from "next";
import { notFound } from "next/navigation";

const documents = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains how StreetPlate collects, uses, shares and protects personal information across customer, vendor and driver journeys, in line with the Protection of Personal Information Act 4 of 2013 (POPIA).",
    sections: [
      [
        "Who is responsible for your information",
        "StreetPlate (KulaConnect, registration number K2025921054, registered address G1031 Bhejane Road, KwaMashu) is the responsible party for personal information processed through this website and the customer, vendor and driver apps.",
      ],
      [
        "Information we collect",
        "We process account and contact details, delivery addresses, order and payment history (not full card numbers), vendor business information, driver vehicle and licence details, device and usage data, and support communications you send us.",
      ],
      [
        "How we collect it",
        "Most information is provided directly by you when you register, place an order, or contact support. Some is collected automatically, such as device information and, with your permission, precise location.",
      ],
      [
        "Why we process your information",
        "We process personal information to perform our contract with you (creating an account, fulfilling orders, processing payments), to meet legal obligations (such as tax and consumer-protection record-keeping), and for legitimate interests such as fraud prevention and service security, as permitted under section 11 of POPIA.",
      ],
      [
        "Location information",
        "Precise location is only collected with your permission and is used for delivery address confirmation, showing nearby vendors, and live order tracking. You can withdraw location permission at any time in your device settings, which may limit some features.",
      ],
      [
        "Sharing your information",
        "We share the minimum necessary information with the vendor and driver assigned to your order, our payment processor (PayFast) to process payment, and infrastructure and communication providers who process data on our behalf (hosting, database, image storage and email delivery). These providers act as operators under POPIA and are contractually required to protect your information and use it only as instructed.",
      ],
      [
        "Cross-border transfers",
        "Some of our service providers process information on servers located outside South Africa. Where this occurs, we take reasonable steps, as required by section 72 of POPIA, to ensure the recipient is subject to a comparable level of data protection before any transfer.",
      ],
      [
        "How long we keep your information",
        "We retain personal information only for as long as necessary to provide the service, meet legal and tax record-keeping obligations, and resolve disputes, after which it is deleted or anonymised.",
      ],
      [
        "Security safeguards",
        "We apply reasonable technical and organisational measures, including encryption in transit, access controls and monitoring, to protect personal information against loss, unauthorised access, and unlawful processing, as required by section 19 of POPIA.",
      ],
      [
        "Your rights",
        "Under sections 23 to 25 of POPIA, you may request access to the personal information we hold about you, request correction or deletion of inaccurate or unlawfully held information, and object to processing carried out on the basis of legitimate interest. You may also object to and opt out of direct marketing at any time.",
      ],
      [
        "Children",
        "StreetPlate is not intended for use by anyone under 18. We do not knowingly collect personal information from children without the consent required by section 35 of POPIA.",
      ],
      [
        "Direct marketing",
        "We will only send direct marketing communications with your prior opt-in consent, as required by section 69 of POPIA, and you can withdraw that consent at any time.",
      ],
      [
        "Changes to this policy",
        "We may update this policy from time to time. Material changes will be indicated by an updated effective date, and significant changes affecting your rights will be actively communicated.",
      ],
      [
        "Contact us and the Information Regulator",
        "For any question about this policy or to exercise your rights, contact our Information Officer, Bongumusa Mthembu, at bongumusamthembu@streetplate.co.za. If you believe your information has been mishandled, you may also lodge a complaint with the Information Regulator (South Africa) at enquiries@inforegulator.org.za.",
      ],
    ],
  },
  terms: {
    title: "Terms and Conditions",
    intro:
      "These terms govern your use of the StreetPlate website and apps as a customer, and are written to meet the disclosure requirements of the Electronic Communications and Transactions Act 25 of 2002 (ECTA) and the Consumer Protection Act 68 of 2008 (CPA).",
    sections: [
      [
        "About StreetPlate",
        "StreetPlate is operated by KulaConnect, registration number K2025921054, with its registered address at G1031 Bhejane Road, KwaMashu and can be contacted at support@gmail.com. StreetPlate is a marketplace that connects customers with independent food vendors and independent delivery partners; StreetPlate does not itself prepare food or make deliveries.",
      ],
      [
        "Acceptance of these terms",
        "By creating an account or placing an order, you agree to be bound by these terms. If you do not agree, do not use StreetPlate.",
      ],
      [
        "Eligibility",
        "You must be at least 18 years old and have the legal capacity to enter into a binding contract to use StreetPlate.",
      ],
      [
        "Your account",
        "You are responsible for the accuracy of your account information and for keeping your login credentials secure. We may suspend or terminate accounts used in breach of these terms or applicable law.",
      ],
      [
        "Orders and when a contract is formed",
        "A binding order is only formed once the vendor accepts it and payment is confirmed by our server-side payment records. Listed prices, availability and delivery estimates may change until an order is confirmed.",
      ],
      [
        "Pricing and payment",
        "All prices are shown in South African Rand. Payments are processed by PayFast, a licensed South African payment gateway; StreetPlate does not store your full card details.",
      ],
      [
        "Delivery",
        "Delivery times shown are estimates only and are not guaranteed, as they depend on vendor preparation time, driver availability and factors outside our control.",
      ],
      [
        "Cancellations and refunds",
        "Cancellation and refund eligibility is set out in our Refund and Cancellation Policy, which forms part of these terms.",
      ],
      [
        "Your rights under the Consumer Protection Act",
        "Nothing in these terms limits your rights under the CPA, including your right to receive food of good quality that is reasonably suitable for its intended purpose, and your right to lodge a complaint with the National Consumer Commission or an accredited industry ombud if a dispute cannot be resolved directly with us.",
      ],
      [
        "Prohibited conduct",
        "You may not use StreetPlate for any unlawful purpose, to submit false information, or to interfere with the security or operation of the platform.",
      ],
      [
        "Intellectual property",
        "The StreetPlate name, logo and website content are owned by KulaConnect or its licensors and may not be used without permission.",
      ],
      [
        "Liability",
        "To the maximum extent permitted by law, StreetPlate's liability is limited as set out in this section; however, nothing in these terms excludes or limits any liability that cannot lawfully be excluded or limited under the Consumer Protection Act.",
      ],
      [
        "Governing law and disputes",
        "These terms are governed by the law of the Republic of South Africa. Disputes should first be raised with our support team at support@gmail.com; unresolved consumer disputes may be referred to the National Consumer Commission or the courts of South Africa.",
      ],
      [
        "Changes to these terms",
        "We may update these terms from time to time. Continued use of StreetPlate after an update constitutes acceptance of the revised terms.",
      ],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "This policy explains the cookies StreetPlate uses, why we use them, and your choices, in line with POPIA and the ECTA's requirements for automated data collection.",
    sections: [
      [
        "What are cookies",
        "Cookies are small text files stored on your device that help websites function and remember information between visits.",
      ],
      [
        "Essential cookies",
        "We use secure session cookies, provided by our authentication system, so that signed-in pages can verify who you are. These are necessary for the service to work and cannot be switched off without losing the ability to sign in.",
      ],
      [
        "Functional and preference cookies",
        "Any cookies used to remember your preferences are only set with a clear purpose and, where required, your consent.",
      ],
      [
        "Analytics and advertising",
        "StreetPlate does not currently use non-essential analytics or advertising cookies. If this changes, we will request your opt-in consent before any such cookie is set, as required by POPIA.",
      ],
      [
        "Third-party cookies",
        "Some features, such as address search, rely on third-party services (for example Google Maps) that may set their own cookies when in use, governed by that provider's own policy.",
      ],
      [
        "Managing cookies",
        "You can control or delete cookies through your browser settings. Disabling essential cookies will prevent you from signing in and placing orders.",
      ],
      [
        "Changes to this policy",
        "We may update this policy as the cookies we use change. The current version always applies to your use of the site.",
      ],
    ],
  },
  refunds: {
    title: "Refund and Cancellation Policy",
    intro:
      "This policy explains when an order can be cancelled and how refunds are handled, in a manner consistent with your rights under the Consumer Protection Act 68 of 2008.",
    sections: [
      [
        "Cancelling before vendor acceptance",
        "You may cancel an order free of charge at any time before the vendor accepts it.",
      ],
      [
        "Cancelling after vendor acceptance",
        "Once a vendor accepts your order and begins preparation, cancellation may no longer be possible. Where cancellation is still possible, any refund will account for costs already incurred by the vendor or driver.",
      ],
      [
        "Food that is unsafe, incorrect or not as described",
        "If your order arrives unsafe, materially different from what was ordered, or otherwise not of the quality you're entitled to expect, you may request a refund or replacement in line with sections 55 and 56 of the Consumer Protection Act. Report the issue through the app or to support@gmail.com as soon as possible, ideally within 24 hours of delivery.",
      ],
      [
        "Delivery issues",
        "If your order is not delivered, or is delivered significantly late through no fault of your own, you may be entitled to a full or partial refund.",
      ],
      [
        "How refunds are processed",
        "Refunds are verified against our payment and order records before being approved and are returned to your original payment method. Processing times depend on PayFast and your bank, and are typically completed within 24 to 72 hours of approval.",
      ],
      [
        "Raising a dispute",
        "If you're not satisfied with the outcome of a refund request, contact support@gmail.com to escalate it. If we cannot resolve your complaint directly, you may refer it to the Consumer Goods and Services Ombud or the National Consumer Commission.",
      ],
    ],
  },
  "vendor-terms": {
    title: "Vendor Terms",
    intro:
      "These terms set out the responsibilities of independent food businesses ('vendors') that list and sell food through StreetPlate.",
    sections: [
      [
        "Your role",
        "You operate your business independently of StreetPlate. Nothing in these terms creates an employment, agency, partnership or joint-venture relationship between you and StreetPlate.",
      ],
      [
        "Registration and compliance",
        "You warrant that your business is lawfully registered (as a company, sole proprietor or otherwise), holds all required municipal health and food-handling permits, and complies with the Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972, applicable municipal by-laws, and your own tax obligations to SARS.",
      ],
      [
        "Menu accuracy and food safety",
        "You are responsible for accurate menu descriptions and pricing, disclosing known allergens where practical, and preparing food safely and hygienically at all times.",
      ],
      [
        "Order fulfilment",
        "You must keep your availability and preparation times current in the app, and accept or decline orders promptly. You are responsible for having orders ready within the time you indicate.",
      ],
      [
        "Fees, commission and settlement",
        "StreetPlate charges a commission of 30% on completed orders. Settlement of amounts owed to you occurs every 7 days, less commission and any applicable deductions, details of which are available in your vendor dashboard.",
      ],
      [
        "Payment processing and disputes",
        "Customer payments are processed through PayFast. If a customer payment is disputed or reversed after you have been paid, StreetPlate may recover the corresponding amount from your future settlements, subject to our dispute review process.",
      ],
      [
        "Protecting customer information",
        "Where you receive customer personal information (such as delivery details) to fulfil an order, you act as an operator under POPIA: you may only use that information to fulfil the order, must keep it secure, and must notify StreetPlate promptly of any suspected data breach.",
      ],
      [
        "Suspension and termination",
        "We may suspend or terminate your access to StreetPlate for breach of these terms, repeated food-safety complaints, fraud, or as required by law, and will give notice where reasonably possible.",
      ],
      [
        "Independent contractor status",
        "You are an independent business, not an employee of StreetPlate. The Basic Conditions of Employment Act and Labour Relations Act do not apply to your relationship with StreetPlate, and you remain responsible for your own tax, UIF and any staff you employ.",
      ],
      [
        "Governing law and disputes",
        "These terms are governed by the law of the Republic of South Africa. Disputes should first be raised with support@gmail.com before any other proceedings are pursued.",
      ],
      [
        "Changes to these terms",
        "We may update these terms from time to time and will provide reasonable notice of material changes through the vendor dashboard.",
      ],
    ],
  },
  "driver-terms": {
    title: "Delivery Partner Terms",
    intro:
      "These terms set out the responsibilities of independent delivery partners ('drivers') who accept and complete deliveries through StreetPlate.",
    sections: [
      [
        "Your role",
        "You provide delivery services as an independent contractor. Nothing in these terms creates an employment, agency or partnership relationship between you and StreetPlate.",
      ],
      [
        "Eligibility and documentation",
        "You must hold a valid driver's licence appropriate to your vehicle, provide accurate vehicle registration and roadworthiness information, and comply with the National Road Traffic Act 93 of 1996 at all times.",
      ],
      [
        "Safety and conduct",
        "You must obey all road traffic laws, handle food hygienically while in transit, and treat customers and vendors with courtesy and respect.",
      ],
      [
        "Accepting and completing deliveries",
        "You choose which delivery offers to accept. While an order is active, StreetPlate shares your live location with the relevant customer and vendor for dispatch and safety purposes, with your consent.",
      ],
      [
        "Earnings and payment",
        "Earnings depend on demand, availability, accepted offers and completed deliveries; StreetPlate does not guarantee any minimum level of earnings. Payment is calculated as described in your driver dashboard and paid out at the end of each week.",
      ],
      [
        "Your location information",
        "Location data collected while you are online or on an active delivery is processed for dispatch, safety and support purposes under POPIA, and is retained only as long as necessary for those purposes.",
      ],
      [
        "Insurance and liability",
        "You are responsible for maintaining appropriate insurance for your own vehicle. [StreetPlate's position on liability for accidents or incidents during a delivery requires confirmation by qualified legal counsel before publication.]",
      ],
      [
        "Suspension and termination",
        "We may suspend or terminate your access to StreetPlate for breach of these terms, safety concerns, fraud, or as required by law, and will give notice where reasonably possible.",
      ],
      [
        "Independent contractor status",
        "You are an independent contractor, not an employee of StreetPlate. The Basic Conditions of Employment Act and Labour Relations Act do not apply to your relationship with StreetPlate, and you remain responsible for your own tax and UIF obligations.",
      ],
      [
        "Governing law and disputes",
        "These terms are governed by the law of the Republic of South Africa. Disputes should first be raised with support@gmail.com before any other proceedings are pursued.",
      ],
      [
        "Changes to these terms",
        "We may update these terms from time to time and will provide reasonable notice of material changes through the driver app.",
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
      </article>
    </>
  );
}
