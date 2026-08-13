const cardKeys = ["one", "two", "three", "four", "five", "six"];
const panelKeys = ["profile", "addresses", "orders", "favourites"];

function LoadingStatus({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="skeleton-screen" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article
      className={`skeleton-card ${compact ? "skeleton-card-compact" : ""}`}
    >
      <div className="skeleton skeleton-card-media" />
      <div className="skeleton-card-copy">
        <div className="skeleton skeleton-line skeleton-line-medium" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-short" />
      </div>
    </article>
  );
}

function CheckoutSkeletonContent() {
  return (
    <div className="skeleton-checkout-grid">
      <section className="skeleton-panel skeleton-form-panel">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton skeleton-field" />
        <div className="skeleton skeleton-field" />
        <div className="skeleton skeleton-field skeleton-field-tall" />
        <div className="skeleton skeleton-button skeleton-button-wide" />
      </section>
      <aside className="skeleton-panel skeleton-summary-panel">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-button skeleton-button-wide" />
      </aside>
    </div>
  );
}

function CartSkeletonContent() {
  return (
    <div className="skeleton-cart-grid">
      <section className="skeleton-panel skeleton-cart-items">
        <div className="skeleton skeleton-line skeleton-line-medium" />
        {["first-item", "second-item"].map((key) => (
          <div className="skeleton-cart-line" key={key}>
            <div className="skeleton skeleton-cart-image" />
            <div className="skeleton-copy-stack">
              <div className="skeleton skeleton-line skeleton-line-medium" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </div>
        ))}
      </section>
      <aside className="skeleton-panel skeleton-summary-panel">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-button skeleton-button-wide" />
      </aside>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <LoadingStatus label="Loading page">
      <section className="skeleton-hero">
        <div className="shell skeleton-copy-stack">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-copy" />
        </div>
      </section>
      <section className="shell content-page">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton-card-grid skeleton-card-grid-three">
          {cardKeys.slice(0, 3).map((key) => (
            <CardSkeleton key={key} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function DiscoverPageSkeleton() {
  return (
    <LoadingStatus label="Loading nearby food">
      <section className="skeleton-hero">
        <div className="shell skeleton-copy-stack">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-copy" />
          <div className="skeleton skeleton-search-bar" />
        </div>
      </section>
      <section className="shell content-page">
        <div className="skeleton-results-heading">
          <div className="skeleton skeleton-section-title" />
          <div className="skeleton skeleton-sort" />
        </div>
        <div className="skeleton-card-grid skeleton-card-grid-three">
          {cardKeys.map((key) => (
            <CardSkeleton key={key} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function VendorPageSkeleton() {
  return (
    <LoadingStatus label="Loading vendor menu">
      <section className="skeleton-vendor-hero">
        <div className="shell skeleton-vendor-heading">
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-line skeleton-line-eyebrow" />
            <div className="skeleton skeleton-title skeleton-title-small" />
            <div className="skeleton skeleton-copy" />
            <div className="skeleton skeleton-facts" />
          </div>
        </div>
      </section>
      <section className="shell skeleton-menu-layout">
        <div>
          <div className="skeleton-results-heading">
            <div className="skeleton skeleton-section-title" />
            <div className="skeleton skeleton-sort" />
          </div>
          <div className="skeleton-card-grid skeleton-card-grid-two">
            {cardKeys.slice(0, 4).map((key) => (
              <CardSkeleton compact key={key} />
            ))}
          </div>
        </div>
        <div className="skeleton skeleton-side-panel" />
      </section>
    </LoadingStatus>
  );
}

export function AccountPageSkeleton() {
  return (
    <LoadingStatus label="Loading your account">
      <section className="shell content-page account-page">
        <div className="skeleton-account-heading">
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-line skeleton-line-eyebrow" />
            <div className="skeleton skeleton-title skeleton-title-small" />
            <div className="skeleton skeleton-line skeleton-line-medium" />
          </div>
          <div className="skeleton skeleton-button" />
        </div>
        <div className="skeleton-account-grid">
          {panelKeys.map((key, index) => (
            <article
              className={`skeleton-panel ${index === 2 ? "skeleton-panel-wide" : ""}`}
              key={key}
            >
              <div className="skeleton skeleton-line skeleton-line-medium" />
              <div className="skeleton skeleton-field" />
              <div className="skeleton skeleton-field" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </article>
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function CheckoutSkeleton() {
  return (
    <LoadingStatus label="Loading checkout">
      <CheckoutSkeletonContent />
    </LoadingStatus>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <section className="shell content-page">
      <LoadingStatus label="Loading checkout">
        <div className="skeleton-copy-stack skeleton-page-heading">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title skeleton-title-small" />
        </div>
        <CheckoutSkeletonContent />
      </LoadingStatus>
    </section>
  );
}

export function CartSkeleton() {
  return (
    <LoadingStatus label="Loading your saved cart">
      <CartSkeletonContent />
    </LoadingStatus>
  );
}

export function CartPageSkeleton() {
  return (
    <LoadingStatus label="Loading your saved cart">
      <section className="skeleton-hero skeleton-hero-compact">
        <div className="shell skeleton-copy-stack">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title skeleton-title-small" />
        </div>
      </section>
      <section className="shell content-page">
        <CartSkeletonContent />
      </section>
    </LoadingStatus>
  );
}
