"use client";

import { useActionState, useState } from "react";

import {
  type DriverActionState,
  revokeDriverSession,
  revokeOtherDriverSessions,
  updateDriverBankDetails,
  updateDriverVehicle,
} from "@/app/driver/actions";
import type { DriverProfile, DriverSession } from "@/lib/driver-types";

const initialState: DriverActionState = { message: "" };
const saBanks = [
  { name: "Capitec Bank", branchCode: "470010" },
  { name: "FNB (First National)", branchCode: "250655" },
  { name: "Standard Bank", branchCode: "051001" },
  { name: "ABSA", branchCode: "632005" },
  { name: "Nedbank", branchCode: "198765" },
  { name: "African Bank", branchCode: "430000" },
  { name: "TymeBank", branchCode: "678910" },
  { name: "Discovery Bank", branchCode: "679000" },
] as const;

function Message({ state }: { state: DriverActionState }) {
  return state.message ? (
    <p
      role="status"
      className={`form-message ${state.success ? "form-success" : ""}`}
    >
      {state.message}
    </p>
  ) : null;
}

export function DriverVehicleForm({ profile }: { profile: DriverProfile }) {
  const [state, action, pending] = useActionState(
    updateDriverVehicle,
    initialState,
  );
  const [vehicleType, setVehicleType] = useState<string>(
    profile.vehicle_type ?? "motorbike",
  );
  const [plateNumber, setPlateNumber] = useState(profile.plate_number ?? "");
  return (
    <form action={action} className="driver-form">
      <label>
        Vehicle type
        <select
          name="vehicle_type"
          value={vehicleType}
          onChange={(event) => setVehicleType(event.target.value)}
          aria-invalid={state.field === "vehicle_type"}
        >
          <option value="motorbike">Motorbike / scooter</option>
          <option value="car">Car</option>
        </select>
      </label>
      <label>
        Registration number
        <input
          name="plate_number"
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value)}
          aria-invalid={state.field === "plate_number"}
          maxLength={20}
          placeholder="e.g. CA 123-456"
        />
      </label>
      <Message state={state} />
      <button className="button button-dark" disabled={pending}>
        {pending ? "Saving…" : "Save vehicle"}
      </button>
    </form>
  );
}

export function DriverBankForm({ profile }: { profile: DriverProfile }) {
  const [state, action, pending] = useActionState(
    updateDriverBankDetails,
    initialState,
  );
  const [values, setValues] = useState({
    bank_name: profile.bank_name ?? "",
    account_holder: profile.account_holder ?? "",
    account_number: profile.account_number ?? "",
    branch_code: profile.branch_code ?? "",
    account_type: profile.account_type ?? "savings",
  });
  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }
  function selectBank(bankName: string) {
    const bank = saBanks.find(({ name }) => name === bankName);
    setValues((current) => ({
      ...current,
      bank_name: bankName,
      branch_code: bank?.branchCode ?? current.branch_code,
    }));
  }
  return (
    <form action={action} className="driver-form driver-bank-form">
      <label>
        Bank
        <select
          name="bank_name"
          value={values.bank_name}
          onChange={(event) => selectBank(event.target.value)}
          aria-invalid={state.field === "bank_name"}
          required
        >
          <option value="">Select your bank</option>
          {saBanks.map((bank) => (
            <option key={bank.name} value={bank.name}>
              {bank.name}
            </option>
          ))}
          {values.bank_name &&
            !saBanks.some(({ name }) => name === values.bank_name) && (
              <option value={values.bank_name}>{values.bank_name}</option>
            )}
        </select>
      </label>
      <label>
        Account holder
        <input
          name="account_holder"
          value={values.account_holder}
          onChange={(event) =>
            updateValue("account_holder", event.target.value)
          }
          aria-invalid={state.field === "account_holder"}
          required
          maxLength={255}
          autoComplete="name"
        />
      </label>
      <label>
        Account number
        <input
          name="account_number"
          value={values.account_number}
          onChange={(event) =>
            updateValue("account_number", event.target.value)
          }
          aria-invalid={state.field === "account_number"}
          required
          maxLength={50}
          inputMode="numeric"
          autoComplete="off"
        />
      </label>
      <label>
        Branch code
        <input
          name="branch_code"
          value={values.branch_code}
          onChange={(event) => updateValue("branch_code", event.target.value)}
          aria-invalid={state.field === "branch_code"}
          required
          maxLength={20}
          inputMode="numeric"
          autoComplete="off"
        />
      </label>
      <label>
        Account type
        <select
          name="account_type"
          value={values.account_type}
          onChange={(event) => updateValue("account_type", event.target.value)}
          aria-invalid={state.field === "account_type"}
        >
          <option value="savings">Savings</option>
          <option value="cheque">Cheque</option>
          <option value="current">Current</option>
        </select>
      </label>
      <Message state={state} />
      <button className="button button-orange" disabled={pending}>
        {pending ? "Saving securely…" : "Save payout details"}
      </button>
      <p className="small-print">
        Only the final four digits are shown elsewhere in the portal.
        StreetPlate never places bank details in the browser URL.
      </p>
    </form>
  );
}

export function DriverSessions({ sessions }: { sessions: DriverSession[] }) {
  const [otherState, otherAction, otherPending] = useActionState(
    revokeOtherDriverSessions,
    initialState,
  );
  return (
    <div className="driver-sessions">
      <div className="driver-session-list">
        {sessions.map((session) => (
          <DriverSessionRow key={session.id} session={session} />
        ))}
      </div>
      {sessions.some((session) => !session.is_current) && (
        <form action={otherAction}>
          <button className="button button-light" disabled={otherPending}>
            {otherPending ? "Signing out…" : "Sign out everywhere else"}
          </button>
          <Message state={otherState} />
        </form>
      )}
      {!sessions.length && (
        <p className="small-print">No tracked sessions are available yet.</p>
      )}
    </div>
  );
}

function DriverSessionRow({ session }: { session: DriverSession }) {
  const [state, action, pending] = useActionState(
    revokeDriverSession,
    initialState,
  );
  return (
    <article>
      <div>
        <strong>{friendlyDevice(session.device_info)}</strong>
        <span>
          {session.is_current
            ? "This device"
            : `Last active ${new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.last_seen_at))}`}
        </span>
      </div>
      {session.is_current ? (
        <span className="driver-current-session">Current</span>
      ) : (
        <form action={action}>
          <input type="hidden" name="sessionId" value={session.id} />
          <button className="text-danger" disabled={pending}>
            {pending ? "Signing out…" : "Sign out"}
          </button>
          <Message state={state} />
        </form>
      )}
    </article>
  );
}

function friendlyDevice(value: string) {
  if (/iphone|ipad/i.test(value)) return "Apple mobile device";
  if (/android/i.test(value)) return "Android mobile device";
  if (/edg/i.test(value)) return "Microsoft Edge browser";
  if (/chrome/i.test(value)) return "Chrome browser";
  if (/firefox/i.test(value)) return "Firefox browser";
  if (/safari/i.test(value)) return "Safari browser";
  return "StreetPlate session";
}
