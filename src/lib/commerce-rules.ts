export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type DeliveryLocation = {
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadius?: number | null;
};

/**
 * A vendor missing location or radius data can't be evaluated, so it stays
 * visible rather than being hidden by a data gap that isn't the customer's
 * concern. Checkout (src/app/checkout/actions.ts) is the actual enforcement
 * point for order placement; this only affects what discovery shows.
 */
export function isWithinDeliveryRadius(
  vendor: DeliveryLocation,
  customerLatitude: number,
  customerLongitude: number,
) {
  if (
    vendor.latitude == null ||
    vendor.longitude == null ||
    vendor.deliveryRadius == null
  ) {
    return true;
  }

  return (
    distanceKm(
      customerLatitude,
      customerLongitude,
      vendor.latitude,
      vendor.longitude,
    ) <= vendor.deliveryRadius
  );
}
