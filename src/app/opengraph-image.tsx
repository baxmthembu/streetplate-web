import { ImageResponse } from "next/og";

export const alt = "StreetPlate — local food, delivered from your community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#1f2937",
        color: "#ffffff",
        display: "flex",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ color: "#facc15", fontSize: 30 }}>STREETPLATE</div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 720,
          }}
        >
          Local food, delivered from your community.
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          background: "#f97316",
          borderRadius: 999,
          display: "flex",
          fontSize: 76,
          fontWeight: 900,
          height: 260,
          justifyContent: "center",
          width: 260,
        }}
      >
        SP
      </div>
    </div>,
    size,
  );
}
