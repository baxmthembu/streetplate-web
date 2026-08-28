#!/usr/bin/env node
/**
 * StreetPlate staging verification harness (Phases A–G).
 *
 * Runs the live staging checks that cannot be performed from a sandboxed CI
 * session: dependency readiness, authenticated role sign-in, Turnstile contract
 * enforcement, vendor wallet/payout routing, distributed rate limiting, upload
 * malware scanning and Resend configuration.
 *
 * Staging only. It never writes to production, never moves money, and never
 * prints a secret — credentials are reported as presence/shape only.
 *
 * Usage
 *   node scripts/verify-staging.mjs                     # phases A,B,C,D,F,G
 *   node scripts/verify-staging.mjs --phases=A,D
 *   node scripts/verify-staging.mjs --phases=E --yes-rate-limit
 *   node scripts/verify-staging.mjs --json              # machine-readable summary
 *
 * Configuration — put these in .env.staging.local (git-ignored):
 *   STAGING_API_URL=https://streetplate-staging-production.up.railway.app
 *   STAGING_SUPABASE_URL=https://<staging-ref>.supabase.co
 *   STAGING_SUPABASE_ANON_KEY=...
 *   STAGING_CUSTOMER_EMAIL= / STAGING_CUSTOMER_PASSWORD=
 *   STAGING_VENDOR_EMAIL=   / STAGING_VENDOR_PASSWORD=
 *   STAGING_DRIVER_EMAIL=   / STAGING_DRIVER_PASSWORD=
 *
 * Exit code 0 when every executed check passes, 1 otherwise.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Config loading ────────────────────────────────────────────────────────
const ENV_FILE = process.env.STAGING_ENV_FILE ?? ".env.staging.local";

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(resolve(process.cwd(), path), "utf8");
  } catch {
    return {};
  }
  const out = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...loadEnvFile(ENV_FILE), ...process.env };

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const JSON_OUT = flag("json");
const ALLOW_RATE_LIMIT = flag("yes-rate-limit");
const PHASES = new Set(
  option("phases", "A,B,C,D,F,G")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean),
);

const API = (env.STAGING_API_URL ?? "").replace(/\/+$/, "");
const SUPABASE_URL = (env.STAGING_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = env.STAGING_SUPABASE_ANON_KEY ?? "";

// ─── Result recording ──────────────────────────────────────────────────────
const results = [];
const C = {
  reset: "\u001b[0m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  dim: "\u001b[2m",
  bold: "\u001b[1m",
};

function record(phase, name, status, detail = "") {
  results.push({ phase, name, status, detail });
  if (JSON_OUT) return;
  const badge =
    status === "PASS"
      ? `${C.green}PASS${C.reset}`
      : status === "FAIL"
        ? `${C.red}FAIL${C.reset}`
        : `${C.yellow}SKIP${C.reset}`;
  console.log(
    `  ${badge}  ${name}${detail ? ` ${C.dim}— ${detail}${C.reset}` : ""}`,
  );
}

const pass = (phase, name, detail) => record(phase, name, "PASS", detail);
const fail = (phase, name, detail) => record(phase, name, "FAIL", detail);
const skip = (phase, name, detail) => record(phase, name, "SKIP", detail);

/** Assert a condition, recording PASS or FAIL with separate detail strings. */
function check(ok, phase, name, failDetail = "", passDetail = "") {
  if (ok) pass(phase, name, passDetail);
  else fail(phase, name, failDetail);
}

function heading(text) {
  if (!JSON_OUT) console.log(`\n${C.bold}${text}${C.reset}`);
}

/** Describe a secret without ever revealing it. */
function describeSecret(value) {
  if (!value) return "absent";
  return `present, length ${value.length}, no-asterisks=${!value.includes("*")}`;
}

// ─── HTTP helper ───────────────────────────────────────────────────────────
async function request(
  path,
  { method = "GET", token, body, headers = {}, raw } = {},
) {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const init = { method, headers: { ...headers } };
  if (token) init.headers.authorization = `Bearer ${token}`;
  if (raw !== undefined) {
    init.body = raw;
  } else if (body !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, headers: res.headers, json, text };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      headers: new Headers(),
      json: null,
      text: String(error),
    };
  }
}

/** Sign in through Supabase Auth (no Turnstile on this path) for a bearer token. */
async function signIn(email, password) {
  const res = await request(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "content-type": "application/json",
      },
      raw: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok || !res.json?.access_token) {
    return {
      token: null,
      status: res.status,
      error: res.json?.error_description ?? res.json?.msg ?? "no access_token",
    };
  }
  return { token: res.json.access_token, status: res.status };
}

// ─── Phase A — deployment readiness ────────────────────────────────────────
async function phaseA() {
  heading("Phase A — staging deployment & readiness");

  const health = await request("/api/health");
  check(
    health.status === 200,
    "A",
    "GET /api/health → 200",
    `expected 200, got ${health.status}`,
  );

  const ready = await request("/api/readiness");
  check(
    ready.status === 200,
    "A",
    "GET /api/readiness → 200",
    `expected 200, got ${ready.status} ${JSON.stringify(ready.json ?? {})}`,
  );

  const checks = ready.json?.checks ?? {};
  for (const dep of ["configured", "supabase", "redis", "malwareScanner"]) {
    if (!(dep in checks)) {
      skip("A", `readiness.${dep}`, "not reported by this build");
      continue;
    }
    check(
      checks[dep] === true,
      "A",
      `readiness.${dep} = true`,
      "reported false — dependency unavailable",
    );
  }

  // Readiness must be dependency-aware, not a bare liveness 200.
  check(
    Object.keys(checks).length > 0,
    "A",
    "readiness reports real dependencies (not bare liveness)",
    "no checks object returned",
  );
}

// ─── Phase B — authenticated role sign-in & role guards ────────────────────
const tokens = {};

async function phaseB() {
  heading("Phase B — customer / vendor / driver authentication");

  const roles = [
    ["customer", env.STAGING_CUSTOMER_EMAIL, env.STAGING_CUSTOMER_PASSWORD],
    ["vendor", env.STAGING_VENDOR_EMAIL, env.STAGING_VENDOR_PASSWORD],
    ["driver", env.STAGING_DRIVER_EMAIL, env.STAGING_DRIVER_PASSWORD],
  ];

  for (const [role, email, password] of roles) {
    if (!email || !password) {
      skip(
        "B",
        `${role} sign-in`,
        `credentials absent (password ${describeSecret(password)})`,
      );
      continue;
    }

    const { token, status, error } = await signIn(email, password);
    if (!token) {
      fail(
        "B",
        `${role} sign-in`,
        `Supabase auth failed (${status}): ${error}`,
      );
      continue;
    }
    tokens[role] = token;
    pass("B", `${role} sign-in`);

    const profile = await request("/api/auth/profile", { token });
    if (profile.status !== 200) {
      fail(
        "B",
        `${role} GET /api/auth/profile`,
        `expected 200, got ${profile.status}`,
      );
      continue;
    }
    const actual = profile.json?.user?.role ?? profile.json?.role;
    check(
      actual === role,
      "B",
      `${role} profile role = "${role}"`,
      `expected "${role}", got "${actual}"`,
    );
  }

  // Cross-role privilege escalation must be rejected.
  const guards = [
    ["customer", "/api/vendors/wallet"],
    ["customer", "/api/drivers/wallet"],
    ["driver", "/api/vendors/wallet"],
    ["vendor", "/api/drivers/wallet"],
  ];
  for (const [role, path] of guards) {
    if (!tokens[role]) {
      skip("B", `${role} blocked from ${path}`, "no session");
      continue;
    }
    const res = await request(path, { token: tokens[role] });
    check(
      res.status === 403,
      "B",
      `${role} blocked from ${path} → 403`,
      `expected 403, got ${res.status}`,
    );
  }

  const anon = await request("/api/vendors/wallet");
  check(
    anon.status === 401,
    "B",
    "anonymous blocked from /api/vendors/wallet → 401",
    `expected 401, got ${anon.status}`,
  );
}

// ─── Phase C — Turnstile contract ──────────────────────────────────────────
async function phaseC() {
  heading("Phase C — Turnstile enforcement");

  const email = env.STAGING_CUSTOMER_EMAIL ?? "turnstile-probe@example.invalid";

  // A missing token is rejected by request validation before any credential work.
  const missing = await request("/api/auth/login", {
    method: "POST",
    body: { email, password: "not-a-real-password" },
  });
  check(
    missing.status === 400,
    "C",
    "login without turnstile_token → 400",
    `expected 400, got ${missing.status}`,
  );

  // A syntactically valid but bogus token must be rejected by siteverify.
  const invalid = await request("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password: "not-a-real-password",
      turnstile_token: "invalid-token-for-verification",
    },
  });
  if (invalid.status === 403 && invalid.json?.code === "TURNSTILE_FAILED") {
    pass("C", "login with invalid turnstile_token → 403 TURNSTILE_FAILED");
  } else if (invalid.status === 503) {
    fail(
      "C",
      "Turnstile provider",
      "503 — secret missing or siteverify unreachable from staging",
    );
  } else {
    fail(
      "C",
      "login with invalid turnstile_token",
      `expected 403 TURNSTILE_FAILED, got ${invalid.status}`,
    );
  }

  // Never assert a "valid token" path here: a real token requires a browser
  // challenge. Drive that manually through the web sign-in form.
  skip(
    "C",
    "valid-token success path",
    "requires an interactive browser challenge — verify manually on the sign-in page",
  );
}

// ─── Phase D — vendor wallet, payouts and isolation ────────────────────────
async function phaseD() {
  heading("Phase D — vendor wallet / payouts / earnings");

  const token = tokens.vendor;
  if (!token) {
    skip("D", "vendor financial endpoints", "no vendor session (run phase B)");
    return;
  }

  const wallet = await request("/api/vendors/wallet", { token });
  if (wallet.status !== 200) {
    fail(
      "D",
      "GET /api/vendors/wallet",
      `expected 200, got ${wallet.status} ${wallet.text.slice(0, 120)}`,
    );
  } else if (/vendor not found/i.test(wallet.text)) {
    fail("D", "GET /api/vendors/wallet", 'regression: "Vendor not found"');
  } else {
    const w = wallet.json?.wallet;
    // A wallet payload proves /vendors/:id did not shadow this route.
    if (w && typeof w === "object" && "available_balance" in w) {
      pass(
        "D",
        "wallet resolves to a wallet payload (not shadowed by /vendors/:id)",
      );
      pass(
        "D",
        `wallet zero/empty state valid (available=${w.available_balance}, pending=${w.pending_balance})`,
      );
    } else {
      fail(
        "D",
        "GET /api/vendors/wallet",
        `unexpected payload shape: ${wallet.text.slice(0, 160)}`,
      );
    }
  }

  const payouts = await request("/api/vendors/payouts", { token });
  if (payouts.status !== 200) {
    fail(
      "D",
      "GET /api/vendors/payouts",
      `expected 200, got ${payouts.status}`,
    );
  } else if (/vendor not found/i.test(payouts.text)) {
    fail("D", "GET /api/vendors/payouts", 'regression: "Vendor not found"');
  } else if (Array.isArray(payouts.json?.payouts)) {
    pass(
      "D",
      `payouts route not shadowed (${payouts.json.payouts.length} record(s))`,
    );
  } else {
    fail(
      "D",
      "GET /api/vendors/payouts",
      `expected { payouts: [] }, got ${payouts.text.slice(0, 160)}`,
    );
  }

  const earnings = await request("/api/vendors/analytics/earnings?", { token });
  check(
    earnings.status === 200 && !/vendor not found/i.test(earnings.text),
    "D",
    "GET /api/vendors/analytics/earnings → 200",
    `got ${earnings.status} ${earnings.text.slice(0, 120)}`,
  );

  // Isolation: the vendor is resolved from the session, so a foreign vendor id
  // must never expose financial data through the generic vendor route.
  const foreign = await request(
    "/api/vendors/00000000-0000-0000-0000-000000000000",
    { token },
  );
  if ([400, 403, 404].includes(foreign.status)) {
    pass("D", `foreign vendor id rejected → ${foreign.status}`);
  } else if (
    foreign.status === 200 &&
    !/available_balance|payout/i.test(foreign.text)
  ) {
    pass("D", "foreign vendor id exposes no financial fields");
  } else {
    fail(
      "D",
      "vendor financial isolation",
      `got ${foreign.status} with a financial-looking payload`,
    );
  }
}

// ─── Phase E — distributed rate limiting ───────────────────────────────────
async function phaseE() {
  heading("Phase E — distributed rate limiting");

  if (!ALLOW_RATE_LIMIT) {
    skip(
      "E",
      "rate-limit quota probe",
      "pass --yes-rate-limit to run (consumes this IP's auth quota for 15 min)",
    );
    return;
  }

  // The auth limiter is the cheapest quota to prove (15 / 15 min) and rejecting
  // bad credentials has no side effects. This does lock auth for this IP.
  const probe = () =>
    request("/api/auth/login", {
      method: "POST",
      body: {
        email: "rate-limit-probe@example.invalid",
        password: "x",
        turnstile_token: "probe",
      },
    });

  let attempts = 0;
  let limited = null;
  for (let i = 0; i < 18; i += 1) {
    const res = await probe();
    attempts += 1;
    if (res.status === 429) {
      limited = res;
      break;
    }
  }

  check(
    limited !== null,
    "E",
    `quota enforced — 429 after ${attempts} requests`,
    `no 429 after ${attempts} requests — limiter may be disabled`,
  );

  const source = limited ?? (await probe());
  const limit = source.headers.get("ratelimit-limit");
  const remaining = source.headers.get("ratelimit-remaining");
  const reset = source.headers.get("ratelimit-reset");
  const policy = source.headers.get("ratelimit-policy");

  check(
    Boolean(limit) && remaining !== null,
    "E",
    `RateLimit-* headers present (limit=${limit}, remaining=${remaining}${policy ? `, policy=${policy}` : ""})`,
    "standardHeaders not observed on the response",
  );

  const resetSeconds = Number(reset);
  check(
    Number.isFinite(resetSeconds) &&
      resetSeconds > 0 &&
      resetSeconds <= 15 * 60,
    "E",
    `reset behaviour sane (${resetSeconds}s ≤ 15m window)`,
    `implausible RateLimit-Reset value: ${reset}`,
  );

  // Counter persistence: a fresh request must still see the exhausted quota
  // rather than a per-process counter that reset.
  const after = await probe();
  check(
    after.status === 429,
    "E",
    "counter shared/persisted across requests (still 429)",
    `expected 429, got ${after.status} — suggests in-memory fallback`,
  );

  if (!JSON_OUT) {
    console.log(
      `  ${C.dim}note: single-instance probe. Multi-instance sharing is evidenced by readiness.redis=true plus the fail-closed store.${C.reset}`,
    );
  }
}

// ─── Phase F — upload validation & malware scanning ────────────────────────
// Standard EICAR antivirus test string, assembled at runtime so this source
// file is not itself flagged by scanners. Harmless by design — not malware.
const EICAR = [
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-",
  "ANTIVIRUS-TEST-FILE!$H+H*",
].join("");

// Smallest valid 1x1 PNG.
const CLEAN_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function upload(token, filename, type, bytes) {
  const form = new FormData();
  form.append("image", new Blob([bytes], { type }), filename);
  return request("/api/vendors/upload-image", {
    method: "POST",
    token,
    raw: form,
  });
}

async function phaseF() {
  heading("Phase F — upload security & malware scanning");

  const token = tokens.vendor;
  if (!token) {
    skip("F", "upload checks", "no vendor session (run phase B)");
    return;
  }

  const clean = await upload(token, "clean.png", "image/png", CLEAN_PNG);
  check(
    [200, 201].includes(clean.status),
    "F",
    `clean image accepted → ${clean.status}`,
    `expected 200/201, got ${clean.status} ${clean.text.slice(0, 140)}`,
  );

  const bogus = await upload(
    token,
    "payload.txt",
    "text/plain",
    Buffer.from("not an image"),
  );
  check(
    bogus.status >= 400 && bogus.status < 500,
    "F",
    `invalid file type rejected → ${bogus.status}`,
    `expected 4xx, got ${bogus.status}`,
  );

  const infected = await upload(
    token,
    "eicar.png",
    "image/png",
    Buffer.from(EICAR, "utf8"),
  );
  if (infected.status >= 400 && infected.status < 500) {
    pass("F", `EICAR test fixture rejected → ${infected.status}`);
    check(
      !/https?:\/\//i.test(infected.text),
      "F",
      "EICAR not persisted (no asset URL returned)",
      "response contains a URL — the file may have been stored",
    );
  } else {
    fail(
      "F",
      "EICAR detection",
      `expected a 4xx rejection, got ${infected.status} — scanner may be inactive`,
    );
  }
}

// ─── Phase G — Resend configuration ────────────────────────────────────────
async function phaseG() {
  heading("Phase G — Resend configuration");

  // Readiness already asserts RESEND_API_KEY presence as part of `configured`;
  // surface it explicitly without ever reading the value.
  const ready = await request("/api/readiness");
  check(
    ready.json?.checks?.configured === true,
    "G",
    "staging reports required config present (includes RESEND_API_KEY)",
    "readiness.configured is not true — a required variable is missing",
  );

  skip(
    "G",
    "delivery test",
    "not sent by default — this harness dispatches no live email",
  );
}

// ─── Runner ────────────────────────────────────────────────────────────────
async function main() {
  if (!JSON_OUT) {
    console.log(`${C.bold}StreetPlate staging verification${C.reset}`);
    console.log(`  api      ${API || "(unset)"}`);
    console.log(`  supabase ${SUPABASE_URL || "(unset)"}`);
    console.log(`  anon key ${describeSecret(SUPABASE_ANON_KEY)}`);
    console.log(`  phases   ${[...PHASES].join(", ")}`);
  }

  const missing = [];
  if (!API) missing.push("STAGING_API_URL");
  if (!SUPABASE_URL) missing.push("STAGING_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("STAGING_SUPABASE_ANON_KEY");
  if (missing.length) {
    console.error(
      `\n${C.red}Missing configuration:${C.reset} ${missing.join(", ")}`,
    );
    console.error(`Set them in ${ENV_FILE} (git-ignored) or the environment.`);
    process.exit(2);
  }

  if (!/^https:\/\//.test(API) || !/^https:\/\//.test(SUPABASE_URL)) {
    console.error(
      `${C.red}STAGING_API_URL and STAGING_SUPABASE_URL must use HTTPS.${C.reset}`,
    );
    process.exit(2);
  }

  const phases = [
    ["A", phaseA],
    ["B", phaseB],
    ["C", phaseC],
    ["D", phaseD],
    ["E", phaseE],
    ["F", phaseF],
    ["G", phaseG],
  ];

  // Phases D and F need the vendor session from B; run B implicitly if needed.
  if ((PHASES.has("D") || PHASES.has("F")) && !PHASES.has("B")) {
    await phaseB();
  }

  for (const [id, run] of phases) {
    if (!PHASES.has(id)) continue;
    try {
      await run();
    } catch (error) {
      fail(id, `phase ${id} crashed`, String(error));
    }
  }

  const failed = results.filter((r) => r.status === "FAIL");
  const passed = results.filter((r) => r.status === "PASS");
  const skipped = results.filter((r) => r.status === "SKIP");

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          passed: passed.length,
          failed: failed.length,
          skipped: skipped.length,
          results,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `\n${C.bold}Summary${C.reset}  ${C.green}${passed.length} passed${C.reset}  ${C.red}${failed.length} failed${C.reset}  ${C.yellow}${skipped.length} skipped${C.reset}`,
    );
    if (failed.length) {
      console.log(`\n${C.red}Blockers:${C.reset}`);
      for (const f of failed) {
        console.log(`  [${f.phase}] ${f.name} — ${f.detail}`);
      }
    }
    console.log(
      failed.length
        ? `\n${C.red}NOT READY${C.reset}`
        : `\n${C.green}All executed staging checks passed.${C.reset} Skipped checks are not evidence of readiness.`,
    );
  }

  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
