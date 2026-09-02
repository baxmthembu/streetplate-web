"use client";

import {
  CircleCheck,
  Gift,
  LocateFixed,
  MapPin,
  Radio,
  Timer,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { io, type Socket } from "socket.io-client";

import {
  respondToDriverOffer,
  type DriverActionState,
  updateDriverAvailability,
} from "@/app/driver/actions";
import { createClient } from "@/lib/supabase/client";
import type { DriverOffer, DriverOrder } from "@/lib/driver-types";
import { formatRand } from "@/lib/format";

const initialState: DriverActionState = { message: "" };
const driverSocketBase = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "");

export function driverSocketOptions(
  token: string,
): NonNullable<Parameters<typeof io>[1]> {
  return {
    transports: ["websocket", "polling"],
    tryAllTransports: true,
    reconnection: true,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 15_000,
    auth: { token },
  };
}

type DriverBonus = {
  amount?: number | string;
  bonus_type?: string;
  reason?: string;
};

const bonusLabels: Record<string, string> = {
  peak_hour: "Peak-hour bonus",
  streak: "Delivery streak bonus",
  weekend: "Weekend bonus",
};

function showDriverNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  new Notification(title, {
    body,
    icon: "/brand/streetplate-logo-compact.png",
  });
}

function secondsRemaining(expiresAt: string) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

export function DriverLivePanel({
  initialOnline,
  initialOrder,
}: {
  initialOnline: boolean;
  initialOrder: DriverOrder | null;
}) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [online, setOnline] = useState(initialOnline);
  const [connection, setConnection] = useState<
    "connecting" | "live" | "offline"
  >(driverSocketBase ? "connecting" : "offline");
  const [offer, setOffer] = useState<DriverOffer | null>(null);
  const [bonus, setBonus] = useState<DriverBonus | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [geoMessage, setGeoMessage] = useState("");
  const [availabilityFeedback, setAvailabilityFeedback] =
    useState<DriverActionState>(initialState);
  const availabilityAttemptRef = useRef<{
    previous: boolean;
    requested: boolean;
  } | null>(null);
  const [availabilityState, availabilityAction, availabilityPending] =
    useActionState(updateDriverAvailability, initialState);
  const [offerState, offerAction, offerPending] = useActionState(
    respondToDriverOffer,
    initialState,
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!driverSocketBase) return;
    let cancelled = false;
    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (cancelled || !data.session?.access_token) {
          setConnection("offline");
          return;
        }
        const socket = io(
          `${driverSocketBase}/drivers`,
          driverSocketOptions(data.session.access_token),
        );
        socketRef.current = socket;
        socket.on("connect", () => {
          setConnection("live");
          socket.emit("join");
        });
        socket.on("connect_error", () => setConnection("offline"));
        socket.on("disconnect", () => setConnection("offline"));
        socket.on(
          "join_ack",
          (event: {
            activeOrder?: DriverOrder | null;
            pendingOffer?: DriverOffer | null;
          }) => {
            setOffer(event.pendingOffer ?? null);
            if (
              event.activeOrder?.id &&
              event.activeOrder.id !== initialOrder?.id
            )
              router.refresh();
          },
        );
        socket.on("delivery_request", (nextOffer: DriverOffer) => {
          setOffer(nextOffer);
          showDriverNotification(
            "New StreetPlate delivery",
            `${nextOffer.vendorName} · ${formatRand(Number(nextOffer.payoutAmount ?? 0))}`,
          );
        });
        socket.on("offer_expired", ({ offerId }: { offerId?: string }) => {
          setOffer((current) =>
            current?.offerId === offerId ? null : current,
          );
        });
        for (const event of [
          "earnings_updated",
          "wallet_updated",
          "payout_processed",
        ]) {
          socket.on(event, () => router.refresh());
        }
        socket.on("bonus_earned", (nextBonus: DriverBonus) => {
          setBonus(nextBonus);
          showDriverNotification(
            bonusLabels[nextBonus.bonus_type ?? ""] ?? "Bonus earned",
            `${formatRand(Number(nextBonus.amount ?? 0))} was added to your earnings.`,
          );
          router.refresh();
        });
      });
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [initialOrder?.id, router]);

  useEffect(() => {
    const attempt = availabilityAttemptRef.current;
    if (!attempt || !availabilityState.message) return;

    if (availabilityState.success) {
      setOnline(attempt.requested);
    } else {
      setOnline(attempt.previous);
    }
    setAvailabilityFeedback(availabilityState);
    availabilityAttemptRef.current = null;
  }, [availabilityState]);

  useEffect(() => {
    if (!offer) return;
    const update = () => {
      const next = secondsRemaining(offer.expiresAt);
      setSeconds(next);
      if (next === 0) setOffer(null);
    };
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [offer]);

  useEffect(() => {
    if (!online || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        socketRef.current?.emit("location_update", {
          orderId: initialOrder?.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading,
          speed: coords.speed,
        });
      },
      () =>
        setGeoMessage(
          "Location updates are paused. Allow location access to stay dispatch-ready.",
        ),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [initialOrder?.id, online]);

  function changeAvailability(nextOnline: boolean) {
    setGeoMessage("");
    setAvailabilityFeedback(initialState);
    if (!nextOnline) {
      const data = new FormData();
      data.set("is_online", "false");
      availabilityAttemptRef.current = {
        previous: online,
        requested: false,
      };
      setOnline(false);
      startTransition(() => availabilityAction(data));
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    if (!navigator.geolocation) {
      setGeoMessage("This browser does not support location services.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const data = new FormData();
        data.set("is_online", "true");
        data.set("latitude", String(coords.latitude));
        data.set("longitude", String(coords.longitude));
        availabilityAttemptRef.current = {
          previous: online,
          requested: true,
        };
        setOnline(true);
        startTransition(() => availabilityAction(data));
      },
      () =>
        setGeoMessage(
          "Location permission is required before you can go online.",
        ),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  }

  return (
    <>
      <div className="driver-live-bar">
        <div>
          <span className={`driver-live-dot ${online ? "online" : ""}`} />
          <div>
            <strong>{online ? "You are online" : "You are offline"}</strong>
            <small>
              {online
                ? "Ready for nearby delivery offers"
                : "Go online when you are ready to drive"}
            </small>
          </div>
        </div>
        <span className={`driver-connection ${connection}`}>
          {connection === "live" ? (
            <Radio size={15} aria-hidden="true" />
          ) : (
            <WifiOff size={15} aria-hidden="true" />
          )}
          {connection === "live"
            ? "Live"
            : connection === "connecting"
              ? "Connecting"
              : "Secure refresh"}
        </span>
        <button
          className={`availability-switch ${online ? "online" : ""}`}
          onClick={() => changeAvailability(!online)}
          disabled={availabilityPending}
          aria-pressed={online}
        >
          <span />
          {availabilityPending
            ? "Updating…"
            : online
              ? "Go offline"
              : "Go online"}
        </button>
      </div>
      {(geoMessage || availabilityFeedback.message) && (
        <p
          className={`driver-inline-message ${availabilityFeedback.success ? "success" : ""}`}
          role="status"
        >
          {geoMessage || availabilityFeedback.message}
        </p>
      )}

      {bonus && (
        <div className="driver-bonus-toast" role="status">
          <Gift size={22} aria-hidden="true" />
          <div>
            <strong>
              {bonusLabels[bonus.bonus_type ?? ""] ?? "Bonus earned"}
            </strong>
            <span>
              {formatRand(Number(bonus.amount ?? 0))}
              {bonus.reason
                ? ` · ${bonus.reason}`
                : " was added to your earnings."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBonus(null)}
            aria-label="Dismiss bonus notification"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {offer && (
        <section className="driver-offer" aria-live="assertive">
          <div className="driver-offer-heading">
            <div>
              <p className="eyebrow">New delivery request</p>
              <h2>{offer.vendorName}</h2>
            </div>
            <span className={seconds <= 8 ? "urgent" : ""}>
              <Timer size={19} aria-hidden="true" />
              {seconds}s
            </span>
          </div>
          <div className="driver-route-points">
            <div>
              <span className="pickup">
                <LocateFixed size={17} aria-hidden="true" />
              </span>
              <div>
                <small>Pick up</small>
                <strong>{offer.pickupAddress}</strong>
              </div>
            </div>
            <div>
              <span className="dropoff">
                <MapPin size={17} aria-hidden="true" />
              </span>
              <div>
                <small>Deliver to</small>
                <strong>{offer.deliveryAddress}</strong>
              </div>
            </div>
          </div>
          <div className="driver-offer-metrics">
            <div>
              <strong>{Number(offer.distanceKm ?? 0).toFixed(1)} km</strong>
              <small>Estimated trip</small>
            </div>
            <div>
              <strong>{formatRand(Number(offer.payoutAmount ?? 0))}</strong>
              <small>Your payout</small>
            </div>
            <div>
              <strong>
                {offer.items?.reduce((sum, item) => sum + item.quantity, 0) ??
                  0}
              </strong>
              <small>Items</small>
            </div>
          </div>
          <form action={offerAction} className="driver-offer-actions">
            <input type="hidden" name="offerId" value={offer.offerId} />
            <button
              className="button button-light"
              name="response"
              value="reject"
              disabled={offerPending}
            >
              Decline
            </button>
            <button
              className="button button-orange"
              name="response"
              value="accept"
              disabled={offerPending}
            >
              <CircleCheck size={18} aria-hidden="true" />
              {offerPending ? "Responding…" : "Accept delivery"}
            </button>
          </form>
          {offerState.message && (
            <p
              className={`form-message ${offerState.success ? "form-success" : ""}`}
              role="status"
            >
              {offerState.message}
            </p>
          )}
        </section>
      )}

      {initialOrder && (
        <div className="driver-foreground-note">
          <LocateFixed size={18} aria-hidden="true" />
          <p>
            <strong>
              Foreground tracking is active while this dashboard is open.
            </strong>{" "}
            Keep the tab open during a delivery so the customer receives
            compatible location updates.
          </p>
          <Link href={`/driver/deliveries/${initialOrder.id}`}>
            Open delivery
          </Link>
        </div>
      )}
    </>
  );
}
