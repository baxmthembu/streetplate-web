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

const metricKeys = cardKeys.slice(0, 4);
const rowKeys = cardKeys.slice(0, 5);
const shortcutKeys = cardKeys.slice(0, 5);

function PageHeadingBlockSkeleton({
  withBadge = false,
}: {
  withBadge?: boolean;
}) {
  return (
    <div className="skeleton-results-heading">
      <div className="skeleton-copy-stack skeleton-page-heading">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-title-small" />
        <div className="skeleton skeleton-line skeleton-line-medium" />
      </div>
      {withBadge && <div className="skeleton skeleton-button" />}
    </div>
  );
}

function MetricGridSkeleton() {
  return (
    <div className="skeleton-metric-grid">
      {metricKeys.map((key) => (
        <div className="skeleton-metric-card" key={key}>
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-line skeleton-line-short" />
          <div className="skeleton skeleton-line skeleton-line-medium" />
        </div>
      ))}
    </div>
  );
}

function RowListSkeleton({ rows = rowKeys }: { rows?: readonly string[] }) {
  return (
    <div className="skeleton-row-list">
      {rows.map((key) => (
        <div className="skeleton-row" key={key}>
          <div className="skeleton skeleton-icon" />
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-line skeleton-line-medium" />
            <div className="skeleton skeleton-line skeleton-line-short" />
          </div>
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}

function ProgressStepsSkeleton({ steps }: { steps: readonly string[] }) {
  return (
    <div className="skeleton-progress-steps">
      {steps.map((key) => (
        <div className="skeleton-progress-step" key={key}>
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}

function DashboardPanelSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <article className={`skeleton-panel ${wide ? "skeleton-panel-wide" : ""}`}>
      <div className="skeleton skeleton-line skeleton-line-medium" />
      {rowKeys.slice(0, 3).map((key) => (
        <div className="skeleton skeleton-field" key={key} />
      ))}
    </article>
  );
}

export function RecruitmentPageSkeleton() {
  return (
    <LoadingStatus label="Loading opportunity page">
      <section className="skeleton-hero">
        <div className="shell skeleton-two-col">
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-line skeleton-line-eyebrow" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-copy" />
            <div className="skeleton skeleton-button" />
          </div>
          <div className="skeleton skeleton-hero-art" />
        </div>
      </section>
      <section className="shell content-page">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton-card-grid skeleton-card-grid-two">
          {cardKeys.slice(0, 4).map((key) => (
            <CardSkeleton compact key={key} />
          ))}
        </div>
      </section>
      <section className="shell content-page">
        <div className="skeleton-menu-layout">
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-line skeleton-line-eyebrow" />
            <div className="skeleton skeleton-section-title" />
            {rowKeys.slice(0, 3).map((key) => (
              <div className="skeleton skeleton-line" key={key} />
            ))}
          </div>
          <div className="skeleton skeleton-side-panel skeleton-form-panel" />
        </div>
      </section>
    </LoadingStatus>
  );
}

export function HomePageSkeleton() {
  return (
    <LoadingStatus label="Loading StreetPlate">
      <section className="skeleton-hero">
        <div className="shell skeleton-two-col">
          <div className="skeleton-copy-stack">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-copy" />
            <div className="skeleton skeleton-search-bar" />
          </div>
          <div className="skeleton skeleton-hero-art" />
        </div>
      </section>
      <section className="shell content-page">
        <div className="skeleton skeleton-section-title" />
        <div className="skeleton-card-grid skeleton-card-grid-three">
          {cardKeys.map((key) => (
            <CardSkeleton compact key={key} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function AuthMosaicPageSkeleton() {
  return (
    <LoadingStatus label="Loading account access">
      <section className="shell skeleton-two-col">
        <div className="skeleton-panel skeleton-form-panel">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title-small" />
          <div className="skeleton skeleton-copy" />
          {rowKeys.slice(0, 3).map((key) => (
            <div className="skeleton skeleton-field" key={key} />
          ))}
          <div className="skeleton skeleton-button-wide" />
        </div>
        <div className="skeleton skeleton-hero-art" />
      </section>
    </LoadingStatus>
  );
}

export function AuthNotePageSkeleton() {
  return (
    <LoadingStatus label="Loading account page">
      <section className="shell skeleton-two-col">
        <div className="skeleton-panel skeleton-form-panel">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title-small" />
          <div className="skeleton skeleton-copy" />
          {rowKeys.slice(0, 3).map((key) => (
            <div className="skeleton skeleton-field" key={key} />
          ))}
          <div className="skeleton skeleton-button-wide" />
        </div>
        <div className="skeleton-panel">
          <div className="skeleton skeleton-line skeleton-line-medium" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      </section>
    </LoadingStatus>
  );
}

export function NarrowContentPageSkeleton() {
  return (
    <LoadingStatus label="Loading content">
      <section className="shell content-page content-narrow skeleton-copy-stack">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-title-small" />
        <div className="skeleton skeleton-copy" />
        <div className="skeleton skeleton-field-tall" />
        <div className="skeleton skeleton-button" />
      </section>
    </LoadingStatus>
  );
}

export function LegalPageSkeleton() {
  return (
    <LoadingStatus label="Loading legal document">
      <section className="skeleton-hero skeleton-hero-compact">
        <div className="shell skeleton-copy-stack">
          <div className="skeleton skeleton-line skeleton-line-eyebrow" />
          <div className="skeleton skeleton-title-small" />
          <div className="skeleton skeleton-copy" />
        </div>
      </section>
      <section className="shell content-page content-narrow skeleton-copy-stack">
        {rowKeys.map((key) => (
          <div key={key}>
            <div className="skeleton skeleton-line skeleton-line-medium" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </section>
    </LoadingStatus>
  );
}

export function OrderTrackingPageSkeleton() {
  return (
    <LoadingStatus label="Loading your order">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton withBadge />
        <ProgressStepsSkeleton steps={rowKeys.slice(0, 4)} />
        <div className="skeleton-account-grid">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>
      </section>
    </LoadingStatus>
  );
}

export function VendorDashboardSkeleton() {
  return (
    <LoadingStatus label="Loading vendor dashboard">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton withBadge />
        <MetricGridSkeleton />
        <div className="skeleton-account-grid">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>
      </section>
    </LoadingStatus>
  );
}

export function VendorMetricsPageSkeleton() {
  return (
    <LoadingStatus label="Loading vendor data">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton />
        <MetricGridSkeleton />
        <DashboardPanelSkeleton wide />
      </section>
    </LoadingStatus>
  );
}

export function VendorTwoPanelPageSkeleton() {
  return (
    <LoadingStatus label="Loading vendor details">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton withBadge />
        <div className="skeleton-account-grid">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>
      </section>
    </LoadingStatus>
  );
}

export function VendorListPageSkeleton() {
  return (
    <LoadingStatus label="Loading vendor orders">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton />
        <RowListSkeleton />
      </section>
    </LoadingStatus>
  );
}

export function VendorMenuGridPageSkeleton() {
  return (
    <LoadingStatus label="Loading your menu">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton />
        <div className="skeleton skeleton-field-tall" />
        <div className="skeleton-card-grid skeleton-card-grid-three">
          {cardKeys.map((key) => (
            <CardSkeleton key={key} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function VendorReviewsPageSkeleton() {
  return (
    <LoadingStatus label="Loading vendor reviews">
      <section className="shell content-page">
        <PageHeadingBlockSkeleton withBadge />
        <div className="skeleton-card-grid skeleton-card-grid-two">
          {cardKeys.slice(0, 4).map((key) => (
            <DashboardPanelSkeleton key={key} />
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}

export function DriverMetricsPageSkeleton() {
  return (
    <LoadingStatus label="Loading driver earnings">
      <div className="skeleton-copy-stack skeleton-page-heading">
        <div className="skeleton skeleton-line skeleton-line-eyebrow" />
        <div className="skeleton skeleton-title-small" />
        <div className="skeleton skeleton-line skeleton-line-medium" />
      </div>
      <div className="skeleton-panel">
        <div className="skeleton skeleton-line skeleton-line-short" />
        <div className="skeleton skeleton-title-small" />
      </div>
      <MetricGridSkeleton />
      <DashboardPanelSkeleton wide />
    </LoadingStatus>
  );
}

export function DriverHistoryPageSkeleton() {
  return (
    <LoadingStatus label="Loading delivery history">
      <PageHeadingBlockSkeleton withBadge />
      <div className="skeleton-metric-grid">
        {metricKeys.slice(0, 2).map((key) => (
          <div className="skeleton-metric-card" key={key}>
            <div className="skeleton skeleton-line skeleton-line-short" />
            <div className="skeleton skeleton-title-small" />
          </div>
        ))}
      </div>
      <div className="skeleton-card-grid skeleton-card-grid-two">
        {cardKeys.slice(0, 4).map((key) => (
          <DashboardPanelSkeleton key={key} />
        ))}
      </div>
    </LoadingStatus>
  );
}

export function DriverProfilePageSkeleton() {
  return (
    <LoadingStatus label="Loading driver profile">
      <PageHeadingBlockSkeleton />
      <div className="skeleton-vendor-heading">
        <div className="skeleton skeleton-avatar" />
        <div className="skeleton-copy-stack">
          <div className="skeleton skeleton-line skeleton-line-medium" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      </div>
      <MetricGridSkeleton />
      <div className="skeleton-metric-grid">
        {shortcutKeys.map((key) => (
          <div className="skeleton-metric-card" key={key}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-line skeleton-line-short" />
          </div>
        ))}
      </div>
      <div className="skeleton-account-grid">
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton />
      </div>
    </LoadingStatus>
  );
}

export function DriverDeliveryPageSkeleton() {
  return (
    <LoadingStatus label="Loading delivery">
      <PageHeadingBlockSkeleton withBadge />
      <ProgressStepsSkeleton steps={rowKeys.slice(0, 4)} />
      <div className="skeleton-account-grid">
        <DashboardPanelSkeleton />
        <DashboardPanelSkeleton />
      </div>
    </LoadingStatus>
  );
}

export function DriverChatPageSkeleton() {
  return (
    <LoadingStatus label="Loading order chat">
      <PageHeadingBlockSkeleton />
      <div className="skeleton-copy-stack">
        {rowKeys.map((key, index) => (
          <div
            className="skeleton skeleton-line"
            key={key}
            style={{
              justifySelf: index % 2 === 0 ? "start" : "end",
              width: "48%",
            }}
          />
        ))}
      </div>
    </LoadingStatus>
  );
}
