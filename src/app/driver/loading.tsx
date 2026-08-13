export default function DriverLoading() {
  return (
    <div
      className="driver-page"
      aria-busy="true"
      aria-label="Loading driver dashboard"
    >
      <div className="skeleton skeleton-line skeleton-line-eyebrow" />
      <div className="skeleton skeleton-title-small" />
      <div className="driver-dashboard-skeleton">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton driver-skeleton-panel" />
    </div>
  );
}
