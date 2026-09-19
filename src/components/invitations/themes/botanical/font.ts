import { Fraunces } from "next/font/google";

/**
 * Botanical : une serif "molle" (axe SOFT de Fraunces), aux formes arrondies,
 * qui repond au trait des feuillages. Composee en graisse legere (300) pour
 * les noms : la modernite vient de la finesse, pas d une calligraphie.
 * L axe optique garde les italiques lisibles en petit corps sur Android.
 */
export const botanicalDisplay = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--bt-display",
  display: "swap",
  adjustFontFallback: false,
});
