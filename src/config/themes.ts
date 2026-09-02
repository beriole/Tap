import type { ThemeKey } from "@/types/profile";

/** Medias reellement exploites par le rendu d un theme. */
export type ThemeMedia = "avatar" | "cover" | "logo";

export type ThemeDefinition = {
  key: ThemeKey;
  code: string;
  name: string;
  direction: string;
  target: string;
  defaultAccent: string;
  defaultMode: "LIGHT" | "DARK" | "AUTO";
  variants: string[];
  /**
   * Ce que le theme affiche vraiment. Sert a prevenir le client avant qu il ne
   * televerse une couverture pour un theme qui n en montre aucune - c est
   * exactement le piege dans lequel on tombait.
   */
  uses: ThemeMedia[];
  /** P0 du MVP : 4 themes premium reellement distincts (§18). */
  mvp: boolean;
};

/**
 * §6.1 - Systeme de themes. Chaque entree correspond a un composant de rendu
 * independant enregistre dans components/themes/registry.ts.
 */
export const THEMES: ThemeDefinition[] = [
  {
    key: "minimal",
    code: "01",
    name: "Minimal",
    direction: "Fond clair, typographie genereuse, photo ronde, boutons fins, beaucoup d espace.",
    target: "Consultants, etudiants, developpeurs.",
    defaultAccent: "#111827",
    defaultMode: "LIGHT",
    variants: ["centre", "aligne-gauche"],
    uses: ["avatar"],
    mvp: true,
  },
  {
    key: "executive",
    code: "02",
    name: "Executive",
    direction: "Bleu nuit/noir, accents metalliques subtils, portrait cadre, CTA premium.",
    target: "Dirigeants, managers, avocats.",
    defaultAccent: "#B08D57",
    defaultMode: "DARK",
    variants: ["nuit", "encre"],
    uses: ["avatar", "cover"],
    mvp: true,
  },
  {
    key: "creator",
    code: "03",
    name: "Creator",
    direction: "Couleurs expressives, grande couverture, blocs medias, micro-animations.",
    target: "Createurs, artistes, influenceurs.",
    defaultAccent: "#E11D48",
    defaultMode: "LIGHT",
    variants: ["vif", "pastel"],
    uses: ["avatar", "cover"],
    mvp: true,
  },
  {
    key: "tech",
    code: "04",
    name: "Tech",
    direction: "Dark mode, gradients controles, lignes lumineuses, GitHub/portfolio mis en avant.",
    target: "Developpeurs, startups.",
    defaultAccent: "#22D3EE",
    defaultMode: "DARK",
    variants: ["neon", "terminal"],
    uses: ["avatar", "logo"],
    mvp: true,
  },
  {
    key: "luxury",
    code: "05",
    name: "Luxury",
    direction: "Noir/ivoire, typographie editoriale, details dores sobres, tres peu d elements.",
    target: "Marques premium, immobilier, mode.",
    defaultAccent: "#C9A227",
    defaultMode: "DARK",
    variants: ["ivoire", "onyx"],
    uses: ["avatar"],
    mvp: false,
  },
  {
    key: "business",
    code: "06",
    name: "Business",
    direction: "Logo et entreprise prioritaires, coordonnees, localisation et services visibles immediatement.",
    target: "PME, commerces, commerciaux.",
    defaultAccent: "#1D4ED8",
    defaultMode: "LIGHT",
    variants: ["corporate", "service"],
    uses: ["avatar", "logo"],
    mvp: false,
  },
  {
    key: "photo",
    code: "07",
    name: "Photo",
    direction: "Portrait ou image plein ecran avec panneau flottant semi-transparent.",
    target: "Photographes, modeles, creatifs.",
    defaultAccent: "#FFFFFF",
    defaultMode: "DARK",
    variants: ["plein-ecran", "panneau-bas"],
    uses: ["avatar", "cover"],
    mvp: false,
  },
  {
    key: "compact",
    code: "08",
    name: "Compact",
    direction: "Profil ultra-rapide, boutons essentiels visibles sans defilement initial.",
    target: "Usage universel / connexion lente.",
    defaultAccent: "#0F172A",
    defaultMode: "LIGHT",
    variants: ["dense"],
    uses: ["avatar"],
    mvp: false,
  },
  {
    key: "aurora",
    code: "09",
    name: "Aurora",
    direction:
      "Carte de verre posee sur un champ de couleur qui derive lentement. Effet immediat au scan.",
    target: "Usage universel haut de gamme.",
    defaultAccent: "#6366F1",
    defaultMode: "DARK",
    variants: ["indigo", "emeraude", "magenta"],
    uses: ["avatar", "cover"],
    mvp: false,
  },
  {
    key: "carbone",
    code: "10",
    name: "Carbone",
    direction:
      "Metal brosse, typographie gravee, filets d un cheveu, numero de carte marque au dos.",
    target: "Marques premium, cartes metal, immobilier de prestige.",
    defaultAccent: "#C8A96A",
    defaultMode: "DARK",
    variants: ["graphite", "titane"],
    uses: ["avatar"],
    mvp: false,
  },
  {
    key: "signal",
    code: "11",
    name: "Signal",
    direction:
      "Bandeau organique colore, portrait rond en debord, pilules aux couleurs des services, QR dans la page.",
    target: "Commerciaux, formateurs, profils grand public.",
    defaultAccent: "#EA580C",
    defaultMode: "LIGHT",
    variants: ["ambre", "corail"],
    uses: ["avatar"],
    mvp: false,
  },
  {
    key: "editorial",
    code: "12",
    name: "Editorial",
    direction:
      "Noir et blanc, photo carree, rail vertical de reseaux, nom en capitales interlettrees, coordonnees en tableau.",
    target: "Immobilier, courtage, professions de confiance.",
    defaultAccent: "#111827",
    defaultMode: "LIGHT",
    variants: ["ivoire"],
    uses: ["avatar"],
    mvp: false,
  },
  {
    key: "hub",
    code: "13",
    name: "Hub",
    direction:
      "Couverture, portrait en debord, actions rondes, panneau Mes liens en grille d applications colorees.",
    target: "Createurs, community managers, profils a nombreux reseaux.",
    defaultAccent: "#7C3AED",
    defaultMode: "LIGHT",
    variants: ["clair"],
    uses: ["avatar", "cover"],
    mvp: false,
  },
  {
    key: "onyx",
    code: "14",
    name: "Onyx",
    direction:
      "Noir et or, portrait cercle, coordonnees en cadres fins, barre d enregistrement fixee sous le pouce.",
    target: "Consultants, avocats, courtiers, services haut de gamme.",
    defaultAccent: "#C8A96A",
    defaultMode: "DARK",
    variants: ["or", "cuivre"],
    uses: ["avatar", "cover"],
    mvp: false,
  },
  {
    key: "atelier",
    code: "15",
    name: "Atelier",
    direction:
      "En-tete sombre, feuille blanche remontee avec le QR loge dedans, bandeau d accent en pied.",
    target: "Agences, artisans, prestataires de service.",
    defaultAccent: "#F97316",
    defaultMode: "LIGHT",
    variants: ["orange", "brique"],
    uses: ["avatar", "cover", "logo"],
    mvp: false,
  },
];

export const THEME_KEYS = THEMES.map((t) => t.key);

export function getThemeDefinition(key: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.key === key);
}

/** §6.2 - palette encadree : l accent est choisi dans une liste validee en contraste. */
export const ACCENT_PALETTE = [
  "#111827", "#0F172A", "#1D4ED8", "#2563EB", "#0EA5E9", "#22D3EE",
  "#059669", "#16A34A", "#CA8A04", "#C9A227", "#B08D57", "#C8A96A",
  "#EA580C", "#F97316", "#DC2626", "#E11D48", "#DB2777", "#7C3AED", "#6366F1",
] as const;

export const FONT_PAIRS = [
  { key: "geist", label: "Geist / Geist", heading: "var(--font-sans)", body: "var(--font-sans)" },
  { key: "editorial", label: "Serif editorial / Sans", heading: "var(--font-serif)", body: "var(--font-sans)" },
  { key: "mono", label: "Mono technique / Sans", heading: "var(--font-mono)", body: "var(--font-sans)" },
] as const;
