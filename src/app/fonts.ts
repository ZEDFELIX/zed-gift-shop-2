import { Roboto } from "next/font/google";

/**
 * Jumia-style grotesque for headings. Loaded from Google Fonts at build time
 * and self-hosted by Next.js, so no runtime CDN dependency.
 */
export const displaySans = Roboto({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display-sans",
  display: "swap",
});

// Legacy aliases kept for layout classNames; headings now use displaySans.
export const jost = { variable: "font-jost" };
export const quicksand = { variable: "font-quicksand" };
export const poppins = { variable: "font-poppins" };
export const libreBaskerville = { variable: "font-libre-baskerville" };
