import { Anton } from "next/font/google";

/** Block : capitales condensees, une seule graisse - le poids vient de la taille. */
export const blockDisplay = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--pc-display",
  display: "swap",
});
