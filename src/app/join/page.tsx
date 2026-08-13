import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { RegisterForm } from "@/components/register-form";
import { getSafeInternalPath } from "@/lib/auth-navigation";

export const metadata: Metadata = { title: "Join StreetPlate" };

const joinFoods = [
  {
    src: "/food/join-township-biryani.png",
    alt: "Durban chicken biryani served at a township food stall",
  },
  {
    src: "/food/join-township-mogodu.png",
    alt: "Mogodu with pap and chakalaka on an enamel plate",
  },
  {
    src: "/food/join-township-umngqusho.png",
    alt: "Umngqusho with lamb stew at a community food stall",
  },
  {
    src: "/food/join-township-malva.png",
    alt: "Malva pudding and custard in a takeaway bowl",
  },
  {
    src: "/food/join-township-bobotie.png",
    alt: "Cape Malay bobotie and yellow rice from a local market stall",
  },
];

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const rawNext = (await searchParams).next;
  const nextPath = getSafeInternalPath(
    typeof rawNext === "string" ? rawNext : undefined,
  );

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">One account, mobile and web</p>
        <h1>Join StreetPlate</h1>
        <RegisterForm />
        <div className="auth-links">
          <Link
            href={
              nextPath
                ? { pathname: "/sign-in", query: { next: nextPath } }
                : "/sign-in"
            }
          >
            Already have an account?
          </Link>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
      <aside
        className="auth-food-mosaic"
        aria-label="A selection of South African StreetPlate meals"
      >
        {joinFoods.map((food, index) => (
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
