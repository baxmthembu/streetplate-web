"use client";

import {
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import {
  sendDriverMessage,
  type DriverActionState,
} from "@/app/driver/actions";
import { createClient } from "@/lib/supabase/client";
import type { DriverMessage } from "@/lib/driver-types";

const initialState: DriverActionState = { message: "" };
const chatSocketBase = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "");

export function mergeDriverMessages(
  current: DriverMessage[],
  refreshed: DriverMessage[],
) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of refreshed) byId.set(message.id, message);
  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.created_at).getTime() -
      new Date(right.created_at).getTime(),
  );
}

export function DriverChat({
  orderId,
  initialMessages,
}: {
  orderId: string;
  initialMessages: DriverMessage[];
}) {
  const router = useRouter();
  const [liveMessages, setLiveMessages] = useState<DriverMessage[]>([]);
  const messages = useMemo(
    () => mergeDriverMessages(initialMessages, liveMessages),
    [initialMessages, liveMessages],
  );
  const [connection, setConnection] = useState(
    chatSocketBase ? "Connecting" : "Secure refresh",
  );
  const [content, setContent] = useState("");
  const [callState, setCallState] = useState<
    "calling" | "incoming" | "connected" | "declined" | null
  >(null);
  const [callerName, setCallerName] = useState("Customer");
  const [myName, setMyName] = useState("Driver");
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const callTimerRef = useRef<number | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [state, action, pending] = useActionState(
    async (previousState: DriverActionState, formData: FormData) => {
      const nextState = await sendDriverMessage(previousState, formData);
      if (nextState.success) {
        setContent("");
        router.refresh();
      }
      return nextState;
    },
    initialState,
  );
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages],
  );

  const beginConnectedCall = useCallback(() => {
    setCallState("connected");
    setCallDuration(0);
    if (callTimerRef.current) window.clearInterval(callTimerRef.current);
    callTimerRef.current = window.setInterval(
      () => setCallDuration((duration) => duration + 1),
      1000,
    );
  }, []);

  const endCallLocally = useCallback(() => {
    if (callTimerRef.current) window.clearInterval(callTimerRef.current);
    callTimerRef.current = null;
    setCallState(null);
    setCallDuration(0);
    setMuted(false);
  }, []);

  useEffect(() => {
    if (!chatSocketBase) return;
    let socket: ReturnType<typeof io> | undefined;
    let cancelled = false;
    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (cancelled || !data.session?.access_token)
          return setConnection("Secure refresh");
        setMyName(
          data.session.user.user_metadata?.name ??
            data.session.user.email?.split("@")[0] ??
            "Driver",
        );
        socket = io(`${chatSocketBase}/chat`, {
          transports: ["websocket"],
          auth: { token: data.session.access_token },
        });
        socketRef.current = socket;
        socket.on("connect", () => {
          setConnection("Live chat");
          socket?.emit("join_chat", { orderId });
        });
        socket.on("connect_error", () => setConnection("Secure refresh"));
        socket.on("new_message", (message: DriverMessage) => {
          if (message.order_id === orderId)
            setLiveMessages((current) =>
              current.some(({ id }) => id === message.id)
                ? current
                : [...current, message],
            );
        });
        socket.on(
          "incoming_call",
          ({ callerName: name }: { callerName?: string }) => {
            setCallerName(name || "Customer");
            setCallState("incoming");
          },
        );
        socket.on("call_accepted", () => beginConnectedCall());
        socket.on("call_declined", () => {
          setCallState("declined");
          window.setTimeout(() => setCallState(null), 2000);
        });
        socket.on("call_ended", endCallLocally);
      });
    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      if (callTimerRef.current) window.clearInterval(callTimerRef.current);
    };
  }, [beginConnectedCall, endCallLocally, orderId]);

  function startCall() {
    setCallState("calling");
    socketRef.current?.emit("call_request", {
      orderId,
      callerName: myName,
      callerRole: "driver",
    });
  }

  function acceptCall() {
    beginConnectedCall();
    socketRef.current?.emit("call_accepted", { orderId });
  }

  function declineCall() {
    setCallState(null);
    socketRef.current?.emit("call_declined", { orderId });
  }

  function endCall() {
    socketRef.current?.emit("call_ended", { orderId });
    endCallLocally();
  }

  const callTime = `${String(Math.floor(callDuration / 60)).padStart(2, "0")}:${String(callDuration % 60).padStart(2, "0")}`;

  return (
    <div className="driver-chat">
      <div className="driver-chat-status">
        <div>
          <span />
          {connection}
        </div>
        <button
          type="button"
          onClick={startCall}
          disabled={connection !== "Live chat" || callState !== null}
        >
          <Phone size={17} aria-hidden="true" />
          Call customer
        </button>
      </div>
      <div className="driver-chat-thread" aria-live="polite">
        {messages.length === 0 ? (
          <div className="driver-empty">
            <h2>No messages yet</h2>
            <p>Send the customer a clear update about their delivery.</p>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={message.sender_role === "driver" ? "mine" : "theirs"}
            >
              <strong>
                {message.sender_role === "driver"
                  ? "You"
                  : (message.users?.name ?? "Customer")}
              </strong>
              <p>{message.content}</p>
              <time dateTime={message.created_at}>
                {new Intl.DateTimeFormat("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(message.created_at))}
              </time>
            </article>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form action={action} className="driver-chat-composer">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="sr-only" htmlFor="driver-message">
          Message customer
        </label>
        <input
          id="driver-message"
          name="content"
          maxLength={1000}
          placeholder="Message the customer…"
          autoComplete="off"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          aria-invalid={state.field === "content"}
          required
        />
        <button type="submit" aria-label="Send message" disabled={pending}>
          <Send size={20} aria-hidden="true" />
        </button>
      </form>
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      {callState && (
        <div
          className="driver-call-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Order call"
        >
          <section className="driver-call-card">
            <span className="driver-call-avatar">
              {(callState === "incoming" ? callerName : "Customer")
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <h2>{callState === "incoming" ? callerName : "Customer"}</h2>
            <p>
              {callState === "incoming"
                ? "Incoming order call…"
                : callState === "calling"
                  ? "Calling customer…"
                  : callState === "declined"
                    ? "Call declined"
                    : callTime}
            </p>
            <div className="driver-call-actions">
              {callState === "incoming" ? (
                <>
                  <button className="decline" onClick={declineCall}>
                    <PhoneOff size={22} />
                    Decline
                  </button>
                  <button className="accept" onClick={acceptCall}>
                    <PhoneCall size={22} />
                    Accept
                  </button>
                </>
              ) : callState === "connected" ? (
                <>
                  <button onClick={() => setMuted((value) => !value)}>
                    {muted ? <MicOff size={22} /> : <Mic size={22} />}
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <button className="decline" onClick={endCall}>
                    <PhoneOff size={22} />
                    End
                  </button>
                  <button onClick={() => setSpeaker((value) => !value)}>
                    {speaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                    {speaker ? "Speaker" : "Quiet"}
                  </button>
                </>
              ) : (
                <button className="decline" onClick={endCall}>
                  <PhoneOff size={22} />
                  Cancel
                </button>
              )}
            </div>
            <small>
              Order calls are available while both people are connected to
              StreetPlate live chat.
            </small>
          </section>
        </div>
      )}
    </div>
  );
}
