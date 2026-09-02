"use client";

import { useActionState, useState } from "react";

import {
  advanceDeliveryStatus,
  type DriverActionState,
} from "@/app/driver/actions";
import { driverStatusAction, type DriverOrder } from "@/lib/driver-types";

const initialState: DriverActionState = { message: "" };

export function DriverStatusForm({ order }: { order: DriverOrder }) {
  const [arrivedAtVendor, setArrivedAtVendor] = useState(false);
  const [state, action, pending] = useActionState(
    advanceDeliveryStatus,
    initialState,
  );
  const awaitingPickup = ["confirmed", "ready_for_pickup"].includes(
    order.status,
  );
  const label = awaitingPickup
    ? arrivedAtVendor
      ? "Pick up order"
      : "Arrived at vendor"
    : driverStatusAction[order.status];
  if (!label) return null;
  return (
    <form action={action} className="driver-status-form">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="currentStatus" value={order.status} />
      <button
        className="button button-orange"
        type={awaitingPickup && !arrivedAtVendor ? "button" : "submit"}
        onClick={
          awaitingPickup && !arrivedAtVendor
            ? () => setArrivedAtVendor(true)
            : undefined
        }
        disabled={pending}
      >
        {pending ? "Updating…" : label}
      </button>
      {awaitingPickup && arrivedAtVendor && !state.message && (
        <p className="driver-status-hint" role="status">
          Arrival confirmed. Check the order items before collecting the food.
        </p>
      )}
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
