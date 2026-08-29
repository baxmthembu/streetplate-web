#!/usr/bin/env bash
# Determine whether the StreetPlate mobile apps satisfy the auth contract that
# kasi-eats PR #7 introduces: a required `turnstile_token` field on
#   POST /auth/login, /auth/register, /auth/update-password, /auth/profile/complete
#
# Each route is wrapped in checkExact, so a client that omits the field is
# rejected with 400 at validation — before any auth logic runs. A client built
# against the older contract breaks the moment PR #7 reaches its environment.
#
# Read-only. Run it from anywhere inside your kasi-eats checkout.
#   bash check-mobile-turnstile.sh
#
# It distinguishes three outcomes per app, which a bare grep cannot:
#   WIRED       — the app obtains a Turnstile token
#   NOT WIRED   — app source is present and contains no Turnstile usage
#   NO SOURCE   — the submodule is not populated, so nothing can be concluded

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Not inside a git checkout. cd into your kasi-eats clone first."
  exit 2
}
cd "$ROOT" || exit 2

if [ ! -d backend ] || [ ! -d apps ]; then
  echo "This does not look like kasi-eats (expected backend/ and apps/ at $ROOT)."
  exit 2
fi

echo "Repository: $ROOT"
echo "Revision:   $(git rev-parse --short HEAD 2>/dev/null) on $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
echo

# ── Does this revision's backend actually require the token? ────────────────
REQUIRED=$(grep -c "body('turnstile_token')" backend/src/routes/auth.js 2>/dev/null || echo 0)
echo "Backend contract on this revision: $REQUIRED endpoint(s) require turnstile_token"
if [ "$REQUIRED" -eq 0 ]; then
  echo "  -> This checkout predates the change. Compare against PR #7's branch:"
  echo "     git fetch origin feature/production-readiness-security"
  echo "     git grep -c \"body('turnstile_token')\" origin/feature/production-readiness-security -- backend/src/routes/auth.js"
fi
echo

# Files worth searching, wherever the app keeps them. Deliberately not assuming
# a src/ directory — layout varies between Expo templates.
find_sources() {
  find "$1" \
    \( -name node_modules -o -name .expo -o -name .expo-shared -o -name build \
       -o -name dist -o -name .git -o -name Pods -o -name .gradle \) -prune -o \
    -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \) -print 2>/dev/null
}

overall_missing=0
overall_notwired=0

for app in customer vendor driver; do
  dir="apps/$app"
  printf '%s\n' "── apps/$app ──────────────────────────────────────────────"

  if [ ! -d "$dir" ]; then
    echo "  NO SOURCE — directory absent"
    overall_missing=$((overall_missing + 1)); echo; continue
  fi

  # A gitlink with nothing checked out looks empty. Say so rather than
  # reporting a misleading "no matches".
  count=$(find_sources "$dir" | wc -l | tr -d ' ')
  if [ "$count" -eq 0 ]; then
    echo "  NO SOURCE — no JS/TS files found under $dir"
    if git ls-files -s "$dir" 2>/dev/null | grep -q '^160000'; then
      echo "  Reason: tracked as a submodule gitlink, but not populated here."
      if [ -f .gitmodules ]; then
        echo "  Fix:    git submodule update --init --recursive"
      else
        echo "  Note:   there is no .gitmodules file, so git has no remote recorded"
        echo "          for it. The source exists only where it was authored."
      fi
    fi
    overall_missing=$((overall_missing + 1)); echo; continue
  fi

  echo "  source files: $count"

  hits_turnstile=$(find_sources "$dir" | xargs grep -lEi 'turnstile|captcha' 2>/dev/null | wc -l | tr -d ' ')
  hits_bridge=$(find_sources "$dir" | xargs grep -lE 'mobile/turnstile' 2>/dev/null | wc -l | tr -d ' ')
  hits_webview=$(find_sources "$dir" | xargs grep -lE 'ReactNativeWebView|react-native-webview|WebView' 2>/dev/null | wc -l | tr -d ' ')
  hits_field=$(find_sources "$dir" | xargs grep -lE 'turnstile_token' 2>/dev/null | wc -l | tr -d ' ')
  hits_auth=$(find_sources "$dir" | xargs grep -lE 'auth/(login|register|update-password)|profile/complete' 2>/dev/null | wc -l | tr -d ' ')

  echo "  turnstile/captcha mentions : $hits_turnstile file(s)"
  echo "  sends turnstile_token      : $hits_field file(s)"
  echo "  uses /mobile/turnstile     : $hits_bridge file(s)"
  echo "  WebView present            : $hits_webview file(s)"
  echo "  affected auth call sites   : $hits_auth file(s)"

  if [ "$hits_field" -gt 0 ] || [ "$hits_bridge" -gt 0 ]; then
    echo "  VERDICT: WIRED — this app supplies a token."
  elif [ "$hits_auth" -eq 0 ]; then
    echo "  VERDICT: no calls to the affected endpoints found — likely unaffected,"
    echo "           but confirm it does not build request paths dynamically."
  else
    echo "  VERDICT: NOT WIRED — it calls the affected endpoints without a token."
    echo "           Login/registration will fail with 400 once PR #7 ships."
    overall_notwired=$((overall_notwired + 1))
    echo "  call sites:"
    find_sources "$dir" | xargs grep -nE 'auth/(login|register|update-password)|profile/complete' 2>/dev/null | head -5 | sed 's/^/    /'
  fi
  echo
done

echo "══ Summary ════════════════════════════════════════════════"
if [ "$overall_missing" -gt 0 ]; then
  echo "  $overall_missing app(s) had no source available — INCONCLUSIVE for those."
fi
if [ "$overall_notwired" -gt 0 ]; then
  echo "  $overall_notwired app(s) call the affected endpoints without a token."
  echo "  Do not merge PR #7 to production until those are updated."
elif [ "$overall_missing" -eq 0 ]; then
  echo "  No app is missing the token. The contract change is safe to ship."
fi
echo
echo "  Web bridge available for the mobile side:"
echo "    /mobile/turnstile?action=<login|signup|password_reset|password_update>&app=<customer|vendor|driver>"
echo "    posts { type: \"turnstile\", ... } via ReactNativeWebView.postMessage"
