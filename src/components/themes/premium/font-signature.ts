import { Manrope } from "next/font/google";

/**
 * Signature : Manrope pour le nom et les titres, Geist (global) pour le texte.
 *
 * Chaque moteur declare sa police dans SON module : les themes sont charges
 * dynamiquement, un profil Obsidian ne telecharge donc jamais Manrope. Tout
 * octet de police en trop se paie au moment du scan.
 */
export const signatureDisplay = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--pc-display",
  display: "swap",
});
