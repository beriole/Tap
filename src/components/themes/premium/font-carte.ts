import { Sora } from "next/font/google";

/** Carte : une geometrique nette, celle qu on graverait sur la carte physique. */
export const carteDisplay = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--pc-display",
  display: "swap",
  adjustFontFallback: false,
});
