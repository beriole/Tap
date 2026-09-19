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

export type InvitationThemeKey =
  // Mariage
  | "royal-ivory"
  | "midnight-gold"
  | "botanical"
  | "editorial"
  | "pearl"
  | "african-luxury"
  | "romantic"
  | "modern-glass"
  // Anniversaire
  | "party"
  | "kids"
  | "elegant"
  | "neon"
  | "minimal"
  // Corporate
  | "executive"
  | "conference"
  | "gala"
  | "launch"
  // Memorial
  | "serenity"
  | "classic"
  | "light";

export type InvitationCollection = "WEDDING" | "BIRTHDAY" | "CORPORATE" | "MEMORIAL";

export const COLLECTION_LABELS: Record<InvitationCollection, string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Corporate",
  MEMORIAL: "Memorial",
};

/** Collection proposee en premier selon le type d evenement ; OTHER pioche dans Anniversaire. */
export function collectionFor(type: string): InvitationCollection {
  return type === "WEDDING" || type === "BIRTHDAY" || type === "CORPORATE" || type === "MEMORIAL" ? type : "BIRTHDAY";
}

/** Theme d un evenement qui vient d etre cree : le theme de base (offre Essentiel) de sa collection. */
export function defaultThemeFor(type: string): InvitationThemeKey {
  const byCollection: Record<InvitationCollection, InvitationThemeKey> = { WEDDING: "royal-ivory", BIRTHDAY: "minimal", CORPORATE: "executive", MEMORIAL: "serenity" };
  return byCollection[collectionFor(type)];
}

export type ThemeSwatch = {
  key: string;
  label: string;
  /** Apercu dans le studio */
  swatch: string;
};

export type InvitationThemeDefinition = {
  key: InvitationThemeKey;
  name: string;
  collection: InvitationCollection;
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

const keysOf = (list: readonly ThemeSwatch[]) => list.map((i) => i.key) as [string, ...string[]];

/** Tous les themes partagent les memes reglages : variante, accent, compte a rebours. */
function define(
  key: InvitationThemeKey,
  name: string,
  collection: InvitationCollection,
  direction: string,
  variants: readonly ThemeSwatch[],
  accents: readonly ThemeSwatch[],
): InvitationThemeDefinition {
  return {
    key,
    name,
    collection,
    direction,
    variants,
    accents,
    settingsSchema: z.object({ variant: z.enum(keysOf(variants)), accent: z.enum(keysOf(accents)), countdown: z.boolean() }),
    defaults: { variant: variants[0]!.key, accent: accents[0]!.key, countdown: true },
  };
}

const sw = (key: string, label: string, swatch: string): ThemeSwatch => ({ key, label, swatch });

export const INVITATION_THEMES: Record<InvitationThemeKey, InvitationThemeDefinition> = {
  // ------------------------------------------------------------------ Mariage
  "royal-ivory": define(
    "royal-ivory",
    "Royal Ivory",
    "WEDDING",
    "Papeterie gravee : ivoire, serif didone, date en cartouche, details champagne.",
    [sw("ivoire", "Ivoire", "#F6F0E4"), sw("nuit", "Nuit", "#1D1916")],
    [sw("champagne", "Champagne", "#B08D57"), sw("poudre", "Rose poudre", "#B98A86"), sw("sauge", "Sauge", "#8C9A7B")],
  ),
  "midnight-gold": define(
    "midnight-gold",
    "Midnight Gold",
    "WEDDING",
    "Carton de gala : nuit profonde, double filet d or, monogramme en sceau, sections en chiffres romains.",
    [sw("minuit", "Minuit", "#0F1521"), sw("encre", "Encre", "#121212"), sw("emeraude", "Emeraude", "#0E221E")],
    [sw("or", "Or", "#C9A75A"), sw("cuivre", "Cuivre", "#C1845A"), sw("argent", "Argent", "#B9BDC6")],
  ),
  botanical: define(
    "botanical",
    "Botanical",
    "WEDDING",
    "Jardin de papier : photo en arche, serif douce, feuillages dessines, cartes arrondies.",
    [sw("creme", "Creme", "#F7F3EA"), sw("mousse", "Mousse", "#1F2A22")],
    [sw("olive", "Olive", "#5E6E40"), sw("terracotta", "Terracotta", "#A5573C"), sw("lavande", "Lavande", "#6B5F8E")],
  ),
  editorial: define(
    "editorial",
    "Editorial",
    "WEDDING",
    "Couverture de magazine : prenoms en serif geante, tout a gauche, filets noirs, sections 01 02 03.",
    [sw("blanc", "Blanc", "#FAFAF7"), sw("noir", "Noir", "#111111")],
    [sw("rouge", "Rouge", "#D93A2B"), sw("cobalt", "Cobalt", "#2A48D9"), sw("citron", "Citron", "#E5D400")],
  ),
  pearl: define(
    "pearl",
    "Pearl",
    "WEDDING",
    "Blanc chaud, gris perle, transparence legere : presque rien, tres bien place.",
    [sw("perle", "Perle", "#F7F5F1"), sw("brume", "Brume", "#E6E4DF")],
    [sw("argent", "Argent", "#8E8F93"), sw("rose", "Rose the", "#B48A86"), sw("bleu", "Bleu gris", "#7E8A98")],
  ),
  "african-luxury": define(
    "african-luxury",
    "African Luxury",
    "WEDDING",
    "Etoffe tissee : bandes a motifs geometriques, medaillon, terre cuite et ocre, serif ronde.",
    [sw("terre", "Terre", "#F6E9D6"), sw("ebene", "Ebene", "#1B120D")],
    [sw("ocre", "Ocre", "#C0782E"), sw("indigo", "Indigo", "#2E3F8F"), sw("cuivre", "Cuivre", "#A8543A")],
  ),
  romantic: define(
    "romantic",
    "Romantic",
    "WEDDING",
    "Tons poudres, un mot de calligraphie, floraux doux dessines au trait.",
    [sw("poudre", "Poudre", "#F8EEEA"), sw("bordeaux", "Bordeaux", "#3B1F26")],
    [sw("rose", "Rose", "#B25F6B"), sw("peche", "Peche", "#C4744F"), sw("mauve", "Mauve", "#8B6B93")],
  ),
  "modern-glass": define(
    "modern-glass",
    "Modern Glass",
    "WEDDING",
    "La photo en plein ecran, un panneau translucide, lumiere douce.",
    [sw("clair", "Clair", "#EEF0F3"), sw("sombre", "Sombre", "#14171C")],
    [sw("blanc", "Blanc", "#FFFFFF"), sw("sable", "Sable", "#D8C3A5"), sw("menthe", "Menthe", "#9ED5C5")],
  ),

  // ------------------------------------------------------------ Anniversaire
  party: define(
    "party",
    "Party",
    "BIRTHDAY",
    "Typographie expressive, confettis maitrises, un mouvement court.",
    [sw("blanc", "Blanc", "#FFFDF7"), sw("nuit", "Nuit", "#1B1530")],
    [sw("corail", "Corail", "#E0533F"), sw("soleil", "Soleil", "#E5A21B"), sw("violet", "Violet", "#6B4FD8")],
  ),
  kids: define(
    "kids",
    "Kids",
    "BIRTHDAY",
    "Formes rondes, couleurs joyeuses, lisible par le parent comme par l enfant.",
    [sw("ciel", "Ciel", "#EAF4FF"), sw("creme", "Creme", "#FFF6E5")],
    [sw("bleu", "Bleu", "#2F7BD9"), sw("vert", "Vert", "#2E9E6B"), sw("rose", "Rose", "#D9508A")],
  ),
  elegant: define(
    "elegant",
    "Elegant",
    "BIRTHDAY",
    "Le carton grave : age en chiffre dore, date en cartouche, encarts de papeterie.",
    [sw("lin", "Lin", "#F4F1EA"), sw("anthracite", "Anthracite", "#1E1F22")],
    [sw("bronze", "Bronze", "#8C6A3F"), sw("noir", "Noir", "#1E1F22"), sw("bordeaux", "Bordeaux", "#7A2E3B")],
  ),
  neon: define(
    "neon",
    "Neon",
    "BIRTHDAY",
    "Sombre, un accent neon controle : la lumiere sur les noms et l heure, pas partout.",
    [sw("noir", "Noir", "#0B0B10"), sw("marine", "Marine", "#0B1224")],
    [sw("cyan", "Cyan", "#3DF2E0"), sw("magenta", "Magenta", "#FF4FD8"), sw("lime", "Lime", "#C6FF4A")],
  ),
  minimal: define(
    "minimal",
    "Minimal",
    "BIRTHDAY",
    "Typographie et photo, presque aucune decoration.",
    [sw("blanc", "Blanc", "#FFFFFF"), sw("noir", "Noir", "#101010")],
    [sw("encre", "Encre", "#101010"), sw("brique", "Brique", "#B04A2F"), sw("ardoise", "Ardoise", "#3E5A73")],
  ),

  // --------------------------------------------------------------- Corporate
  executive: define(
    "executive",
    "Executive",
    "CORPORATE",
    "Grille stricte, identite de marque par la couleur, programme et appel a l action.",
    [sw("blanc", "Blanc", "#FFFFFF"), sw("graphite", "Graphite", "#17191D")],
    [sw("marine", "Marine", "#173B6C"), sw("vert", "Vert", "#1F6B4A"), sw("rouge", "Rouge", "#A32C2C")],
  ),
  conference: define(
    "conference",
    "Conference",
    "CORPORATE",
    "Agenda, intervenants, acces : l information d abord, en colonnes claires.",
    [sw("clair", "Clair", "#F5F6F8"), sw("sombre", "Sombre", "#0F172A")],
    [sw("bleu", "Bleu", "#2563EB"), sw("violet", "Violet", "#6D28D9"), sw("teal", "Teal", "#0F766E")],
  ),
  gala: define(
    "gala",
    "Gala",
    "CORPORATE",
    "Luxe sombre, ticket et QR, dress code : une soiree qu on prepare.",
    [sw("noir", "Noir", "#0E0C0B"), sw("prune", "Prune", "#1E1119")],
    [sw("or", "Or", "#D4B067"), sw("champagne", "Champagne", "#E4D2A6"), sw("argent", "Argent", "#C9CCD3")],
  ),
  launch: define(
    "launch",
    "Launch",
    "CORPORATE",
    "Produit en heros, moderne, dynamique : la date comme un compte a rebours.",
    [sw("blanc", "Blanc", "#FAFAFA"), sw("noir", "Noir", "#0A0A0A")],
    [sw("electrique", "Electrique", "#2B5CFF"), sw("orange", "Orange", "#C43E1B"), sw("vert", "Vert", "#0B7A4B")],
  ),

  // ---------------------------------------------------------------- Memorial
  serenity: define(
    "serenity",
    "Serenity",
    "MEMORIAL",
    "Tres sobre : de la lumiere, une photo, les informations essentielles.",
    [sw("aube", "Aube", "#F6F4F0"), sw("crepuscule", "Crepuscule", "#2A2C33")],
    [sw("gris", "Gris", "#6B6E75"), sw("olive", "Olive", "#6F7A5C"), sw("bleu", "Bleu", "#5C6F86")],
  ),
  classic: define(
    "classic",
    "Classic",
    "MEMORIAL",
    "Papeterie classique : serif, filets, tons neutres, un lisere noir.",
    [sw("ivoire", "Ivoire", "#F5F1E8"), sw("gris", "Gris", "#E9E7E2")],
    [sw("noir", "Noir", "#1A1A1A"), sw("sepia", "Sepia", "#6B5645"), sw("marine", "Marine", "#2E3A52")],
  ),
  light: define(
    "light",
    "Light",
    "MEMORIAL",
    "Blanc, gris doux, une photographie et un texte minimal.",
    [sw("blanc", "Blanc", "#FFFFFF"), sw("nuage", "Nuage", "#F1F2F4")],
    [sw("gris", "Gris", "#62656C"), sw("sable", "Sable", "#76664F"), sw("ciel", "Ciel", "#526C85")],
  ),
};

export function getInvitationTheme(key: string | null | undefined): InvitationThemeDefinition {
  return INVITATION_THEMES[key as InvitationThemeKey] ?? INVITATION_THEMES["royal-ivory"];
}

/** Themes d une collection, dans l ordre du catalogue. */
export function themesOf(collection: InvitationCollection): InvitationThemeDefinition[] {
  return Object.values(INVITATION_THEMES).filter((t) => t.collection === collection);
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
