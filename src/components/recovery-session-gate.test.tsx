import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, setSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession, setSession } }),
}));

import {
  parseRecoverySessionHash,
  RecoverySessionGate,
} from "./recovery-session-gate";

const accessToken = `access-${"a".repeat(40)}`;
const refreshToken = `refresh-${"b".repeat(20)}`;

describe("RecoverySessionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/reset-password");
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    setSession.mockResolvedValue({ data: { session: {} }, error: null });
  });

  it("accepts one bounded recovery token pair", () => {
    expect(
      parseRecoverySessionHash(
        `#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
      ),
    ).toEqual({ kind: "session", accessToken, refreshToken });
  });

  it("rejects incomplete or duplicated recovery fragments", () => {
    expect(
      parseRecoverySessionHash(`#access_token=${accessToken}&type=recovery`),
    ).toEqual({ kind: "invalid" });
    expect(
      parseRecoverySessionHash(
        `#access_token=${accessToken}&access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
      ),
    ).toEqual({ kind: "invalid" });
  });

  it("establishes the recovery session and removes tokens from the URL", async () => {
    window.history.replaceState(
      null,
      "",
      `/reset-password#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
    );

    render(
      <RecoverySessionGate fallback={<p>Request form ready</p>}>
        <p>Reset form ready</p>
      </RecoverySessionGate>,
    );

    expect(
      screen.getByText("Verifying your secure reset link…"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Reset form ready")).toBeInTheDocument();
    expect(setSession).toHaveBeenCalledWith({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    expect(window.location.hash).toBe("");
  });

  it("allows an existing recovery session without a fragment", async () => {
    getSession.mockResolvedValue({ data: { session: {} }, error: null });

    render(
      <RecoverySessionGate fallback={<p>Request form ready</p>}>
        <p>Reset form ready</p>
      </RecoverySessionGate>,
    );

    expect(await screen.findByText("Reset form ready")).toBeInTheDocument();
    expect(setSession).not.toHaveBeenCalled();
  });

  it("shows a safe error when the session cannot be established", async () => {
    setSession.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid"),
    });
    window.history.replaceState(
      null,
      "",
      `/reset-password#access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`,
    );

    render(
      <RecoverySessionGate fallback={<p>Request form ready</p>}>
        <p>Reset form ready</p>
      </RecoverySessionGate>,
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This reset link is invalid or has expired.",
      ),
    );
    expect(screen.queryByText("Reset form ready")).not.toBeInTheDocument();
    expect(screen.getByText("Request form ready")).toBeInTheDocument();
    expect(window.location.hash).toBe("");
  });
});
