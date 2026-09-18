import { z } from "zod";

/**
 * Catalogue des themes d invitation (cahier Invitations §13, plan phase 3).
 *
 * Meme regle que pour les cartes : l organisateur personnalise, il ne casse
 * pas. Les reglages sont une enumeration FERMEE par theme - variante, accent,
 * quelques options - revalidee cote serveur. Grille, tailles, espacements et
 * contrastes restent tenus par le theme.
 *
 * Sans "use client" ni "server-only" : lu par le studio (navigateur) comme
 * par le rendu (serveur).
 */

export type InvitationThemeKey = "royal-ivory" | "midnight-gold" | "botanical" | "editorial" | "african-luxury";

export type ThemeSwatch = {
  key: string;
  label: string;
  /** Apercu dans le studio */
  swatch: string;
};

export type InvitationThemeDefinition = {
  key: InvitationThemeKey;
  name: string;
  collection: "WEDDING" | "BIRTHDAY" | "CORPORATE" | "MEMORIAL";
  direction: string;
  variants: readonly ThemeSwatch[];
  accents: readonly ThemeSwatch[];
  settingsSchema: z.ZodType<InvitationThemeSettings>;
  defaults: InvitationThemeSettings;
};

export type InvitationThemeSettings = {
  variant: string;
  accent: string;
  /** "Dans 86 jours" sous la date */
  countdown: boolean;
};

const royalIvoryVariants = [
  { key: "ivoire", label: "Ivoire", swatch: "#F6F0E4" },
  { key: "nuit", label: "Nuit", swatch: "#1D1916" },
] as const;

const royalIvoryAccents = [
  { key: "champagne", label: "Champagne", swatch: "#B08D57" },
  { key: "poudre", label: "Rose poudre", swatch: "#B98A86" },
  { key: "sauge", label: "Sauge", swatch: "#8C9A7B" },
] as const;

const keysOf = (list: readonly ThemeSwatch[]) => list.map((i) => i.key) as [string, ...string[]];

/** Tous les themes partagent aujourd hui les memes reglages : variante, accent, compte a rebours. */
function define(
  key: InvitationThemeKey,
  name: string,
  direction: string,
  variants: readonly ThemeSwatch[],
  accents: readonly ThemeSwatch[],
): InvitationThemeDefinition {
  return {
    key,
    name,
    collection: "WEDDING",
    direction,
    variants,
    accents,
    settingsSchema: z.object({ variant: z.enum(keysOf(variants)), accent: z.enum(keysOf(accents)), countdown: z.boolean() }),
    defaults: { variant: variants[0]!.key, accent: accents[0]!.key, countdown: true },
  };
}

export const INVITATION_THEMES: Record<InvitationThemeKey, InvitationThemeDefinition> = {
  "royal-ivory": {
    key: "royal-ivory",
    name: "Royal Ivory",
    collection: "WEDDING",
    direction: "Papeterie gravee : ivoire, serif didone, date en cartouche, details champagne.",
    variants: royalIvoryVariants,
    accents: royalIvoryAccents,
    settingsSchema: z.object({
      variant: z.enum(keysOf(royalIvoryVariants)),
      accent: z.enum(keysOf(royalIvoryAccents)),
      countdown: z.boolean(),
    }),
    defaults: { variant: "ivoire", accent: "champagne", countdown: true },
  },
  "midnight-gold": define(
    "midnight-gold",
    "Midnight Gold",
    "Carton de gala : nuit profonde, double filet d or, monogramme en sceau, sections en chiffres romains.",
    [
      { key: "minuit", label: "Minuit", swatch: "#0F1521" },
      { key: "encre", label: "Encre", swatch: "#121212" },
      { key: "emeraude", label: "Emeraude", swatch: "#0E221E" },
    ],
    [
      { key: "or", label: "Or", swatch: "#C9A75A" },
      { key: "cuivre", label: "Cuivre", swatch: "#C1845A" },
      { key: "argent", label: "Argent", swatch: "#B9BDC6" },
    ],
  ),
  botanical: define(
    "botanical",
    "Botanical",
    "Jardin de papier : photo en arche, serif douce, feuillages dessines, cartes arrondies.",
    [
      { key: "creme", label: "Creme", swatch: "#F7F3EA" },
      { key: "mousse", label: "Mousse", swatch: "#1F2A22" },
    ],
    [
      { key: "olive", label: "Olive", swatch: "#6E7F4E" },
      { key: "terracotta", label: "Terracotta", swatch: "#B8664A" },
      { key: "lavande", label: "Lavande", swatch: "#7C6F9E" },
    ],
  ),
  editorial: define(
    "editorial",
    "Editorial",
    "Couverture de magazine : prenoms en serif geante, tout a gauche, filets noirs, sections 01 02 03.",
    [
      { key: "blanc", label: "Blanc", swatch: "#FAFAF7" },
      { key: "noir", label: "Noir", swatch: "#111111" },
    ],
    [
      { key: "rouge", label: "Rouge", swatch: "#D93A2B" },
      { key: "cobalt", label: "Cobalt", swatch: "#2A48D9" },
      { key: "citron", label: "Citron", swatch: "#E5D400" },
    ],
  ),
  "african-luxury": define(
    "african-luxury",
    "African Luxury",
    "Etoffe tissee : bandes a motifs geometriques, medaillon, terre cuite et ocre, serif ronde.",
    [
      { key: "terre", label: "Terre", swatch: "#F6E9D6" },
      { key: "ebene", label: "Ebene", swatch: "#1B120D" },
    ],
    [
      { key: "ocre", label: "Ocre", swatch: "#C0782E" },
      { key: "indigo", label: "Indigo", swatch: "#2E3F8F" },
      { key: "cuivre", label: "Cuivre", swatch: "#A8543A" },
    ],
  ),
};

export function getInvitationTheme(key: string | null | undefined): InvitationThemeDefinition {
  return INVITATION_THEMES[key as InvitationThemeKey] ?? INVITATION_THEMES["royal-ivory"];
}

/**
 * Reglages effectifs : chaque champ valide est garde, chaque champ invalide
 * ou absent retombe sur la valeur du theme. Un reglage d un ancien theme, ou
 * trafique, ne peut donc jamais produire une page cassee.
 */
export function resolveThemeSettings(key: string | null | undefined, raw: unknown): InvitationThemeSettings {
  const theme = getInvitationTheme(key);
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...theme.defaults };
  for (const field of Object.keys(out) as (keyof InvitationThemeSettings)[]) {
    const candidate = { ...out, [field]: input[field] };
    if (theme.settingsSchema.safeParse(candidate).success) (out as Record<string, unknown>)[field] = input[field];
  }
  return out;
}
