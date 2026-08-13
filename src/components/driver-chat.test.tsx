import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/driver/actions", () => ({
  sendDriverMessage: vi.fn(async () => ({ message: "" })),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  }),
}));
vi.mock("socket.io-client", () => ({ io: vi.fn() }));

import { DriverChat, mergeDriverMessages } from "./driver-chat";
import type { DriverMessage } from "@/lib/driver-types";

const firstMessage: DriverMessage = {
  id: "message-1",
  order_id: "6e411109-3c0f-4ac9-b94a-b1a11d886909",
  sender_id: "customer-1",
  sender_role: "customer",
  content: "Please call at the gate",
  created_at: "2026-08-13T08:00:00.000Z",
};

const secondMessage: DriverMessage = {
  id: "message-2",
  order_id: firstMessage.order_id,
  sender_id: "customer-1",
  sender_role: "customer",
  content: "I am outside now",
  created_at: "2026-08-13T08:01:00.000Z",
};

describe("DriverChat secure refresh", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("merges refreshed messages in chronological order without duplicates", () => {
    expect(
      mergeDriverMessages(
        [secondMessage, firstMessage],
        [firstMessage, secondMessage],
      ).map(({ id }) => id),
    ).toEqual(["message-1", "message-2"]);
  });

  it("shows newly refreshed messages while the socket is unavailable", async () => {
    const { rerender } = render(
      <DriverChat
        orderId={firstMessage.order_id}
        initialMessages={[firstMessage]}
      />,
    );

    rerender(
      <DriverChat
        orderId={firstMessage.order_id}
        initialMessages={[firstMessage, secondMessage]}
      />,
    );

    expect(await screen.findByText("I am outside now")).toBeInTheDocument();
    expect(screen.getAllByText("Please call at the gate")).toHaveLength(1);
  });
});
