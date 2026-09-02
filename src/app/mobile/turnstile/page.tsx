import { MobileTurnstileBridge } from "@/components/mobile-turnstile-bridge";
import type { TurnstileAction } from "@/lib/turnstile";

const actions = new Set<TurnstileAction>([
  "login",
  "signup",
  "password_reset",
  "password_update",
]);
const apps = new Set(["customer", "vendor", "driver"] as const);

type MobileApp = "customer" | "vendor" | "driver";

export const metadata = {
  title: "StreetPlate security check",
  robots: { index: false, follow: false },
};

export default async function MobileTurnstilePage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; app?: string }>;
}) {
  const params = await searchParams;
  const action = actions.has(params.action as TurnstileAction)
    ? (params.action as TurnstileAction)
    : "login";
  const app = apps.has(params.app as MobileApp)
    ? (params.app as MobileApp)
    : "customer";

  return <MobileTurnstileBridge action={action} app={app} />;
}
