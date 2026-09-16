/**
 * Catalogue des moteurs premium : Signature, Obsidian, Immersive.
 *
 * Un MOTEUR est une composition - sa grille, sa hierarchie, son traitement de
 * la photo, ses animations. Une VARIANTE n est qu un jeu de jetons pose dessus.
 * Douze apparences, trois architectures : on peut soigner chaque architecture
 * jusqu au detail au lieu d en entretenir douze a moitie.
 *
 * Ce module ne depend de rien : il est lu par le rendu serveur, par le studio
 * de design cote navigateur et par la validation de l API. Une variante
 * n existe qu ici.
 *
 * Ce que le client peut regler, et ce qu il ne peut pas : il choisit la
 * variante, l accent DANS la palette du moteur, la forme des boutons et le
 * cadrage de sa photo. Espacements, tailles, proportions, contrastes et
 * animations restent tenus par le moteur - c est ce qui garantit qu aucun
 * reglage ne peut casser le rendu.
 */

export type PremiumEngine = "signature" | "obsidian" | "immersive";

/** Jetons de surface d une variante. Tous les moteurs lisent les memes noms. */
export type VariantTokens = {
  /** Fond de page. */
  bg: string;
  /** Surface secondaire : panneau, bouton secondaire au repos. */
  surface: string;
  /** Texte principal. */
  ink: string;
  /** Texte secondaire : fonction, description. */
  ink2: string;
  /** Texte tertiaire : etiquettes, legendes. */
  ink3: string;
  /** Filet de separation. */
  line: string;
  /** Teinte d appui au toucher. */
  press: string;
  /** Accent par defaut de la variante. */
  accent: string;
  /** Fond du bouton principal et son texte. */
  ctaBg: string;
  ctaInk: string;
  scheme: "light" | "dark";
};

export type PremiumVariant = {
  key: string;
  name: string;
  /** Une ligne, pour le studio : ce que la variante evoque. */
  mood: string;
  tokens: VariantTokens;
};

export type PremiumEngineDefinition = {
  key: PremiumEngine;
  name: string;
  /** Les trois mots affiches sous l apercu dans le studio. */
  tags: [string, string, string];
  pitch: string;
  variants: PremiumVariant[];
  /** Accents autorises. Le premier est celui par defaut. */
  palette: string[];
  /** Forme par defaut des boutons pour ce moteur. */
  defaultShape: PremiumShape;
};

/**
 * Forme des boutons.
 *
 * Stockee dans ProfileTheme.customConfig et non dans la colonne buttonStyle :
 * cette colonne vaut SOLID par defaut, on ne pourrait donc jamais distinguer
 * une forme choisie d une forme jamais reglee - et chaque profil passant d un
 * ancien theme perdrait la forme propre au moteur.
 */
export type PremiumShape = "soft" | "pill" | "sharp";

export const SHAPES: { key: PremiumShape; label: string }[] = [
  { key: "soft", label: "Adoucie" },
  { key: "pill", label: "Pilule" },
  { key: "sharp", label: "Nette" },
];

/**
 * Cadrage vertical de la photo. Une photo prise en buste et un plan large ne
 * se recadrent pas pareil : le client choisit ou tombe le visage.
 */
export type PhotoFocus = "top" | "center" | "bottom";

export const PHOTO_POSITION: Record<PhotoFocus, string> = {
  top: "50% 22%",
  center: "50% 45%",
  bottom: "50% 72%",
};

export const PREMIUM_ENGINES: PremiumEngineDefinition[] = [
  {
    key: "signature",
    name: "Signature",
    tags: ["Minimal", "Professional", "Elegant"],
    pitch:
      "Une mise en page de papier a lettres : le nom compose sur deux lignes, le portrait a sa droite, et l espace pour tout le reste.",
    defaultShape: "soft",
    palette: ["#1C1B19", "#1E3A5F", "#2D5A47", "#7A4E2D", "#5A2E3E"],
    variants: [
      {
        key: "ivory",
        name: "Ivory",
        mood: "Papier ivoire, encre chaude",
        tokens: {
          bg: "#F6F3EC",
          surface: "#EDE8DF",
          ink: "#1C1B19",
          ink2: "#5E5A53",
          ink3: "#857F75",
          line: "rgba(28, 27, 25, 0.10)",
          press: "rgba(28, 27, 25, 0.05)",
          accent: "#1C1B19",
          ctaBg: "#1C1B19",
          ctaInk: "#F6F3EC",
          scheme: "light",
        },
      },
      {
        key: "pure",
        name: "Pure",
        mood: "Blanc net, gris doux",
        tokens: {
          bg: "#FFFFFF",
          surface: "#F2F2F4",
          ink: "#1D1D1F",
          ink2: "#5F5F64",
          ink3: "#86868B",
          line: "rgba(0, 0, 0, 0.08)",
          press: "rgba(0, 0, 0, 0.04)",
          accent: "#1D1D1F",
          ctaBg: "#1D1D1F",
          ctaInk: "#FFFFFF",
          scheme: "light",
        },
      },
      {
        key: "graphite",
        name: "Graphite",
        mood: "Sombre mat, texte perle",
        tokens: {
          bg: "#141416",
          surface: "#1E1E21",
          ink: "#F2F2F4",
          ink2: "#A5A5AB",
          ink3: "#6C6C72",
          line: "rgba(255, 255, 255, 0.09)",
          press: "rgba(255, 255, 255, 0.05)",
          accent: "#F2F2F4",
          ctaBg: "#F2F2F4",
          ctaInk: "#141416",
          scheme: "dark",
        },
      },
      {
        key: "forest",
        name: "Forest",
        mood: "Lin clair, vert profond",
        tokens: {
          bg: "#F1F1EA",
          surface: "#E6E7DD",
          ink: "#1D2922",
          ink2: "#56615A",
          ink3: "#78837A",
          line: "rgba(29, 41, 34, 0.11)",
          press: "rgba(29, 41, 34, 0.05)",
          accent: "#2D5A47",
          ctaBg: "#2D5A47",
          ctaInk: "#F1F1EA",
          scheme: "light",
        },
      },
    ],
  },
  {
    key: "obsidian",
    name: "Obsidian",
    tags: ["Luxury", "Executive", "Exclusive"],
    pitch:
      "Un portrait tire comme une epreuve, un nom en capitales d imprimerie fines, et presque rien d autre. L or n apparait que la ou il signale.",
    defaultShape: "sharp",
    palette: ["#C9A96E", "#D9D5CC", "#B4546A", "#9DB4D3"],
    variants: [
      {
        key: "champagne",
        name: "Champagne",
        mood: "Noir profond, filets champagne",
        tokens: {
          bg: "#08090A",
          surface: "#111214",
          ink: "#F7F4EE",
          ink2: "#A8A8A8",
          ink3: "#6B6B6B",
          line: "rgba(247, 244, 238, 0.09)",
          press: "rgba(247, 244, 238, 0.04)",
          accent: "#C9A96E",
          ctaBg: "#F7F4EE",
          ctaInk: "#08090A",
          scheme: "dark",
        },
      },
      {
        key: "platinum",
        name: "Platinum",
        mood: "Anthracite, reflets argent",
        tokens: {
          bg: "#0A0A0B",
          surface: "#141416",
          ink: "#F4F4F2",
          ink2: "#A3A3A3",
          ink3: "#666666",
          line: "rgba(244, 244, 242, 0.09)",
          press: "rgba(244, 244, 242, 0.04)",
          accent: "#D9D5CC",
          ctaBg: "#F4F4F2",
          ctaInk: "#0A0A0B",
          scheme: "dark",
        },
      },
      {
        key: "burgundy",
        name: "Burgundy",
        mood: "Noir chaud, pointe bordeaux",
        tokens: {
          bg: "#0B0809",
          surface: "#161012",
          ink: "#F6F0EC",
          ink2: "#AEA5A3",
          ink3: "#6E6563",
          line: "rgba(246, 240, 236, 0.09)",
          press: "rgba(246, 240, 236, 0.04)",
          accent: "#B4546A",
          ctaBg: "#F6F0EC",
          ctaInk: "#0B0809",
          scheme: "dark",
        },
      },
      {
        key: "midnight",
        name: "Midnight",
        mood: "Bleu nuit, acier clair",
        tokens: {
          bg: "#070A10",
          surface: "#0F141C",
          ink: "#F1F4F8",
          ink2: "#98A2B0",
          ink3: "#5D6674",
          line: "rgba(241, 244, 248, 0.09)",
          press: "rgba(241, 244, 248, 0.04)",
          accent: "#9DB4D3",
          ctaBg: "#F1F4F8",
          ctaInk: "#070A10",
          scheme: "dark",
        },
      },
    ],
  },
  {
    key: "immersive",
    name: "Immersive",
    tags: ["Visual", "Creative", "Bold"],
    pitch:
      "La photo est la page. Le nom se pose dessus, et un panneau flottant garde le contact a portee de pouce.",
    defaultShape: "pill",
    palette: ["#FFFFFF", "#F3E6D3", "#E7A48B", "#A9CBB7", "#141414"],
    variants: [
      {
        key: "glass",
        name: "Glass",
        mood: "Verre fume sur la photo",
        tokens: {
          bg: "#0D0D0F",
          surface: "rgba(22, 22, 24, 0.42)",
          ink: "#FFFFFF",
          ink2: "rgba(255, 255, 255, 0.74)",
          ink3: "rgba(255, 255, 255, 0.5)",
          line: "rgba(255, 255, 255, 0.14)",
          press: "rgba(255, 255, 255, 0.08)",
          accent: "#FFFFFF",
          ctaBg: "#FFFFFF",
          ctaInk: "#0D0D0F",
          scheme: "dark",
        },
      },
      {
        key: "editorial",
        name: "Editorial",
        mood: "Papier creme, encre dense",
        tokens: {
          bg: "#EFEAE2",
          surface: "#EFEAE2",
          ink: "#161412",
          ink2: "#5A544D",
          ink3: "#80786E",
          line: "rgba(22, 20, 18, 0.12)",
          press: "rgba(22, 20, 18, 0.05)",
          accent: "#161412",
          ctaBg: "#161412",
          ctaInk: "#EFEAE2",
          scheme: "light",
        },
      },
      {
        key: "dark",
        name: "Dark",
        mood: "Panneau plein, noir satine",
        tokens: {
          bg: "#0B0B0C",
          surface: "#161618",
          ink: "#F4F4F4",
          ink2: "#A8A8AC",
          ink3: "#6A6A6E",
          line: "rgba(255, 255, 255, 0.09)",
          press: "rgba(255, 255, 255, 0.05)",
          accent: "#F3E6D3",
          ctaBg: "#F3E6D3",
          ctaInk: "#0B0B0C",
          scheme: "dark",
        },
      },
      {
        key: "clean",
        name: "Clean",
        mood: "Blanc lumineux, net",
        tokens: {
          bg: "#FFFFFF",
          surface: "#FFFFFF",
          ink: "#111111",
          ink2: "#5C5C5F",
          ink3: "#86868A",
          line: "rgba(0, 0, 0, 0.08)",
          press: "rgba(0, 0, 0, 0.04)",
          accent: "#111111",
          ctaBg: "#111111",
          ctaInk: "#FFFFFF",
          scheme: "light",
        },
      },
    ],
  },
];

export const PREMIUM_KEYS = PREMIUM_ENGINES.map((e) => e.key);

export function isPremiumEngine(key: string): key is PremiumEngine {
  return (PREMIUM_KEYS as string[]).includes(key);
}

export function getEngine(key: string): PremiumEngineDefinition | undefined {
  return PREMIUM_ENGINES.find((e) => e.key === key);
}

/**
 * Resout les reglages effectifs d un profil sur un moteur.
 *
 * Toute valeur hors catalogue retombe sur la valeur par defaut du moteur : un
 * profil mal enregistre, ou venu d un ancien theme, s affiche quand meme
 * correctement - jamais une page cassee au moment d un scan.
 *
 * Reglages lus dans customConfig : { accent, shape, photo }.
 */
export function resolveEngineSettings(
  engineKey: PremiumEngine,
  input: { variant?: string | null; customConfig?: Record<string, unknown> | null },
) {
  const engine = getEngine(engineKey) ?? PREMIUM_ENGINES[0];
  const variant = engine.variants.find((v) => v.key === input.variant) ?? engine.variants[0];
  const config = input.customConfig ?? {};

  // L accent n est retenu que s il appartient a la palette du moteur : un
  // accent herite d un ancien theme ne doit pas teindre un design qui n a pas
  // ete pense pour lui.
  const rawAccent = typeof config.accent === "string" ? config.accent.toUpperCase() : null;
  const accent = rawAccent && engine.palette.includes(rawAccent) ? rawAccent : variant.tokens.accent;

  const shape: PremiumShape =
    config.shape === "soft" || config.shape === "pill" || config.shape === "sharp"
      ? config.shape
      : engine.defaultShape;

  const focus: PhotoFocus =
    config.photo === "top" || config.photo === "center" || config.photo === "bottom"
      ? config.photo
      : "top";

  return { engine, variant, accent, shape, focus };
}
