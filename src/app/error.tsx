"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("StreetPlate page error", error);
  }, [error]);

  return (
    <section className="shell content-page content-narrow error-state">
      <p className="eyebrow">Temporary interruption</p>
      <h1>StreetPlate could not load this page</h1>
      <p>Your cart and account are safe. Try the request again.</p>
      <button className="button button-dark" onClick={unstable_retry}>
        Try again
      </button>
    </section>
  );
}
