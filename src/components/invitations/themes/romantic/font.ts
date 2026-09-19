import { Ballet } from "next/font/google";

/**
 * Romantic : LA calligraphie du theme. Ballet est une anglaise contemporaine
 * a fort contraste (axe optique 16-72) : elle a l elegance d une plume sans
 * l air vieilli des scripts de faire-part. Elle ne sert qu aux prenoms et a la
 * signature - jamais a un paragraphe. Le reste est en Playfair et Geist.
 */
export const romanticScript = Ballet({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--ro-script",
  display: "swap",
  adjustFontFallback: false,
});
