import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = SITE.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
 return new ImageResponse(
 (
 <div
 style={{
 height: "100%",
 width: "100%",
 display: "flex",
 flexDirection: "column",
 justifyContent: "space-between",
 background: "#0F5C4D",
 color: "#ffffff",
 fontFamily: "sans-serif",
 padding: 72,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
 <div
 style={{
 width: 96,
 height: 96,
 borderRadius: 24,
 background: "#ffffff",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 fontWeight: 900,
 color: "#0F5C4D",
 fontSize: 40,
 }}
 >
 Z
 </div>
 <div style={{ fontSize: 56, letterSpacing: 4, fontWeight: 900 }}>{SITE.name}</div>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE.tagline}</div>
 <div style={{ fontSize: 26, color: "#ffffff", letterSpacing: 2 }}>
 SAME-DAY NAIROBI DELIVERY | COUNTRYWIDE | M-PESA CHECKOUT
 </div>
 </div>
 </div>
 ),
 { ...size }
 );
}