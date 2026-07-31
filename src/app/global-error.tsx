"use client";

import "./globals.css";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en-ZA">
      <body>
        <main className="shell content-page content-narrow error-state">
          <h1>StreetPlate is temporarily unavailable</h1>
          <p>Please retry. No order or payment should be submitted twice.</p>
          <button className="button button-dark" onClick={unstable_retry}>
            Retry safely
          </button>
        </main>
      </body>
    </html>
  );
}
