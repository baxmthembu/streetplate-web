import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VendorShell } from "@/components/vendor-shell";
import { StreetPlateApiError } from "@/lib/backend";
import { getVendorUser } from "@/lib/vendor-api";

export const metadata: Metadata = {
  title: { default: "Vendor workspace", template: "%s | StreetPlate Vendor" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user } = await getVendorUser();
    if (user.role === "driver") redirect("/driver");
    if (user.role !== "vendor") redirect("/account");
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect("/sign-in?next=/vendor");
    throw error;
  }
  return <VendorShell>{children}</VendorShell>;
}
