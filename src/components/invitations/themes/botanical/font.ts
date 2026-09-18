import { Fraunces } from "next/font/google";

/**
 * Botanical : une serif "molle" (axe SOFT de Fraunces), aux formes arrondies,
 * qui va avec les feuillages. L axe optique garde les italiques lisibles en
 * petit corps sur Android.
 */
export const botanicalDisplay = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--bt-display",
  display: "swap",
  adjustFontFallback: false,
});
