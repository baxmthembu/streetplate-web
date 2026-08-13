import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DriverShell } from "@/components/driver-shell";
import { StreetPlateApiError } from "@/lib/backend";
import { getDriverUser } from "@/lib/driver-api";

export const metadata: Metadata = {
  title: { default: "Driver portal", template: "%s | StreetPlate Driver" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: string;
  try {
    const { user } = await getDriverUser();
    role = user.role;
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect("/sign-in?next=/driver");
    throw error;
  }

  if (role === "vendor") redirect("/vendor");
  if (role !== "driver") redirect("/account");

  return <DriverShell>{children}</DriverShell>;
}
