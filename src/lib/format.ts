export function formatRand(value: number): string {
  // Built manually rather than via Intl.NumberFormat("en-ZA", ...): Node's
  // ICU data and browsers' ICU data disagree on en-ZA's decimal separator
  // (comma vs period), which made this mismatch between server-rendered and
  // client-rendered output on every page load. toFixed is locale-independent
  // and behaves identically in Node and every browser engine.
  const sign = value < 0 ? "-" : "";
  const [wholePart, decimalPart] = Math.abs(value).toFixed(2).split(".");
  const groupedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R ${groupedWholePart},${decimalPart}`;
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
