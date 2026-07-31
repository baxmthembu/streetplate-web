import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell content-page content-narrow error-state">
      <p className="eyebrow">404</p>
      <h1>That plate is not on the menu</h1>
      <p>The page may have moved, or the vendor may no longer be available.</p>
      <Link className="button button-dark" href="/discover">
        Find local food
      </Link>
    </section>
  );
}
