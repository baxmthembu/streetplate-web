import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/password-form";

export const metadata: Metadata = { title: "Reset your password" };

const forgotPasswordFoods = [
  {
    src: "/food/sign-in-township-pap-stew.png",
    alt: "Pap, beef stew and chakalaka from a township cookshop",
  },
  {
    src: "/food/sign-in-township-shisanyama.png",
    alt: "Shisanyama cooking over a roadside charcoal braai",
  },
  {
    src: "/food/sign-in-township-kota.png",
    alt: "A freshly prepared kota at a local spaza takeaway",
  },
  {
    src: "/food/sign-in-township-amagwinya.png",
    alt: "Warm amagwinya with mince at a morning food stall",
  },
  {
    src: "/food/sign-in-township-grilled-chicken.png",
    alt: "Grilled chicken, chips and chakalaka from a corner takeaway",
  },
];

export default function ForgotPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password</h1>
        <p>We will send a secure recovery link if the account exists.</p>
        <ForgotPasswordForm />
        <p className="auth-privacy-note">
          <strong>Private by design.</strong> StreetPlate does not reveal
          whether an email address is registered.
        </p>
        <div className="auth-links">
          <Link href="/sign-in">Back to sign in</Link>
        </div>
      </div>
      <aside
        className="auth-food-mosaic"
        aria-label="A selection of StreetPlate meals"
      >
        {forgotPasswordFoods.map((food, index) => (
          <div className="auth-food-tile" key={food.src}>
            <Image
              src={food.src}
              alt={food.alt}
              fill
              preload={index === 0}
              sizes="(max-width: 980px) 100vw, 40vw"
            />
          </div>
        ))}
      </aside>
    </section>
  );
}
