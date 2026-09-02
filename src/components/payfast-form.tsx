"use client";

export function PayFastForm({
  paymentUrl,
  paymentData,
}: {
  paymentUrl: string;
  paymentData: Record<string, string | number>;
}) {
  return (
    <form
      action={paymentUrl}
      method="post"
      target="streetplate-payment"
      className="payment-card"
    >
      {Object.entries(paymentData).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      <button className="button button-orange button-block" type="submit">
        Open secure PayFast payment
      </button>
      <p>
        Payment opens in a separate tab. Keep this StreetPlate page open, then
        return here to track confirmation.
      </p>
    </form>
  );
}
