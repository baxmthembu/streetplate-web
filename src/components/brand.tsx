import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="StreetPlate home">
      <span className="brand-logo-crop" aria-hidden="true">
        <Image
          className="brand-logo-image"
          src="/brand/streetplate-logo-compact.png"
          alt=""
          width={74}
          height={74}
          sizes="74px"
          unoptimized
        />
      </span>
      <span>StreetPlate</span>
    </Link>
  );
}
