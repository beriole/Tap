import { Instrument_Serif } from "next/font/google";

/**
 * Editorial : une serif de titrage a l italique tres marquee, pour les noms en
 * tres grand corps. Tout le reste est en Geist, deja chargee : le contraste
 * serif geant / sans-serif capitale EST la composition.
 */
export const editorialDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ed-display",
  display: "swap",
  adjustFontFallback: false,
});
