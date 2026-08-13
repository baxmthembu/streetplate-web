import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { DriverChat } from "@/components/driver-chat";
import { DriverDataState } from "@/components/driver-data-state";
import { getDriverMessages, getDriverOrder } from "@/lib/driver-api";

export default async function DriverChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let chatData: [
    Awaited<ReturnType<typeof getDriverMessages>>,
    Awaited<ReturnType<typeof getDriverOrder>>,
  ];
  try {
    chatData = await Promise.all([getDriverMessages(id), getDriverOrder(id)]);
  } catch (error) {
    return (
      <div className="driver-page">
        <DriverDataState error={error} />
      </div>
    );
  }
  const [{ messages }, { order }] = chatData;
  return (
    <div className="driver-page driver-chat-page">
      <Link className="driver-back-link" href={`/driver/deliveries/${id}`}>
        <ChevronLeft size={18} aria-hidden="true" />
        Back to delivery
      </Link>
      <header className="driver-page-heading">
        <div>
          <p className="eyebrow">Secure order chat</p>
          <h1>Message the customer</h1>
          <p>{order.delivery_address}</p>
        </div>
      </header>
      <DriverChat orderId={id} initialMessages={messages} />
    </div>
  );
}
