import { Bodoni_Moda } from "next/font/google";

/**
 * Royal Ivory : une didone, comme sur les faire-part graves.
 *
 * Bodoni Moda porte un axe de taille optique (opsz). C est ce qui la rend
 * utilisable sur telephone : a 96 px ses deliés sont des cheveux, a 14 px ils
 * s epaississent d eux-memes - une didone sans cet axe disparait sur un ecran
 * Android peu dense. Le texte courant reste en Geist, deja charge par
 * l application : deux familles, zero requete de police supplementaire pour
 * le corps.
 */
export const royalIvoryDisplay = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--ri-display",
  display: "swap",
});
