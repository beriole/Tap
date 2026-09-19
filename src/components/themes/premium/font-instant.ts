import { Caveat } from "next/font/google";

/**
 * Instant : l ecriture au feutre, celle qu on laisse au dos d un tirage.
 * Reservee a la legende du recto et aux coordonnees du verso - jamais a
 * l interface, qui reste en Geist.
 */
export const instantHand = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--pc-hand",
  display: "swap",
  adjustFontFallback: false,
});
