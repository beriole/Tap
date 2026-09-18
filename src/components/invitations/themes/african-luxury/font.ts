import { DM_Serif_Display } from "next/font/google";

/**
 * African Luxury : une serif de titrage ronde et dense, qui tient tete aux
 * motifs geometriques. Une seule graisse : la force vient du corps et des
 * bandes tissees, pas d une famille entiere.
 */
export const africanLuxuryDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--al-display",
  display: "swap",
});
