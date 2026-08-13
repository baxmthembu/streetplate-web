"use client";

import { useActionState } from "react";

import type { AccountActionState } from "@/app/account/actions";

const initialState: AccountActionState = { message: "" };

type ProtectedMutationFormProps = {
  action: (
    state: AccountActionState,
    formData: FormData,
  ) => Promise<AccountActionState>;
  buttonClassName: string;
  buttonLabel: string;
  className?: string;
  fields: Record<string, string>;
};

export function ProtectedMutationForm({
  action,
  buttonClassName,
  buttonLabel,
  className,
  fields,
}: ProtectedMutationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <button className={buttonClassName} type="submit" disabled={pending}>
        {pending ? "Please wait…" : buttonLabel}
      </button>
    </form>
  );
}
