import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteAddress, removeVendor } from "@/app/account/actions";
import { signOut } from "@/app/auth/actions";
import { AddressForm, ProfileForm } from "@/components/account-forms";
import { ProtectedMutationForm } from "@/components/protected-mutation-form";
import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import type {
  CustomerOrder,
  CustomerProfile,
  SavedAddress,
} from "@/lib/commerce-types";
import { formatRand } from "@/lib/format";

export const metadata: Metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

type FavoriteVendor = {
  id: string;
  business_name: string;
  description?: string | null;
};

export default async function AccountPage() {
  let authenticatedUser: CustomerProfile | undefined;
  try {
    const response = await streetPlateApi<{ user: CustomerProfile }>(
      "/auth/profile",
    );
    authenticatedUser = response.user;
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401) {
      redirect(
        error.code === "PROFILE_INCOMPLETE"
          ? "/complete-profile?next=/account"
          : "/sign-in",
      );
    }
    return (
      <section className="shell content-page content-narrow">
        <h1>Your account is temporarily unavailable</h1>
        <p>{error instanceof Error ? error.message : "Try again shortly."}</p>
      </section>
    );
  }

  if (authenticatedUser.role === "driver") redirect("/driver");
  if (authenticatedUser.role === "vendor") redirect("/vendor");
  if (authenticatedUser.role !== "customer") {
    return (
      <section className="shell content-page content-narrow">
        <p className="eyebrow">{authenticatedUser.role} account</p>
        <h1>
          Continue in your StreetPlate {authenticatedUser.role} application
        </h1>
        <p>
          Your existing operational application remains the canonical workspace
          for {authenticatedUser.role} tools.
        </p>
        <form action={signOut}>
          <button className="button button-dark">Sign out</button>
        </form>
      </section>
    );
  }

  let accountData:
    | [
        { addresses: SavedAddress[] },
        { favorites: FavoriteVendor[] },
        { orders: CustomerOrder[] },
      ]
    | undefined;
  let loadError = "";
  try {
    accountData = await Promise.all([
      streetPlateApi<{ addresses: SavedAddress[] }>("/customers/addresses"),
      streetPlateApi<{ favorites: FavoriteVendor[] }>(
        "/customers/favorites/vendors",
      ),
      streetPlateApi<{ orders: CustomerOrder[] }>("/orders?limit=50"),
    ]);
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect("/sign-in");
    loadError = error instanceof Error ? error.message : "Try again shortly.";
  }
  if (!accountData)
    return (
      <section className="shell content-page content-narrow">
        <h1>Your account is temporarily unavailable</h1>
        <p>{loadError}</p>
      </section>
    );

  const [{ addresses }, { favorites }, { orders }] = accountData;
  const user = authenticatedUser;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );
  return (
    <section className="shell content-page account-page">
      <div className="account-heading">
        <div>
          <h2 className="eyebrow">Hello, {user.name}</h2>
          <h1>{user.email}</h1>
        </div>
      </div>
      <div className="account-grid">
        <article className="account-panel">
          <h2>Profile</h2>
          <ProfileForm profile={user} />
        </article>
        <article className="account-panel">
          <h2>Saved addresses</h2>
          {addresses.length === 0 ? (
            <p>No addresses saved yet.</p>
          ) : (
            <div className="account-list">
              {addresses.map((address) => (
                <div key={address.id}>
                  <div>
                    <strong>
                      {address.label}
                      {address.is_default ? " · Default" : ""}
                    </strong>
                    <p>{address.address}</p>
                  </div>
                  <ProtectedMutationForm
                    action={deleteAddress}
                    buttonClassName="text-danger"
                    buttonLabel="Remove"
                    fields={{ id: address.id }}
                  />
                </div>
              ))}
            </div>
          )}
          <details>
            <summary>Add an address</summary>
            <AddressForm />
          </details>
        </article>
        <article className="account-panel account-panel-wide">
          <div className="panel-heading">
            <h2>Active orders</h2>
            <Link href="#order-history">Order history</Link>
          </div>
          {activeOrders.length === 0 ? (
            <p>No active orders.</p>
          ) : (
            <div className="order-list">
              {activeOrders.map((order) => (
                <Link href={`/orders/${order.id}`} key={order.id}>
                  <div>
                    <strong>
                      {order.vendors?.business_name ?? "StreetPlate order"}
                    </strong>
                    <span>{order.order_number ?? order.id.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span>{order.status.replaceAll("_", " ")}</span>
                    <strong>{formatRand(Number(order.total))}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
        <article className="account-panel">
          <h2>Favourite vendors</h2>
          {favorites.length === 0 ? (
            <p>No favourites saved yet.</p>
          ) : (
            <div className="account-list">
              {favorites.map((vendor) => (
                <div key={vendor.id}>
                  <div>
                    <strong>{vendor.business_name}</strong>
                    <p>{vendor.description}</p>
                  </div>
                  <ProtectedMutationForm
                    action={removeVendor}
                    buttonClassName="text-danger"
                    buttonLabel="Remove"
                    fields={{ vendorId: vendor.id }}
                  />
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="account-panel" id="order-history">
          <h2>Order history</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="account-list">
              {orders.map((order) => (
                <Link href={`/orders/${order.id}`} key={order.id}>
                  <strong>{order.order_number ?? order.id.slice(0, 8)}</strong>
                  <span className="order-history-meta">
                    {order.status.replaceAll("_", " ")} ·{" "}
                    <span>{formatRand(Number(order.total))}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
