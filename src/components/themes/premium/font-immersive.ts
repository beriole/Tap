import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * Immersive : Plus Jakarta Sans, serree et affirmee, pour un nom pose sur une
 * photo et qui doit rester lisible sur n importe quel fond. Geist pour le texte.
 */
export const immersiveDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--pc-display",
  display: "swap",
});
