const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");

function findBackendDirectory() {
  const candidates = [
    process.env.STREETPLATE_BACKEND_DIR,
    path.resolve(process.cwd(), "..", "kasi-eats", "backend"),
    path.join(os.homedir(), "OneDrive", "Desktop", "kasi-eats", "backend"),
  ].filter(Boolean);
  const backendDirectory = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "server.js")),
  );
  if (!backendDirectory) {
    throw new Error(
      "StreetPlate backend not found. Set STREETPLATE_BACKEND_DIR to the existing kasi-eats/backend directory.",
    );
  }
  return backendDirectory;
}

const backendDirectory = findBackendDirectory();
const backendRequire = createRequire(path.join(backendDirectory, "server.js"));
const dotenv = backendRequire("dotenv");

dotenv.config({ path: path.join(backendDirectory, ".env") });
process.env.NODE_ENV = "development";

// Do not let local development expire shared offers or generate live payouts.
const nodeCron = backendRequire("node-cron");
nodeCron.schedule = () => {
  console.log("[local-safe] Weekly payout scheduler disabled.");
  return {
    start() {},
    stop() {},
    destroy() {},
    getStatus() {
      return "stopped";
    },
  };
};

const nativeSetInterval = global.setInterval;
const nativeClearInterval = global.clearInterval;
const disabledIntervals = new WeakSet();

global.setInterval = (callback, delay, ...args) => {
  const isOfferExpiryJob =
    delay === 10_000 &&
    typeof callback === "function" &&
    callback.toString().includes("expirePendingOffers");
  if (isOfferExpiryJob) {
    console.log("[local-safe] Delivery-offer expiry scheduler disabled.");
    const handle = {};
    disabledIntervals.add(handle);
    return handle;
  }
  return nativeSetInterval(callback, delay, ...args);
};

global.clearInterval = (handle) => {
  if (handle && typeof handle === "object" && disabledIntervals.has(handle)) {
    return;
  }
  return nativeClearInterval(handle);
};

console.log(`[local-safe] Loading backend from ${backendDirectory}`);
backendRequire(path.join(backendDirectory, "server.js"));
