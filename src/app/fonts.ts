import { Jost, Poppins, Quicksand, Libre_Baskerville } from "next/font/google";

/** Rio Gift Shop heading/menu face. */
export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

/** Rio body copy face. */
export const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

/** Rio kit typography face (buttons, small labels). */
export const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

/** Rio serif accent face. */
export const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

/** Kept for layout classNames; Jost doubles as the sans display face. */
export const displaySans = jost;
