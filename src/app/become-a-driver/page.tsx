import type { Metadata } from "next";

import { RecruitmentPage } from "@/components/recruitment-page";

export const metadata: Metadata = {
  title: "Become a delivery driver",
  description:
    "Learn about applying as a StreetPlate delivery partner in South Africa.",
};

export default function DriverRecruitmentPage() {
  return (
    <RecruitmentPage
      audience="driver"
      title="Help local food travel further."
      description="Apply to deliver in your area. Earnings vary by demand, availability, accepted offers and completed deliveries. StreetPlate does not guarantee earnings."
      benefits={[
        "Deliver in familiar areas",
        "Choose when you are available",
        "See delivery offers in the app",
        "Track completed deliveries",
      ]}
      steps={[
        "Share personal and contact information.",
        "Add vehicle and licence details where applicable.",
        "Upload identity and proof-of-address documents securely.",
        "Track application review before receiving delivery offers.",
      ]}
    />
  );
}
