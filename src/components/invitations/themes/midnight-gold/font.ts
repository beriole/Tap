import { Cormorant_Garamond } from "next/font/google";

/**
 * Midnight Gold : une garalde legere, tres contrastee sur fond sombre.
 *
 * Cormorant Garamond en graisse 300/400 : ses pleins fins restent lisibles
 * sur un fond nuit parce que la couleur or est claire ; sur fond clair elle
 * disparaitrait. Le theme n a donc pas de variante claire, par choix.
 */
export const midnightGoldDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--mg-display",
  display: "swap",
  adjustFontFallback: false,
});
