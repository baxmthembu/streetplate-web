"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() =>
      setVisible(
        window.localStorage.getItem("streetplate-cookie-choice") === null,
      ),
    );
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  function choose(value: "essential" | "accepted") {
    window.localStorage.setItem("streetplate-cookie-choice", value);
    setVisible(false);
  }
  return (
    <aside className="cookie-consent" aria-label="Cookie choices">
      <div>
        <strong>Your privacy choices</strong>
        <p>
          StreetPlate uses essential authentication and cart storage. Optional
          analytics are disabled.{" "}
          <Link href="/legal/cookies">Cookie policy</Link>
        </p>
      </div>
      <div>
        <button
          className="button button-light"
          onClick={() => choose("essential")}
        >
          Essential only
        </button>
        <button
          className="button button-dark"
          onClick={() => choose("accepted")}
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
