/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { BadgePercent, Gift } from "lucide-react";
import { VendorDataError } from "@/app/vendor/page";
import {
  ComboForm,
  DeleteComboForm,
  DeletePromotionForm,
  PromotionForm,
} from "@/components/vendor-forms";
import { formatRand } from "@/lib/format";
import {
  getVendorCombos,
  getVendorMenu,
  getVendorPromotions,
} from "@/lib/vendor-api";

export default async function VendorPromotionsPage() {
  try {
    const [{ promotions }, { combos }, { menu }] = await Promise.all([
      getVendorPromotions(),
      getVendorCombos(),
      getVendorMenu(),
    ]);
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Grow your orders</p>
            <h1>Promotions & combos</h1>
            <p>
              Create the same offers and meal bundles available in the vendor
              mobile app.
            </p>
          </div>
        </header>
        <div className="vendor-detail-grid">
          <section>
            <details className="vendor-create-panel">
              <summary>
                <BadgePercent size={18} />
                Create promotion
              </summary>
              <PromotionForm />
            </details>
            <div className="vendor-card-list">
              {promotions.map((promo) => (
                <article className="vendor-offer-card" key={promo.id}>
                  <span>
                    <BadgePercent size={22} />
                  </span>
                  <div>
                    <small>
                      {promo.is_active === false ? "Paused" : "Active"}
                    </small>
                    <h2>{promo.title}</h2>
                    <p>
                      {promo.description ||
                        `${promo.discount_value}${promo.type === "percentage" ? "%" : " rand"} discount`}
                    </p>
                    <strong>{promo.type.replaceAll("_", " ")}</strong>
                  </div>
                  <details>
                    <summary>Edit</summary>
                    <PromotionForm promotion={promo} />
                  </details>
                  <DeletePromotionForm id={promo.id} />
                </article>
              ))}
            </div>
            {!promotions.length && (
              <div className="vendor-empty-state">
                <BadgePercent size={28} />
                <strong>No promotions yet</strong>
                <p>Create an offer to encourage repeat orders.</p>
              </div>
            )}
          </section>
          <section>
            <details className="vendor-create-panel">
              <summary>
                <Gift size={18} />
                Create combo meal
              </summary>
              <ComboForm menu={menu} />
            </details>
            <div className="vendor-card-list">
              {combos.map((combo) => (
                <article className="vendor-offer-card" key={combo.id}>
                  <span>
                    <Gift size={22} />
                  </span>
                  <div>
                    <small>
                      {combo.is_available === false
                        ? "Unavailable"
                        : "Available"}
                    </small>
                    <h2>{combo.name}</h2>
                    <p>
                      {combo.combo_meal_items
                        ?.map((entry) => entry.menu_items?.name)
                        .filter(Boolean)
                        .join(" + ") ||
                        combo.description ||
                        "Combo meal"}
                    </p>
                    <strong>{formatRand(Number(combo.price))}</strong>
                  </div>
                  <DeleteComboForm id={combo.id} />
                </article>
              ))}
            </div>
            {!combos.length && (
              <div className="vendor-empty-state">
                <Gift size={28} />
                <strong>No combo meals yet</strong>
                <p>Bundle menu items into a simple customer offer.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
