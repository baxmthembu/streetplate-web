/* eslint-disable react-hooks/error-boundaries -- awaited API failures render the vendor data fallback */
import { ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import { VendorDataError } from "@/app/vendor/page";
import { MenuItemActions, MenuItemForm } from "@/components/vendor-forms";
import { formatRand } from "@/lib/format";
import { getVendorMenu } from "@/lib/vendor-api";

function menuImage(item: {
  image_url?: string | null;
  images?: string[] | null;
}) {
  if (item.images?.[0]) return item.images[0];
  if (!item.image_url) return null;
  try {
    const parsed = JSON.parse(item.image_url);
    return Array.isArray(parsed) ? parsed[0] : item.image_url;
  } catch {
    return item.image_url;
  }
}
export default async function VendorMenuPage() {
  try {
    const { menu } = await getVendorMenu();
    return (
      <div className="vendor-page">
        <header className="vendor-page-heading">
          <div>
            <p className="eyebrow">Food catalogue</p>
            <h1>Menu</h1>
            <p>
              Add meals, update prices and control what customers can order
              right now.
            </p>
          </div>
        </header>
        <details className="vendor-create-panel">
          <summary>
            <Plus size={18} />
            Add a menu item
          </summary>
          <MenuItemForm />
        </details>
        <section className="vendor-menu-grid">
          {menu.map((item) => (
            <article className="vendor-menu-card" key={item.id}>
              <div className="vendor-menu-image">
                {menuImage(item) ? (
                  <Image
                    src={menuImage(item)!}
                    alt=""
                    width={480}
                    height={300}
                    sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 33vw"
                  />
                ) : (
                  <ImageIcon size={28} />
                )}
              </div>
              <div className="vendor-menu-copy">
                <span>{item.category ?? "Menu"}</span>
                <h2>{item.name}</h2>
                <p>{item.description || "No description yet."}</p>
                <strong>{formatRand(Number(item.price))}</strong>
                <small
                  className={
                    item.is_available === false ? "unavailable" : "available"
                  }
                >
                  {item.is_available === false ? "Unavailable" : "Available"}
                </small>
              </div>
              <details>
                <summary>Edit item</summary>
                <MenuItemForm item={item} />
              </details>
              <MenuItemActions item={item} />
            </article>
          ))}
        </section>
        {!menu.length && (
          <div className="vendor-empty-state vendor-empty-wide">
            <ImageIcon size={30} />
            <strong>No menu items yet</strong>
            <p>Add your first meal above.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return <VendorDataError error={error} />;
  }
}
