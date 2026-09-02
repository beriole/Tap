import type { LinkType } from "@prisma/client";

/**
 * Identite visuelle par type de lien.
 *
 * Les themes en pilules et en tuiles reprennent la couleur officielle du
 * service : c est ce qui rend une rangee de liens lisible d un coup d oeil,
 * avant meme d avoir lu les libelles. `bg` est une valeur CSS complete afin de
 * porter aussi les degrades (Instagram).
 */
export type BrandSkin = { bg: string; fg: string };

const WHITE = "#FFFFFF";

export const BRAND_SKINS: Partial<Record<LinkType, BrandSkin>> = {
  PHONE: { bg: "#12A150", fg: WHITE },
  WHATSAPP: { bg: "#25D366", fg: WHITE },
  EMAIL: { bg: "#DB4437", fg: WHITE },
  TELEGRAM: { bg: "#26A5E4", fg: WHITE },
  MESSENGER: { bg: "#0084FF", fg: WHITE },

  LINKEDIN: { bg: "#0A66C2", fg: WHITE },
  INSTAGRAM: {
    bg: "linear-gradient(45deg,#F58529,#DD2A7B 45%,#8134AF 70%,#515BD4)",
    fg: WHITE,
  },
  FACEBOOK: { bg: "#1877F2", fg: WHITE },
  TIKTOK: { bg: "#010101", fg: WHITE },
  X: { bg: "#0F1419", fg: WHITE },
  YOUTUBE: { bg: "#FF0033", fg: WHITE },

  GITHUB: { bg: "#181717", fg: WHITE },
  BEHANCE: { bg: "#1769FF", fg: WHITE },
  DRIBBBLE: { bg: "#EA4C89", fg: WHITE },
  PORTFOLIO: { bg: "#3F3F46", fg: WHITE },
  RESUME: { bg: "#52525B", fg: WHITE },
  WEBSITE: { bg: "#0F766E", fg: WHITE },

  SHOP: { bg: "#7C3AED", fg: WHITE },
  CATALOG: { bg: "#9333EA", fg: WHITE },
  MENU: { bg: "#C2410C", fg: WHITE },
  BOOKING: { bg: "#0EA5E9", fg: WHITE },
  FORM: { bg: "#475569", fg: WHITE },
  PAYMENT: { bg: "#059669", fg: WHITE },

  MAPS: { bg: "#DB4437", fg: WHITE },
};

/** Repli neutre : un lien personnalise prend l accent du theme. */
export const NEUTRAL_SKIN: BrandSkin = { bg: "var(--accent)", fg: "var(--accent-foreground)" };

export function brandSkin(type: LinkType, override?: string | null): BrandSkin {
  if (override) return { bg: override, fg: WHITE };
  return BRAND_SKINS[type] ?? NEUTRAL_SKIN;
}

/**
 * Sous-titre par defaut, affiche sous le libelle par les themes en pilules.
 * Le client peut le remplacer champ par champ (ProfileLink.description) ;
 * ces valeurs ne servent que de point de depart raisonnable.
 */
export const LINK_SUBTITLES: Partial<Record<LinkType, string>> = {
  PHONE: "Appelez-moi",
  WHATSAPP: "Ecrivons-nous",
  EMAIL: "Envoyez-moi un message",
  TELEGRAM: "Rejoignez-moi",
  MESSENGER: "Discutons",

  LINKEDIN: "Connectons-nous",
  INSTAGRAM: "Suivez mon actualite",
  FACEBOOK: "Ma page",
  TIKTOK: "Mes videos",
  X: "Mes publications",
  YOUTUBE: "Ma chaine",

  GITHUB: "Mon code",
  BEHANCE: "Mes projets",
  DRIBBBLE: "Mes visuels",
  PORTFOLIO: "Voir mes realisations",
  RESUME: "Telecharger mon CV",
  WEBSITE: "En savoir plus",

  SHOP: "Decouvrir la boutique",
  CATALOG: "Parcourir le catalogue",
  MENU: "Voir la carte",
  BOOKING: "Reserver un creneau",
  FORM: "Remplir le formulaire",
  PAYMENT: "Effectuer un paiement",

  MAPS: "Ouvrir l itineraire",
};
