import { DM_Serif_Display } from "next/font/google";

/** Heritage : une serif ronde et dense, celle des affiches d Accra et de Lagos. */
export const heritageDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--pc-display",
  display: "swap",
  adjustFontFallback: false,
});
