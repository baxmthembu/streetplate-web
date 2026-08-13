const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SOCKET_URL",
  "STREETPLATE_API_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET",
  "TURNSTILE_HOSTNAMES",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
];

const httpsVariables = required.filter(
  (name) =>
    ![
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET",
      "TURNSTILE_HOSTNAMES",
      "KV_REST_API_TOKEN",
    ].includes(name),
);
const missing = required.filter((name) => !process.env[name]?.trim());
const invalid = httpsVariables.filter((name) => {
  const value = process.env[name];
  if (!value) return false;
  try {
    return new URL(value).protocol !== "https:";
  } catch {
    return true;
  }
});
const productionTurnstileHostnames = (process.env.TURNSTILE_HOSTNAMES ?? "")
  .split(",")
  .map((hostname) => hostname.trim().toLowerCase())
  .filter(Boolean);
const invalidTurnstileHostnames = productionTurnstileHostnames.filter(
  (hostname) => hostname === "localhost" || hostname === "127.0.0.1",
);

if (missing.length || invalid.length || invalidTurnstileHostnames.length) {
  if (missing.length)
    console.error(`Missing production variables: ${missing.join(", ")}`);
  if (invalid.length)
    console.error(`Production URLs must use HTTPS: ${invalid.join(", ")}`);
  if (invalidTurnstileHostnames.length)
    console.error(
      "TURNSTILE_HOSTNAMES must not contain localhost or 127.0.0.1 in Production.",
    );
  process.exitCode = 1;
} else {
  console.log(
    "Production environment names and URL schemes are valid. No secret values were printed.",
  );
}
