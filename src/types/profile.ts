import type {
  ButtonStyle,
  CardStatus,
  ClickAction,
  LinkType,
  ThemeMode,
} from "@prisma/client";

/**
 * Objet de donnees normalise transmis a TOUS les themes (§17).
 * Aucun theme ne doit interroger la base : le rendu ne depend que de ce contrat.
 */
export type PublicProfile = {
  id: string;
  cardToken: string;
  canonicalUrl: string;
  /** §13 - indexation configurable par le client. */
  seoIndexable: boolean;

  identity: {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    company: string | null;
    tagline: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    logoUrl: string | null;
  };

  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
  };

  location: {
    address: string | null;
    city: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    mapUrl: string | null;
  };

  presentation: {
    introText: string | null;
    availability: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
  };

  links: PublicLink[];
  theme: ResolvedTheme;
};

export type PublicLink = {
  id: string;
  type: LinkType;
  label: string;
  /** Sous-titre des themes en pilules ; retombe sur LINK_SUBTITLES si vide. */
  description: string | null;
  /** href final deja normalise et valide cote serveur */
  href: string;
  icon: string | null;
  color: string | null;
  style: ButtonStyle | null;
};

export type ResolvedTheme = {
  key: ThemeKey;
  accentColor: string;
  mode: ThemeMode;
  variant: string | null;
  fontPair: string | null;
  buttonStyle: ButtonStyle;
  customConfig: Record<string, unknown>;
};

export type ThemeKey =
  | "minimal"
  | "executive"
  | "creator"
  | "tech"
  | "luxury"
  | "business"
  | "photo"
  | "compact"
  | "aurora"
  | "carbone"
  | "signal"
  | "editorial"
  | "hub"
  | "onyx"
  | "atelier";

export type ThemeProps = {
  profile: PublicProfile;
  /** true dans l'apercu temps reel du dashboard : desactive le tracking */
  preview?: boolean;
};

export type CardResolution =
  | { ok: true; profile: PublicProfile; cardId: string }
  | { ok: false; reason: "NOT_FOUND" | "UNASSIGNED" | "SUSPENDED" | "UNPUBLISHED"; status: CardStatus | null };

export type TrackableAction = ClickAction;
