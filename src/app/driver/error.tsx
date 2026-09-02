"use client";

import { useEffect } from "react";

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="driver-page">
      <div className="driver-state-card">
        <div>
          <p className="eyebrow">Driver portal</p>
          <h1>Something interrupted the dashboard</h1>
          <p>Your account and delivery data were not changed.</p>
          <button className="button button-dark" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
