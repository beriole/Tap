import { Newsreader } from "next/font/google";

/** Journal : une serif de presse a axe optique, pour la manchette, la lettrine et le sommaire. */
export const journalDisplay = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--pc-display",
  display: "swap",
});
