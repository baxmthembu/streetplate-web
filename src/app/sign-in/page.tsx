import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SignInForm } from "@/components/sign-in-form";
import { getSafeInternalPath } from "@/lib/auth-navigation";
import {
  getAuthCallbackMessage,
  getAuthNoticeMessage,
} from "@/lib/auth-messages";

export const metadata: Metadata = { title: "Sign in" };

const signInFoods = [
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

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const rawNext = params.next;
  const rawError = params.error;
  const rawMessage = params.message;
  const nextPath = getSafeInternalPath(
    typeof rawNext === "string" ? rawNext : undefined,
  );
  const callbackMessage = getAuthCallbackMessage(
    typeof rawError === "string" ? rawError : undefined,
  );
  const noticeMessage = getAuthNoticeMessage(
    typeof rawMessage === "string" ? rawMessage : undefined,
  );
  const pageMessage = callbackMessage ?? noticeMessage;
  const pageMessageIsSuccess = !callbackMessage && Boolean(noticeMessage);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to StreetPlate</h1>
        <p>
          Use the same email and password as your StreetPlate mobile account.
        </p>
        {pageMessage && (
          <p
            className={`form-message ${pageMessageIsSuccess ? "form-success" : ""}`}
            role={pageMessageIsSuccess ? "status" : "alert"}
          >
            {pageMessage}
          </p>
        )}
        <SignInForm nextPath={nextPath ?? undefined} />
        <div className="auth-links">
          <Link
            href={
              nextPath
                ? { pathname: "/join", query: { next: nextPath } }
                : "/join"
            }
          >
            Need an account?
          </Link>
          <Link href="/forgot-password">Forgot your password?</Link>
        </div>
      </div>
      <aside
        className="auth-food-mosaic"
        aria-label="A selection of StreetPlate meals"
      >
        {signInFoods.map((food, index) => (
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
