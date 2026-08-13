import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export function DriverDataState({ error }: { error: unknown }) {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number(error.status)
      : undefined;
  const forbidden = status === 403;
  const signedOut = status === 401;
  const missingEndpoint = status === 404;
  const serverFailure = status != null && status >= 500 && status < 600;
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  const configured = message.toLowerCase().includes("not configured");
  const missingDatabaseResource =
    message.toLowerCase().includes("schema cache") ||
    message.toLowerCase().includes("could not find the table");

  const title = forbidden
    ? "This account is not a driver account"
    : signedOut
      ? "Your session has ended"
      : configured
        ? "The driver API is not configured"
        : missingEndpoint
          ? "This driver feature is missing from the live API"
          : serverFailure
            ? "Railway is online, but driver data could not be loaded"
            : "The driver service could not be reached";

  const description = forbidden
    ? "Sign in with an approved StreetPlate driver account to use this workspace."
    : signedOut
      ? "Sign in again to continue."
      : configured
        ? "Set STREETPLATE_API_URL to the active Railway API address, then restart the website."
        : missingEndpoint
          ? "The active Railway deployment does not include the driver endpoint required by this page."
          : serverFailure
            ? missingDatabaseResource
              ? "The shared database is missing information required by this driver feature. Other available driver tools are unaffected."
              : message ||
                "The API is healthy, but it could not read the driver data. Check the Railway service logs and database configuration."
            : "Check the website API address and Railway deployment, then try again.";
  return (
    <div className="driver-state-card" role="alert">
      <span>
        <AlertTriangle size={24} aria-hidden="true" />
      </span>
      <div>
        <p className="eyebrow">Driver portal unavailable</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="driver-state-actions">
          <Link
            className="button button-dark"
            href={signedOut || forbidden ? "/sign-in?next=/driver" : "/driver"}
          >
            {signedOut || forbidden ? (
              <ArrowLeft size={18} aria-hidden="true" />
            ) : (
              <RefreshCw size={18} aria-hidden="true" />
            )}
            {signedOut || forbidden ? "Sign in" : "Try again"}
          </Link>
          {!signedOut && !forbidden && (
            <Link className="button button-light" href="/">
              Website home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
