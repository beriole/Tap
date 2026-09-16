import { Inter_Tight } from "next/font/google";

/** Swiss : une grotesque serree pour le nom-affiche. Geist Mono (global) pour les etiquettes. */
export const swissDisplay = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--pc-display",
  display: "swap",
});
