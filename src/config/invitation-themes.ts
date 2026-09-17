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

export type InvitationThemeKey = "royal-ivory";

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
