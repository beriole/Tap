import { DM_Serif_Display } from "next/font/google";

/** Table : une serif d enseigne, genereuse, pour le nom du lieu et les titres. */
export const tableDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--pc-display",
  display: "swap",
});
