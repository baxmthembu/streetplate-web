/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { Landmark, Store } from "lucide-react";
import { VendorDataError } from "@/app/vendor/page";
import { VendorBankForm, VendorProfileForm } from "@/components/vendor-forms";
import { getVendorProfile, getVendorUser } from "@/lib/vendor-api";

export default async function VendorAccountPage() {
  try {
    const [{ user }, { vendor }] = await Promise.all([
      getVendorUser(),
      getVendorProfile(),
    ]);
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Vendor settings</p>
            <h1>Business account</h1>
            <p>
              {user.email} · Your web and mobile vendor tools share this
              StreetPlate account.
            </p>
          </div>
        </header>
        <div className="vendor-detail-grid">
          <section className="vendor-settings-card">
            <div className="vendor-settings-heading">
              <span>
                <Store size={22} />
              </span>
              <div>
                <h2>Business profile</h2>
                <p>Details customers and delivery partners use.</p>
              </div>
            </div>
            <VendorProfileForm vendor={vendor} />
          </section>
          <section className="vendor-settings-card">
            <div className="vendor-settings-heading">
              <span>
                <Landmark size={22} />
              </span>
              <div>
                <h2>Payout bank account</h2>
                <p>Secure settlement details for vendor earnings.</p>
              </div>
            </div>
            <VendorBankForm />
          </section>
        </div>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
