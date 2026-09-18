import { Instrument_Serif } from "next/font/google";

/**
 * Obsidian : une serif editoriale pour le nom seulement, Geist pour le reste.
 * Une seule graisse suffit - l elegance vient de la taille et de l air, pas
 * d un gras. Deux familles au maximum par theme.
 */
export const obsidianDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--pc-display",
  display: "swap",
  adjustFontFallback: false,
});
