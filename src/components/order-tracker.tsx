"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useActionState } from "react";

import {
  cancelOrder,
  submitReview,
  type AccountActionState,
} from "@/app/account/actions";
import type { CustomerOrder, OrderStatus } from "@/lib/commerce-types";
import { orderStatusCopy } from "@/lib/commerce-types";
import { formatRand } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const sequence: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "delivered",
];
const initialState: AccountActionState = { message: "" };

function CancelForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(cancelOrder, initialState);
  return (
    <form action={action} className="inline-action">
      <input type="hidden" name="orderId" value={orderId} />
      <label>
        Cancellation reason
        <input name="reason" maxLength={300} defaultValue="Plans changed" />
      </label>
      {state.message && (
        <p
          role="status"
          className={`form-message ${state.success ? "form-success" : ""}`}
        >
          {state.message}
        </p>
      )}
      <button className="button button-light" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel order"}
      </button>
    </form>
  );
}

function ReviewForm({
  order,
  targetType,
  targetId,
}: {
  order: CustomerOrder;
  targetType: "vendor" | "driver";
  targetId: string;
}) {
  const [state, action, pending] = useActionState(submitReview, initialState);
  return (
    <form action={action} className="review-form">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetType" value={targetType} />
      <label>
        {targetType === "vendor" ? "Vendor" : "Driver"} rating
        <select name="rating" defaultValue="5">
          <option value="5">5 — Excellent</option>
          <option value="4">4 — Good</option>
          <option value="3">3 — Okay</option>
          <option value="2">2 — Poor</option>
          <option value="1">1 — Very poor</option>
        </select>
      </label>
      <label>
        Comment
        <textarea name="comment" maxLength={1000} />
      </label>
      {state.message && (
        <p
          role="status"
          className={`form-message ${state.success ? "form-success" : ""}`}
        >
          {state.message}
        </p>
      )}
      <button className="button button-dark" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export function OrderTracker({
  initialOrder,
}: {
  initialOrder: CustomerOrder;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [connection, setConnection] = useState<
    "connecting" | "live" | "polling"
  >("connecting");
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/orders/${order.id}`, {
      cache: "no-store",
    });
    if (response.ok)
      setOrder(((await response.json()) as { order: CustomerOrder }).order);
  }, [order.id]);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 10_000);
    const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "");
    let socket: ReturnType<typeof io> | undefined;
    if (!socketBase) window.setTimeout(() => setConnection("polling"));
    else
      void createClient()
        ?.auth.getSession()
        .then(({ data }) => {
          const token = data.session?.access_token;
          if (!token) {
            setConnection("polling");
            return;
          }
          socket = io(`${socketBase}/orders`, {
            transports: ["websocket"],
            auth: { token },
          });
          socket.on("connect", () => {
            socket?.emit("join", { role: "customer" });
            setConnection("live");
          });
          socket.on("connect_error", () => setConnection("polling"));
          socket.on("order_status", (event: { orderId?: string }) => {
            if (event.orderId === order.id) void refresh();
          });
          socket.on("payment_confirmed", (event: { orderId?: string }) => {
            if (event.orderId === order.id) void refresh();
          });
        });
    return () => {
      window.clearInterval(timer);
      socket?.disconnect();
    };
  }, [order.id, refresh]);

  const currentIndex = sequence.indexOf(order.status);
  const canCancel = ["pending", "confirmed"].includes(order.status);
  const mapHref = order.driver?.location
    ? `https://www.google.com/maps/search/?api=1&query=${order.driver.location.latitude},${order.driver.location.longitude}`
    : null;
  return (
    <section className="shell content-page order-page">
      <div className="order-heading">
        <div>
          <p className="eyebrow">
            {order.order_number ?? `Order ${order.id.slice(0, 8)}`}
          </p>
          <h1>{orderStatusCopy[order.status].label}</h1>
          <p>{orderStatusCopy[order.status].detail}</p>
        </div>
        <span className={`live-indicator ${connection}`}>
          {connection === "live"
            ? "Live updates"
            : connection === "polling"
              ? "Secure refresh"
              : "Connecting"}
        </span>
      </div>
      {order.status === "cancelled" ? (
        <div className="legal-warning">This order was cancelled.</div>
      ) : (
        <ol className="status-timeline">
          {sequence.map((status, index) => (
            <li
              key={status}
              className={index <= currentIndex ? "complete" : ""}
            >
              <span>{index < currentIndex ? "✓" : index + 1}</span>
              <strong>{orderStatusCopy[status].label}</strong>
            </li>
          ))}
        </ol>
      )}
      <div className="order-detail-grid">
        <article className="account-panel">
          <h2>Order</h2>
          {order.order_items.map((item) => (
            <div className="order-line" key={item.id}>
              <span>
                {item.quantity} × {item.name}
              </span>
              <strong>{formatRand(Number(item.price) * item.quantity)}</strong>
            </div>
          ))}
          <div className="order-line">
            <span>Delivery</span>
            <strong>{formatRand(Number(order.delivery_fee))}</strong>
          </div>
          <div className="order-line order-total">
            <span>Total</span>
            <strong>{formatRand(Number(order.total))}</strong>
          </div>
          <p>{order.delivery_address}</p>
        </article>
        <article className="account-panel">
          <h2>Delivery</h2>
          <p>
            <strong>
              {order.vendors?.business_name ?? "StreetPlate vendor"}
            </strong>
          </p>
          {order.driver ? (
            <>
              <p>
                Driver: {order.driver.name}
                {order.driver.phone ? ` · ${order.driver.phone}` : ""}
              </p>
              {mapHref ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-light"
                >
                  View latest verified location
                </a>
              ) : (
                <p>Driver location will appear after pickup.</p>
              )}
            </>
          ) : (
            <p>A delivery partner has not been assigned yet.</p>
          )}
          <p className="small-print">
            Location is refreshed only through the authenticated order endpoint.
            The legacy tracking socket is not used because it lacks an
            order-ownership check.
          </p>
        </article>
      </div>
      {order.status === "pending" && (
        <Link
          href={`/checkout/payment?order=${order.id}`}
          className="button button-orange"
        >
          Complete payment
        </Link>
      )}
      {canCancel && (
        <details className="order-action">
          <summary>Need to cancel?</summary>
          <CancelForm orderId={order.id} />
        </details>
      )}
      {order.status === "delivered" && (
        <section className="review-grid">
          {!order.vendor_reviewed && order.vendor_id && (
            <ReviewForm
              order={order}
              targetType="vendor"
              targetId={order.vendor_id}
            />
          )}
          {!order.driver_reviewed && order.driver_id && (
            <ReviewForm
              order={order}
              targetType="driver"
              targetId={order.driver_id}
            />
          )}
        </section>
      )}
    </section>
  );
}
