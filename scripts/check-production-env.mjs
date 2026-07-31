const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SOCKET_URL",
  "STREETPLATE_API_URL",
];

const httpsVariables = required.filter(
  (name) => name !== "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
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

if (missing.length || invalid.length) {
  if (missing.length)
    console.error(`Missing production variables: ${missing.join(", ")}`);
  if (invalid.length)
    console.error(`Production URLs must use HTTPS: ${invalid.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(
    "Production environment names and URL schemes are valid. No secret values were printed.",
  );
}
