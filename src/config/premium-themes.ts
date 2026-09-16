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

export type PremiumEngine =
  | "signature"
  | "obsidian"
  | "immersive"
  | "swiss"
  | "journal"
  | "carte"
  | "serene"
  | "block"
  | "terminal"
  | "table"
  | "instant"
  | "corporate";

/** Familles affichees en filtre dans le studio : douze designs se choisissent mieux par intention. */
export type EngineFamily = "professionnel" | "prestige" | "creatif" | "accueil" | "tech";

export const FAMILIES: { key: EngineFamily; label: string }[] = [
  { key: "professionnel", label: "Professionnel" },
  { key: "prestige", label: "Prestige" },
  { key: "creatif", label: "Créatif" },
  { key: "accueil", label: "Commerce et bien-être" },
  { key: "tech", label: "Tech" },
];

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
  /**
   * Couleurs propres a une composition : la carte physique de Carte, le bloc
   * de Block, le bandeau de Corporate. Exposees en --pc-x-<nom>.
   */
  extra?: Record<string, string>;
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
  family: EngineFamily;
  /** Pour qui ce design a ete compose. */
  audience: string;
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
    family: "professionnel",
    audience: "Consultants, avocats, cadres, professions libérales",
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
    family: "prestige",
    audience: "Dirigeants, immobilier premium, marques de luxe",
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
    family: "creatif",
    audience: "Photographes, créateurs, artistes, mannequins",
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
  {
    key: "swiss",
    name: "Swiss",
    family: "professionnel",
    audience: "Architectes, designers, agences, ingénieurs",
    tags: ["Grid", "Typographic", "Precise"],
    pitch:
      "Une affiche suisse : un nom immense ferme par un point de couleur, une fiche technique en deux colonnes, une photo en noir et blanc.",
    defaultShape: "sharp",
    palette: ["#E1251B", "#1F4BFF", "#111111", "#FF8A00"],
    variants: [
      {
        key: "paper",
        name: "Paper",
        mood: "Papier blanc, point rouge",
        tokens: {
          bg: "#F4F4F1",
          surface: "#E9E9E4",
          ink: "#111111",
          ink2: "#555552",
          ink3: "#838380",
          line: "rgba(17, 17, 17, 0.12)",
          press: "rgba(17, 17, 17, 0.05)",
          accent: "#E1251B",
          ctaBg: "#E1251B",
          ctaInk: "#FFFFFF",
          scheme: "light"
        },
      },
      {
        key: "ink",
        name: "Ink",
        mood: "Noir encre, point vermillon",
        tokens: {
          bg: "#0E0E0E",
          surface: "#1A1A1A",
          ink: "#F2F2F0",
          ink2: "#A6A6A2",
          ink3: "#6E6E6B",
          line: "rgba(242, 242, 240, 0.12)",
          press: "rgba(242, 242, 240, 0.05)",
          accent: "#FF4B3E",
          ctaBg: "#FF4B3E",
          ctaInk: "#0E0E0E",
          scheme: "dark"
        },
      },
    ],
  },
  {
    key: "journal",
    name: "Journal",
    family: "prestige",
    audience: "Auteurs, journalistes, conférenciers, conseils",
    tags: ["Editorial", "Narrative", "Literary"],
    pitch:
      "Une une de magazine : le nom en manchette, le portrait en photo d ouverture avec sa legende, une lettrine et un sommaire.",
    defaultShape: "sharp",
    palette: ["#9E2A1E", "#1F3A5F", "#1A1714", "#D9B26A"],
    variants: [
      {
        key: "newsprint",
        name: "Newsprint",
        mood: "Papier journal, encre brune",
        tokens: {
          bg: "#F3EEE3",
          surface: "#E8E1D2",
          ink: "#1A1714",
          ink2: "#57504A",
          ink3: "#857D74",
          line: "rgba(26, 23, 20, 0.12)",
          press: "rgba(26, 23, 20, 0.05)",
          accent: "#9E2A1E",
          ctaBg: "#1A1714",
          ctaInk: "#F3EEE3",
          scheme: "light"
        },
      },
      {
        key: "noir",
        name: "Noir",
        mood: "Edition du soir",
        tokens: {
          bg: "#121110",
          surface: "#1C1A18",
          ink: "#EDE6DA",
          ink2: "#A89F92",
          ink3: "#716A61",
          line: "rgba(237, 230, 218, 0.12)",
          press: "rgba(237, 230, 218, 0.05)",
          accent: "#D9B26A",
          ctaBg: "#EDE6DA",
          ctaInk: "#121110",
          scheme: "dark"
        },
      },
    ],
  },
  {
    key: "carte",
    name: "Carte",
    family: "professionnel",
    audience: "Entrepreneurs, commerciaux, fondateurs",
    tags: ["Tangible", "Signature", "Modern"],
    pitch:
      "La carte physique, reproduite en tete de page et sensible au toucher. Le reste de la page se range sous elle.",
    defaultShape: "soft",
    palette: ["#D7B98E", "#8FB3FF", "#E5E5E5", "#B9D8C2"],
    variants: [
      {
        key: "matte",
        name: "Matte",
        mood: "Carte noire mate sur lin clair",
        tokens: {
          bg: "#E9E7E2",
          surface: "#DEDBD4",
          ink: "#151515",
          ink2: "#56544F",
          ink3: "#84817B",
          line: "rgba(21, 21, 21, 0.12)",
          press: "rgba(21, 21, 21, 0.05)",
          accent: "#D7B98E",
          ctaBg: "#151515",
          ctaInk: "#F4F2EE",
          scheme: "light",
          extra: {
            card: "#141414",
            cardInk: "#F4F2EE",
            cardInk2: "rgba(244, 242, 238, 0.6)"
          }
        },
      },
      {
        key: "pearl",
        name: "Pearl",
        mood: "Carte nacree sur fond nuit",
        tokens: {
          bg: "#111214",
          surface: "#1B1C1F",
          ink: "#F2F1EE",
          ink2: "#A3A3A6",
          ink3: "#6F6F72",
          line: "rgba(242, 241, 238, 0.12)",
          press: "rgba(242, 241, 238, 0.05)",
          accent: "#8FB3FF",
          ctaBg: "#F2F1EE",
          ctaInk: "#111214",
          scheme: "dark",
          extra: {
            card: "#F3F1EC",
            cardInk: "#141414",
            cardInk2: "rgba(20, 20, 20, 0.58)"
          }
        },
      },
    ],
  },
  {
    key: "serene",
    name: "Serene",
    family: "accueil",
    audience: "Coachs, thérapeutes, beauté, bien-être",
    tags: ["Soft", "Calm", "Warm"],
    pitch:
      "Un portrait dans une arche, un nom en serif douce, des teintes poudrees : une page qui accueille avant de presenter.",
    defaultShape: "pill",
    palette: ["#A86B5B", "#5E7F66", "#8C6FA8", "#B98A4E"],
    variants: [
      {
        key: "blush",
        name: "Blush",
        mood: "Rose poudre, terre cuite",
        tokens: {
          bg: "#F7EFEA",
          surface: "#FFFFFF",
          ink: "#3A2E2A",
          ink2: "#6E5E58",
          ink3: "#95857E",
          line: "rgba(58, 46, 42, 0.12)",
          press: "rgba(58, 46, 42, 0.05)",
          accent: "#C98B7A",
          ctaBg: "#A86B5B",
          ctaInk: "#FFFFFF",
          scheme: "light"
        },
      },
      {
        key: "sage",
        name: "Sage",
        mood: "Vert sauge, lin",
        tokens: {
          bg: "#EEF1EA",
          surface: "#FFFFFF",
          ink: "#2F3A33",
          ink2: "#5E6B62",
          ink3: "#86918A",
          line: "rgba(47, 58, 51, 0.12)",
          press: "rgba(47, 58, 51, 0.05)",
          accent: "#7E9C86",
          ctaBg: "#5E7F66",
          ctaInk: "#FFFFFF",
          scheme: "light"
        },
      },
    ],
  },
  {
    key: "block",
    name: "Block",
    family: "creatif",
    audience: "Agences, architectes, sport, marques, événementiel",
    tags: ["Bold", "Graphic", "Architectural"],
    pitch:
      "Une photo bichrome coupee net par un aplat de couleur, et un nom en capitales condensees qui chevauche la frontiere.",
    defaultShape: "sharp",
    palette: ["#C8553D", "#2F4BFF", "#1F7A5A", "#111111"],
    variants: [
      {
        key: "clay",
        name: "Clay",
        mood: "Terre cuite sur papier",
        tokens: {
          bg: "#EDE6DC",
          surface: "#E2D9CC",
          ink: "#1B1714",
          ink2: "#5A524B",
          ink3: "#877E73",
          line: "rgba(27, 23, 20, 0.12)",
          press: "rgba(27, 23, 20, 0.05)",
          accent: "#C8553D",
          ctaBg: "#F6EFE6",
          ctaInk: "#1B1714",
          scheme: "light",
          extra: {
            block: "#C8553D",
            blockInk: "#F6EFE6"
          }
        },
      },
      {
        key: "cobalt",
        name: "Cobalt",
        mood: "Bleu cobalt sur nuit",
        tokens: {
          bg: "#0F1115",
          surface: "#181B21",
          ink: "#F1F1F1",
          ink2: "#A4A7AD",
          ink3: "#6D7178",
          line: "rgba(241, 241, 241, 0.12)",
          press: "rgba(241, 241, 241, 0.05)",
          accent: "#2F4BFF",
          ctaBg: "#FFFFFF",
          ctaInk: "#0F1115",
          scheme: "dark",
          extra: {
            block: "#2F4BFF",
            blockInk: "#FFFFFF"
          }
        },
      },
    ],
  },
  {
    key: "terminal",
    name: "Terminal",
    family: "tech",
    audience: "Développeurs, startups, data, sécurité",
    tags: ["Tech", "Precise", "Developer"],
    pitch:
      "La precision d un editeur de code, sans le deguisement : une invite, une fiche en cles et valeurs, des liens lisibles comme des chemins.",
    defaultShape: "soft",
    palette: ["#7EE787", "#79C0FF", "#D2A8FF", "#FFA657"],
    variants: [
      {
        key: "night",
        name: "Night",
        mood: "Nuit profonde, vert doux",
        tokens: {
          bg: "#0B0D10",
          surface: "#12161B",
          ink: "#E6EDF3",
          ink2: "#9BA7B4",
          ink3: "#687382",
          line: "rgba(230, 237, 243, 0.12)",
          press: "rgba(230, 237, 243, 0.05)",
          accent: "#7EE787",
          ctaBg: "#E6EDF3",
          ctaInk: "#0B0D10",
          scheme: "dark"
        },
      },
      {
        key: "paper",
        name: "Paper",
        mood: "Papier clair, encre verte",
        tokens: {
          bg: "#FAF9F6",
          surface: "#F0EEE8",
          ink: "#1F2328",
          ink2: "#57606A",
          ink3: "#848D97",
          line: "rgba(31, 35, 40, 0.12)",
          press: "rgba(31, 35, 40, 0.05)",
          accent: "#0A7F5A",
          ctaBg: "#1F2328",
          ctaInk: "#FAF9F6",
          scheme: "light"
        },
      },
    ],
  },
  {
    key: "table",
    name: "Table",
    family: "accueil",
    audience: "Restaurants, cafés, hôtels, boutiques, salons",
    tags: ["Hospitality", "Warm", "Inviting"],
    pitch:
      "Une devanture : la photo du lieu en banniere, l enseigne posee dessus, les horaires, et un geste pour venir ou reserver.",
    defaultShape: "soft",
    palette: ["#5B6B3A", "#D39B6A", "#8C3B2E", "#2F5D62"],
    variants: [
      {
        key: "olive",
        name: "Olive",
        mood: "Lin chaud, vert olive",
        tokens: {
          bg: "#F5F1E8",
          surface: "#EAE4D6",
          ink: "#22261E",
          ink2: "#5C6253",
          ink3: "#868A7C",
          line: "rgba(34, 38, 30, 0.12)",
          press: "rgba(34, 38, 30, 0.05)",
          accent: "#5B6B3A",
          ctaBg: "#22261E",
          ctaInk: "#F5F1E8",
          scheme: "light"
        },
      },
      {
        key: "bordeaux",
        name: "Bordeaux",
        mood: "Salle du soir, cuivre",
        tokens: {
          bg: "#1C1414",
          surface: "#2A1E1E",
          ink: "#F4EAE0",
          ink2: "#B8A79A",
          ink3: "#806F65",
          line: "rgba(244, 234, 224, 0.12)",
          press: "rgba(244, 234, 224, 0.05)",
          accent: "#D39B6A",
          ctaBg: "#F4EAE0",
          ctaInk: "#1C1414",
          scheme: "dark"
        },
      },
    ],
  },
  {
    key: "instant",
    name: "Instant",
    family: "creatif",
    audience: "Créateurs de contenu, influenceurs, artistes, étudiants",
    tags: ["Playful", "Personal", "Warm"],
    pitch:
      "Un tirage instantane pose de travers, legende a la main : une presentation qui ressemble a une rencontre plutot qu a un CV.",
    defaultShape: "soft",
    palette: ["#E2553B", "#F2B544", "#3E7CB1", "#1E1B18"],
    variants: [
      {
        key: "film",
        name: "Film",
        mood: "Papier creme, pellicule",
        tokens: {
          bg: "#EFE9DF",
          surface: "#FFFFFF",
          ink: "#1E1B18",
          ink2: "#5B554E",
          ink3: "#88817A",
          line: "rgba(30, 27, 24, 0.12)",
          press: "rgba(30, 27, 24, 0.05)",
          accent: "#E2553B",
          ctaBg: "#1E1B18",
          ctaInk: "#EFE9DF",
          scheme: "light"
        },
      },
      {
        key: "night",
        name: "Night",
        mood: "Chambre noire",
        tokens: {
          bg: "#141312",
          surface: "#F7F3EC",
          ink: "#F2EDE4",
          ink2: "#ADA597",
          ink3: "#766F66",
          line: "rgba(242, 237, 228, 0.12)",
          press: "rgba(242, 237, 228, 0.05)",
          accent: "#F2B544",
          ctaBg: "#F2EDE4",
          ctaInk: "#141312",
          scheme: "dark"
        },
      },
    ],
  },
  {
    key: "corporate",
    name: "Corporate",
    family: "professionnel",
    audience: "Entreprises, équipes commerciales, banques, institutions",
    tags: ["Structured", "Trustworthy", "Clear"],
    pitch:
      "L entreprise d abord : son bandeau, puis une fiche nette ou chaque coordonnee se lit, et un QR pour se passer le contact en face a face.",
    defaultShape: "soft",
    palette: ["#1F6FEB", "#0E9F6E", "#B42318", "#6D28D9"],
    variants: [
      {
        key: "navy",
        name: "Navy",
        mood: "Bleu marine institutionnel",
        tokens: {
          bg: "#F4F6F9",
          surface: "#FFFFFF",
          ink: "#0F1B2D",
          ink2: "#4A5568",
          ink3: "#7A8594",
          line: "rgba(15, 27, 45, 0.12)",
          press: "rgba(15, 27, 45, 0.05)",
          accent: "#1F6FEB",
          ctaBg: "#1F6FEB",
          ctaInk: "#FFFFFF",
          scheme: "light",
          extra: {
            band: "#0F2A4A",
            bandInk: "#FFFFFF"
          }
        },
      },
      {
        key: "slate",
        name: "Slate",
        mood: "Ardoise et vert",
        tokens: {
          bg: "#F5F5F4",
          surface: "#FFFFFF",
          ink: "#1B1F24",
          ink2: "#4B5563",
          ink3: "#7C828B",
          line: "rgba(27, 31, 36, 0.12)",
          press: "rgba(27, 31, 36, 0.05)",
          accent: "#0E9F6E",
          ctaBg: "#1B1F24",
          ctaInk: "#FFFFFF",
          scheme: "light",
          extra: {
            band: "#1F2933",
            bandInk: "#FFFFFF"
          }
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
