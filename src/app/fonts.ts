import { Jost, Libre_Baskerville, Poppins, Quicksand } from "next/font/google";

/**
 * Typeface stack mirrors the source storefront:
 * Jost for body/UI, Quicksand for display headings, Poppins for dense UI
 * labels, and Libre Baskerville for long-form editorial copy.
 */
export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
