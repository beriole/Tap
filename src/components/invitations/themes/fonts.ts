import { Cormorant_Garamond, EB_Garamond, Fredoka, Great_Vibes, Libre_Baskerville, Manrope, Playfair_Display, Space_Grotesk } from "next/font/google";

/**
 * Polices partagees par les themes des collections Mariage (suite),
 * Anniversaire, Corporate et Memorial (cahier §13). Deux familles au plus par
 * theme, le corps reste en Geist (deja chargee). Une famille ici peut servir
 * plusieurs themes : un @font-face de moins par theme, et une seule
 * declaration par famille dans la feuille de style de l invitation.
 *
 * next/font exige des options litterales (pas de spread, pas de variable) :
 * elles sont lues a la compilation. adjustFontFallback: false - voir
 * app/layout.tsx.
 */

/** Romantic, Elegant : une transitionnelle a fort contraste, italiques dessinees. */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--inv-playfair",
  display: "swap",
  adjustFontFallback: false,
});

/** Romantic : la "calligraphie limitee" du cahier - un mot ou deux, jamais un paragraphe. */
export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--inv-script",
  display: "swap",
  adjustFontFallback: false,
});

/** Modern Glass, Conference : une sans-serif geometrique douce, graisses larges. */
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--inv-manrope",
  display: "swap",
  adjustFontFallback: false,
});

/** Kids : formes rondes, lisibles par un enfant. */
export const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--inv-fredoka",
  display: "swap",
  adjustFontFallback: false,
});

/** Neon, Launch : une grotesque a caractere, chiffres ouverts. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--inv-space",
  display: "swap",
  adjustFontFallback: false,
});

/** Serenity : une garalde calme, pour la lecture. */
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--inv-garamond",
  display: "swap",
  adjustFontFallback: false,
});

/** Classic, Gala : la papeterie traditionnelle. */
export const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--inv-baskerville",
  display: "swap",
  adjustFontFallback: false,
});

/** Elegant : garalde de titrage aux italiques tres dessinees, chiffres de gravure. */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--inv-cormorant",
  display: "swap",
  adjustFontFallback: false,
});
