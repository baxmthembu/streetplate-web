import type { Metadata } from "next";

import { RecruitmentPage } from "@/components/recruitment-page";

export const metadata: Metadata = {
  title: "Become a food vendor",
  description:
    "Learn how independent South African food businesses can grow with StreetPlate.",
};

export default function VendorRecruitmentPage() {
  return (
    <RecruitmentPage
      audience="vendor"
      title="Put your local food business on the map."
      description="StreetPlate helps independent kitchens and food vendors reach customers nearby while keeping control of menus and availability."
      benefits={[
        "Reach nearby customers",
        "Manage your own menu",
        "Receive order updates",
        "Build your local presence",
      ]}
      steps={[
        "Share your business and contact information.",
        "Provide location, menu and food-safety information.",
        "Submit required documents through private storage.",
        "Track review status before your business goes live.",
      ]}
    />
  );
}
