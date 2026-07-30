import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="StreetPlate home">
      <span className="brand-mark" aria-hidden="true">
        SP
      </span>
      <span>StreetPlate</span>
    </Link>
  );
}
