import { Roboto } from "next/font/google";

/** Clean, compact Roboto typography inspired by Jumia's shopping experience. */
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});
