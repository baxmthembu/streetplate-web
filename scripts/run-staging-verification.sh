#!/usr/bin/env bash
# One-command StreetPlate staging verification.
#
# Closes blockers 1, 2 and 5 from the staging audit by running, on a machine
# that can actually reach staging:
#   - scripts/verify-staging.mjs   (Phases A-H)   -> blockers 1 and 2
#   - check-mobile-turnstile.sh    (mobile check) -> blocker 5
#
# Read-only against staging. Sends no email, moves no money, touches nothing
# in production. It never prints a secret.
#
# Usage
#   bash scripts/run-staging-verification.sh                      # from the repo root
#   bash scripts/run-staging-verification.sh . /path/to/kasi-eats # include the mobile check
#   RUN_RATE_LIMIT=1 bash scripts/run-staging-verification.sh     # include Phase E
#
# On a first run it writes a .env.staging.local template into the web repo and
# stops so you can fill in the three passwords and the anon key. Run it again
# afterwards and it executes everything.

set -uo pipefail

# Resolve paths before any cd: $0 is relative and the script changes directory.
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
CHECK_MOBILE="$SCRIPT_DIR/check-mobile-turnstile.sh"

# This script ships in streetplate-web/scripts, so default the web repo to its
# own parent. An explicit path still wins.
WEB=${1:-$(dirname "$SCRIPT_DIR")}
KASI=${2:-}

if [ ! -f "$WEB/scripts/verify-staging.mjs" ]; then
  echo "Not a streetplate-web checkout with the harness: $WEB"
  echo "Expected $WEB/scripts/verify-staging.mjs"
  echo "Branch: claude/streetplate-staging-verification-7xey3k"
  exit 2
fi

cd "$WEB" || exit 2
ENV_FILE=".env.staging.local"

command -v node >/dev/null || { echo "node not found on PATH"; exit 2; }
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "node 20+ required (found $(node -v)) — the harness uses built-in fetch/FormData."
  exit 2
fi

# ── Step 1: make sure the env file exists and is filled in ──────────────────
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'TEMPLATE'
# StreetPlate staging verification config. Git-ignored (.gitignore has .env*).
# Never commit this file. Never paste its contents into a chat or an issue.

STAGING_API_URL=https://streetplate-staging-production.up.railway.app
STAGING_SUPABASE_URL=https://nmxcmfkgtnhjhzmvqmrb.supabase.co

# Supabase dashboard -> StreetPlate Staging -> Project Settings -> API Keys
# Use the publishable "anon" key, NOT the service-role key.
STAGING_SUPABASE_ANON_KEY=

# Synthetic staging identities. If the passwords are lost, reset them in
# Supabase Auth -> Users (this preserves each user's UUID, which staging role
# and profile rows depend on). Do not delete or recreate these accounts.
STAGING_CUSTOMER_EMAIL=baxmthembu2002+streetplate-staging-customer@gmail.com
STAGING_CUSTOMER_PASSWORD=

STAGING_VENDOR_EMAIL=baxmthembu2002+streetplate-staging-vendor@gmail.com
STAGING_VENDOR_PASSWORD=

STAGING_DRIVER_EMAIL=baxmthembu2002+streetplate-staging-driver@gmail.com
STAGING_DRIVER_PASSWORD=
TEMPLATE
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE (mode 600)."
  echo
  echo "Fill in these four values, then run this script again:"
  echo "  STAGING_SUPABASE_ANON_KEY"
  echo "  STAGING_CUSTOMER_PASSWORD"
  echo "  STAGING_VENDOR_PASSWORD"
  echo "  STAGING_DRIVER_PASSWORD"
  exit 3
fi

missing=""
for key in STAGING_SUPABASE_ANON_KEY STAGING_CUSTOMER_PASSWORD STAGING_VENDOR_PASSWORD STAGING_DRIVER_PASSWORD; do
  # Presence only — the value is never read into a variable that gets printed.
  if ! grep -qE "^${key}=.+" "$ENV_FILE"; then
    missing="$missing $key"
  fi
done
if [ -n "$missing" ]; then
  echo "$ENV_FILE is missing values for:$missing"
  echo "Fill them in and re-run. (Reset passwords in Supabase Auth -> Users if lost;"
  echo "that preserves the UUIDs. Do not delete or recreate the accounts.)"
  exit 3
fi

# Guard against the file being committed by accident.
if git -C "$WEB" ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
  echo "REFUSING TO RUN: $ENV_FILE is tracked by git. Untrack it first:"
  echo "  git rm --cached $ENV_FILE"
  exit 2
fi

# ── Step 2: reachability, before spending time on the suite ─────────────────
echo "══ Reachability ═══════════════════════════════════════════"
api=$(grep -E '^STAGING_API_URL=' "$ENV_FILE" | cut -d= -f2-)
code=$(curl -sS -m 20 -o /dev/null -w "%{http_code}" "$api/api/health" 2>/dev/null)
[ -z "$code" ] && code=000
echo "  GET $api/api/health -> $code"
if [ "$code" != "200" ]; then
  echo
  echo "  Staging is not reachable from this machine (expected 200)."
  echo "  This is the blocker the audit hit. Check VPN / firewall / egress policy."
  echo "  Not continuing — every phase would fail for the same reason."
  exit 1
fi
echo

# ── Step 3: Phases A-H ──────────────────────────────────────────────────────
echo "══ verify-staging.mjs (Phases A-H) ════════════════════════"
node scripts/verify-staging.mjs
harness=$?
echo
echo "  harness exit code: $harness"
echo

# Phase E is opt-in because it consumes this IP's auth quota for 15 minutes.
if [ "${RUN_RATE_LIMIT:-}" = "1" ]; then
  echo "══ Phase E (rate limiting) ════════════════════════════════"
  echo "  This spends the auth quota for this IP for ~15 minutes."
  node scripts/verify-staging.mjs --phases=E --yes-rate-limit
  echo "  phase E exit code: $?"
  echo
else
  echo "  Phase E skipped. Re-run with RUN_RATE_LIMIT=1 to include it."
  echo
fi

# ── Step 4: mobile contract ─────────────────────────────────────────────────
mobile_note="not run (no kasi-eats path given)"
if [ -n "$KASI" ]; then
  echo "══ Mobile turnstile_token contract ════════════════════════"
  if [ ! -d "$KASI" ]; then
    echo "  Not a directory: $KASI"
    mobile_note="bad kasi-eats path"
  elif [ ! -f "$CHECK_MOBILE" ]; then
    echo "  check-mobile-turnstile.sh not found next to this script."
    mobile_note="script missing"
  else
    # Must run with kasi-eats as the working directory: the check resolves the
    # repository with `git rev-parse --show-toplevel` from the cwd.
    ( cd "$KASI" && bash "$CHECK_MOBILE" ) 2>&1 | sed 's/^/  /'
    mobile_note="see output above"
  fi
  echo
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo "══ Result ═════════════════════════════════════════════════"
if [ "$harness" -eq 0 ]; then
  echo "  Phases A-H: all executed checks PASSED."
  echo "  Blockers 1 and 2 are closed."
else
  echo "  Phases A-H: FAILURES above. Blockers 1 and 2 remain open."
fi
echo "  Mobile contract (blocker 5): $mobile_note"
echo
echo "  Skipped checks are not evidence of readiness. The valid-Turnstile"
echo "  success path still needs a manual browser sign-in."
exit "$harness"
