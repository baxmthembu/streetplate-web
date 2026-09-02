"use client";

import { useActionState, useState } from "react";

import {
  deleteCombo,
  deleteMenuItem,
  deletePromotion,
  respondToVendorReview,
  saveCombo,
  saveMenuItem,
  savePromotion,
  toggleMenuItem,
  updateVendorAvailability,
  updateVendorBankDetails,
  updateVendorOrderStatus,
  updateVendorProfile,
  type VendorActionState,
} from "@/app/vendor/actions";
import type { CustomerOrder } from "@/lib/commerce-types";
import type {
  VendorCombo,
  VendorMenuItem,
  VendorProfile,
  VendorPromotion,
  VendorReview,
} from "@/lib/vendor-types";
import { vendorStatusLabels, vendorTransitions } from "@/lib/vendor-types";

const initialState: VendorActionState = { message: "" };
function Message({ state }: { state: VendorActionState }) {
  return state.message ? (
    <p
      role="status"
      className={`form-message ${state.success ? "form-success" : ""}`}
    >
      {state.message}
    </p>
  ) : null;
}

export function VendorAvailabilityForm({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(
    updateVendorAvailability,
    initialState,
  );
  return (
    <form action={action} className="vendor-availability-form">
      <input type="hidden" name="is_open" value={String(!open)} />
      <button
        className={`button ${open ? "button-light" : "button-orange"}`}
        disabled={pending}
      >
        {pending ? "Updating…" : open ? "Close store" : "Open store"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function VendorOrderStatusForm({ order }: { order: CustomerOrder }) {
  const [state, action, pending] = useActionState(
    updateVendorOrderStatus,
    initialState,
  );
  const options = vendorTransitions[order.status] ?? [];
  const [status, setStatus] = useState<string>(options[0] ?? "");
  if (!options.length) return null;
  return (
    <form action={action} className="vendor-form compact">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="currentStatus" value={order.status} />
      <label>
        Next action
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {options.map((value) => (
            <option key={value} value={value}>
              {vendorStatusLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {status === "cancelled" && (
        <label>
          Cancellation reason
          <textarea
            name="cancel_reason"
            maxLength={500}
            required
            aria-invalid={state.field === "cancel_reason"}
          />
        </label>
      )}
      <button className="button button-orange" disabled={pending}>
        {pending ? "Updating…" : "Update order"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function MenuItemForm({ item }: { item?: VendorMenuItem }) {
  const [state, action, pending] = useActionState(saveMenuItem, initialState);
  return (
    <form action={action} className="vendor-form form-grid">
      {item && <input type="hidden" name="itemId" value={item.id} />}
      <label>
        Item name
        <input
          name="name"
          defaultValue={item?.name ?? ""}
          required
          maxLength={255}
          aria-invalid={state.field === "name"}
        />
      </label>
      <label>
        Category
        <input
          name="category"
          defaultValue={item?.category ?? ""}
          required
          maxLength={100}
          aria-invalid={state.field === "category"}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          maxLength={1000}
          aria-invalid={state.field === "description"}
        />
      </label>
      <label>
        Price (R)
        <input
          name="price"
          defaultValue={String(item?.price ?? "")}
          type="number"
          min="0.01"
          step="0.01"
          required
          aria-invalid={state.field === "price"}
        />
      </label>
      <label>
        Preparation time (minutes)
        <input
          name="preparation_time"
          defaultValue={item?.preparation_time ?? 20}
          type="number"
          min="1"
          max="600"
          required
        />
      </label>
      <label>
        Availability
        <select
          name="is_available"
          defaultValue={String(item?.is_available !== false)}
        >
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </label>
      <label className="form-span">
        Food image
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      <div className="form-span">
        <Message state={state} />
        <button className="button button-dark" disabled={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Add menu item"}
        </button>
      </div>
    </form>
  );
}

export function MenuItemActions({ item }: { item: VendorMenuItem }) {
  const [toggleState, toggleAction, toggling] = useActionState(
    toggleMenuItem,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteMenuItem,
    initialState,
  );
  return (
    <div className="vendor-inline-actions">
      <form action={toggleAction}>
        <input type="hidden" name="itemId" value={item.id} />
        <input
          type="hidden"
          name="is_available"
          value={String(item.is_available === false)}
        />
        <button className="button button-light" disabled={toggling}>
          {item.is_available === false ? "Make available" : "Mark unavailable"}
        </button>
        <Message state={toggleState} />
      </form>
      <form action={deleteAction}>
        <input type="hidden" name="itemId" value={item.id} />
        <button className="button button-danger" disabled={deleting}>
          Delete
        </button>
        <Message state={deleteState} />
      </form>
    </div>
  );
}

export function PromotionForm({ promotion }: { promotion?: VendorPromotion }) {
  const [state, action, pending] = useActionState(savePromotion, initialState);
  return (
    <form action={action} className="vendor-form form-grid">
      {promotion && (
        <input type="hidden" name="promotionId" value={promotion.id} />
      )}
      <label>
        Promotion title
        <input name="title" defaultValue={promotion?.title ?? ""} required />
      </label>
      <label>
        Discount type
        <select name="type" defaultValue={promotion?.type ?? "percentage"}>
          <option value="percentage">Percentage</option>
          <option value="fixed_amount">Fixed amount</option>
          <option value="bogo">Buy one, get one</option>
          <option value="happy_hour">Happy hour</option>
        </select>
      </label>
      <label>
        Discount value
        <input
          name="discount_value"
          defaultValue={String(promotion?.discount_value ?? 10)}
          type="number"
          min="0"
          step="0.01"
          required
        />
      </label>
      <label>
        Minimum order
        <input
          name="minimum_order"
          defaultValue={String(promotion?.minimum_order ?? 0)}
          type="number"
          min="0"
          step="0.01"
          required
        />
      </label>
      <label className="form-span">
        Description
        <textarea
          name="description"
          defaultValue={promotion?.description ?? ""}
          maxLength={1000}
        />
      </label>
      <label>
        Status
        <select
          name="is_active"
          defaultValue={String(promotion?.is_active !== false)}
        >
          <option value="true">Active</option>
          <option value="false">Paused</option>
        </select>
      </label>
      <div className="form-span">
        <Message state={state} />
        <button className="button button-orange" disabled={pending}>
          {pending
            ? "Saving…"
            : promotion
              ? "Save promotion"
              : "Create promotion"}
        </button>
      </div>
    </form>
  );
}

export function DeletePromotionForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    deletePromotion,
    initialState,
  );
  return (
    <form action={action}>
      <input type="hidden" name="promotionId" value={id} />
      <button className="button button-danger" disabled={pending}>
        Delete
      </button>
      <Message state={state} />
    </form>
  );
}

export function ComboForm({
  menu,
  combo,
}: {
  menu: VendorMenuItem[];
  combo?: VendorCombo;
}) {
  const [state, action, pending] = useActionState(saveCombo, initialState);
  const selected = new Set(
    combo?.combo_meal_items
      ?.map((entry) => entry.menu_items?.id)
      .filter(Boolean),
  );
  return (
    <form action={action} className="vendor-form form-grid">
      {combo && <input type="hidden" name="comboId" value={combo.id} />}
      <label>
        Combo name
        <input name="name" defaultValue={combo?.name ?? ""} required />
      </label>
      <label>
        Combo price
        <input
          name="price"
          defaultValue={String(combo?.price ?? "")}
          type="number"
          min="0.01"
          step="0.01"
          required
        />
      </label>
      <label className="form-span">
        Description
        <textarea name="description" defaultValue={combo?.description ?? ""} />
      </label>
      <fieldset className="form-span choice-grid">
        <legend>Included menu items</legend>
        {menu.map((item) => (
          <label key={item.id} className="check-row">
            <input
              type="checkbox"
              name="items"
              value={item.id}
              defaultChecked={selected.has(item.id)}
            />
            {item.name}
          </label>
        ))}
      </fieldset>
      <label>
        Availability
        <select
          name="is_available"
          defaultValue={String(combo?.is_available !== false)}
        >
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </label>
      <label>
        Combo image
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      <div className="form-span">
        <Message state={state} />
        <button className="button button-dark" disabled={pending}>
          {pending ? "Saving…" : combo ? "Save combo" : "Create combo"}
        </button>
      </div>
    </form>
  );
}

export function DeleteComboForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteCombo, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="comboId" value={id} />
      <button className="button button-danger" disabled={pending}>
        Delete
      </button>
      <Message state={state} />
    </form>
  );
}

export function ReviewResponseForm({ review }: { review: VendorReview }) {
  const [state, action, pending] = useActionState(
    respondToVendorReview,
    initialState,
  );
  return (
    <form action={action} className="vendor-form compact">
      <input type="hidden" name="reviewId" value={review.id} />
      <label>
        Your public response
        <textarea
          name="response"
          defaultValue={review.response ?? ""}
          required
          maxLength={1000}
        />
      </label>
      <button className="button button-dark" disabled={pending}>
        {pending
          ? "Publishing…"
          : review.response
            ? "Update response"
            : "Respond"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function VendorProfileForm({ vendor }: { vendor: VendorProfile }) {
  const [state, action, pending] = useActionState(
    updateVendorProfile,
    initialState,
  );
  return (
    <form action={action} className="vendor-form form-grid">
      <label>
        Business name
        <input
          name="business_name"
          defaultValue={vendor.business_name}
          required
        />
      </label>
      <label>
        Phone
        <input name="phone" defaultValue={vendor.phone ?? ""} required />
      </label>
      <label className="form-span">
        Description
        <textarea
          name="description"
          defaultValue={vendor.description ?? ""}
          required
        />
      </label>
      <label className="form-span">
        Pickup address
        <input name="address" defaultValue={vendor.address ?? ""} required />
      </label>
      <label className="form-span">
        Cover image URL
        <input
          name="cover_image"
          type="url"
          defaultValue={vendor.cover_image ?? ""}
          required
        />
      </label>
      <label>
        Status
        <select name="is_open" defaultValue={String(vendor.is_open === true)}>
          <option value="true">Open</option>
          <option value="false">Closed</option>
        </select>
      </label>
      <div className="form-span">
        <Message state={state} />
        <button className="button button-dark" disabled={pending}>
          {pending ? "Saving…" : "Save business profile"}
        </button>
      </div>
    </form>
  );
}

export function VendorBankForm() {
  const [state, action, pending] = useActionState(
    updateVendorBankDetails,
    initialState,
  );
  return (
    <form action={action} className="vendor-form form-grid">
      <label>
        Bank
        <input name="bank_name" required />
      </label>
      <label>
        Account holder
        <input name="account_holder" required />
      </label>
      <label>
        Account number
        <input name="account_number" inputMode="numeric" required />
      </label>
      <label>
        Branch code
        <input name="branch_code" inputMode="numeric" required />
      </label>
      <label>
        Account type
        <select name="account_type">
          <option value="savings">Savings</option>
          <option value="cheque">Cheque</option>
          <option value="current">Current</option>
        </select>
      </label>
      <div className="form-span">
        <Message state={state} />
        <button className="button button-orange" disabled={pending}>
          {pending ? "Saving securely…" : "Save payout details"}
        </button>
        <p className="small-print">
          Bank details are sent through the authenticated backend and never
          placed in the page URL.
        </p>
      </div>
    </form>
  );
}
