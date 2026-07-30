export function formatRand(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMinutes(minimum: number, maximum: number): string {
  return `${minimum}–${maximum} min`;
}

export function calculateCartTotal(
  subtotal: number,
  deliveryFee: number,
  serviceFee: number,
  discount = 0,
): number {
  return Math.max(0, subtotal + deliveryFee + serviceFee - discount);
}
