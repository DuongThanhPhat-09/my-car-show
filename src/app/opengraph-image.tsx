import { ImageResponse } from "next/og";
import { CAR_SPECS } from "@/config/site";

export const alt = "Lamborghini Aventador S — 3D Showroom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated at build time: brand-consistent social card, no static asset to maintain. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#f3f4f6",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 115%, rgba(200,216,255,0.35), transparent 70%), linear-gradient(180deg, #0b0c10 0%, #050506 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="48" height="57" viewBox="0 0 84 100">
            <path d="M0 0H84V55Q84 85 42 100Q0 85 0 55Z" fill="#c9a24a" />
            <path d="M5 5H79V55Q79 81 42 94.5Q5 81 5 55Z" fill="#08080a" />
          </svg>
          <div style={{ fontSize: 22, letterSpacing: 14, fontWeight: 700 }}>LAMBORGHINI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, letterSpacing: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
            LP 740-4 · 3D Showroom
          </div>
          <div style={{ fontSize: 96, fontWeight: 200, letterSpacing: 8, marginTop: 8 }}>AVENTADOR S</div>
        </div>
        <div style={{ display: "flex", gap: 56 }}>
          {CAR_SPECS.slice(0, 4).map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 16, letterSpacing: 4, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 34, fontWeight: 300, marginTop: 6 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
