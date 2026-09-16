import type { ClickAction, LinkType } from "@prisma/client";
import {
  PHOTO_POSITION,
  resolveEngineSettings,
  type PremiumEngine,
} from "@/config/premium-themes";
import { readableTextOn } from "@/lib/utils";
import type { PublicLink, PublicProfile } from "@/types/profile";

/**
 * Modele commun aux trois moteurs premium.
 *
 * `PublicProfile` reste le contrat unique venu de la base. Ce module en tire
 * une fois pour toutes ce dont une carte a besoin pour se composer : les
 * actions de contact, les liens ranges par nature, le lieu, les reglages du
 * moteur. Les trois themes consomment le meme objet - ils ne different que
 * par la maniere de le montrer.
 *
 * Pas de directive "use client" : les themes sont rendus cote serveur.
 */

export type QuickAction = {
  kind: "call" | "whatsapp" | "email";
  label: string;
  href: string;
  action: ClickAction;
  /** Identifiant du lien d origine, quand l action vient d un lien. */
  linkId: string | null;
  external: boolean;
};

export type LinkNature = "social" | "destination" | "place";

export type CardLink = PublicLink & {
  nature: LinkNature;
  /** Le domaine, ou le pseudo pour un reseau. */
  hint: string | null;
  /**
   * Ce qu on lit sous le libelle. La description saisie par le client ; a
   * defaut le domaine, s il distingue ce lien des autres ; a defaut encore la
   * nature du lien. Repeter trois fois le meme domaine sous trois liens
   * n informe de rien et encombre la liste.
   */
  detail: string | null;
  /** Nature lisible du lien : Reservation, Portfolio, Boutique... */
  kind: string;
  external: boolean;
};

const KIND_LABEL: Partial<Record<LinkType, string>> = {
  WEBSITE: "Site web",
  PORTFOLIO: "Portfolio",
  SHOP: "Boutique",
  CATALOG: "Catalogue",
  MENU: "Menu",
  BOOKING: "Réservation",
  FORM: "Formulaire",
  PAYMENT: "Paiement",
  RESUME: "CV",
  MAPS: "Itinéraire",
  CUSTOM: "Lien",
};

/**
 * Les reseaux se reconnaissent a leur icone : ils vont en rangee compacte.
 * Les destinations meritent une ligne avec un libelle. Le telephone, WhatsApp
 * et l e-mail ne sont PAS des liens pour le visiteur : ce sont des actions,
 * deja en haut de page - les repeter dans la liste la rallongerait sans rien
 * apporter.
 */
const SOCIAL: ReadonlySet<LinkType> = new Set<LinkType>([
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "TIKTOK",
  "X",
  "YOUTUBE",
  "GITHUB",
  "BEHANCE",
  "DRIBBBLE",
  "TELEGRAM",
  "MESSENGER",
]);

const CONTACT: ReadonlySet<LinkType> = new Set<LinkType>(["PHONE", "WHATSAPP", "EMAIL"]);

/** Destinations qu un moteur peut mettre en avant comme bloc media. */
const FEATURED: LinkType[] = ["BOOKING", "PORTFOLIO", "SHOP", "MENU", "CATALOG", "WEBSITE"];

function hintFor(link: PublicLink): string | null {
  if (!/^https?:\/\//i.test(link.href)) return null;
  try {
    const url = new URL(link.href);
    const host = url.hostname.replace(/^www\./, "");
    // Pour un reseau, le pseudo parle plus que le domaine.
    const path = url.pathname.replace(/\/+$/, "");
    if (SOCIAL.has(link.type) && path && path !== "/") {
      const handle = path.split("/").filter(Boolean).pop();
      return handle ? `@${handle.replace(/^@/, "")}` : host;
    }
    return host;
  } catch {
    return null;
  }
}

function splitName(profile: PublicProfile): [string, string | null] {
  const { firstName, lastName, displayName } = profile.identity;
  if (firstName && lastName) return [firstName, lastName];
  const parts = displayName.trim().split(/\s+/);
  if (parts.length < 2) return [displayName, null];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildCardModel(profile: PublicProfile, engine: PremiumEngine) {
  const settings = resolveEngineSettings(engine, {
    variant: profile.theme.variant,
    customConfig: profile.theme.customConfig,
  });

  const { contact, identity, location, presentation } = profile;
  const linkOfType = (type: LinkType) => profile.links.find((l) => l.type === type) ?? null;

  // Actions : les coordonnees du profil d abord, a defaut le lien du meme type.
  const actions: QuickAction[] = [];
  const phoneLink = linkOfType("PHONE");
  if (contact.phone || phoneLink) {
    actions.push({
      kind: "call",
      label: "Appeler",
      href: contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : phoneLink!.href,
      action: "CALL",
      linkId: contact.phone ? null : phoneLink!.id,
      external: false,
    });
  }
  const waLink = linkOfType("WHATSAPP");
  if (contact.whatsapp || waLink) {
    actions.push({
      kind: "whatsapp",
      label: "WhatsApp",
      href: contact.whatsapp
        ? `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`
        : waLink!.href,
      action: "WHATSAPP",
      linkId: contact.whatsapp ? null : waLink!.id,
      external: true,
    });
  }
  const mailLink = linkOfType("EMAIL");
  if (contact.email || mailLink) {
    actions.push({
      kind: "email",
      label: "E-mail",
      href: contact.email ? `mailto:${contact.email}` : mailLink!.href,
      action: "EMAIL",
      linkId: contact.email ? null : mailLink!.id,
      external: false,
    });
  }

  const links: CardLink[] = profile.links
    .filter((l) => !CONTACT.has(l.type))
    .map((l) => ({
      ...l,
      nature: (SOCIAL.has(l.type) ? "social" : l.type === "MAPS" ? "place" : "destination") as LinkNature,
      hint: hintFor(l),
      detail: null as string | null,
      kind: KIND_LABEL[l.type] ?? l.label,
      external: /^https?:\/\//i.test(l.href),
    }));

  // Le site du profil, s il n apparait pas deja parmi les liens, en devient un.
  if (
    contact.website &&
    !links.some((l) => l.type === "WEBSITE" || l.href.replace(/\/$/, "") === contact.website!.replace(/\/$/, ""))
  ) {
    const href = /^https?:\/\//i.test(contact.website) ? contact.website : `https://${contact.website}`;
    links.push({
      id: "profile-website",
      type: "WEBSITE",
      label: "Site web",
      description: null,
      href,
      icon: "Globe",
      color: null,
      style: null,
      nature: "destination",
      hint: hintFor({ href, type: "WEBSITE" } as PublicLink),
      detail: null,
      kind: "Site web",
      external: true,
    });
  }

  // Detail sous chaque lien : un domaine partage par plusieurs liens ne dit
  // rien de plus que le libelle, on montre alors la nature du lien.
  const hostCount = new Map<string, number>();
  for (const l of links) if (l.hint) hostCount.set(l.hint, (hostCount.get(l.hint) ?? 0) + 1);
  for (const l of links) {
    l.detail =
      l.description ?? (l.hint && hostCount.get(l.hint) === 1 ? l.hint : l.kind !== l.label ? l.kind : null);
  }

  const social = links.filter((l) => l.nature === "social");
  const destinations = links.filter((l) => l.nature === "destination");
  const featured =
    FEATURED.map((t) => destinations.find((d) => d.type === t)).find(Boolean) ?? null;

  const place = [location.address, location.city].filter(Boolean).join(", ") || null;
  const region = [location.city, location.country].filter(Boolean).join(", ") || null;
  const mapLink = links.find((l) => l.nature === "place") ?? null;
  const mapHref =
    location.mapUrl ??
    mapLink?.href ??
    (location.lat != null && location.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
      : place
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [location.address, location.city, location.country].filter(Boolean).join(", "),
          )}`
        : null);

  const [first, last] = splitName(profile);
  const role = [identity.title, identity.company].filter(Boolean) as string[];

  const { variant, accent, shape, focus } = settings;
  const radius = { soft: "14px", pill: "999px", sharp: "3px" }[shape];

  /**
   * Variables CSS posees a la racine du moteur. L accent du client ne touche
   * que les signaux ; le bouton principal garde les couleurs de la variante,
   * sauf si le client a explicitement choisi un accent - auquel cas son texte
   * est recalcule pour rester lisible.
   */
  const accentChosen = accent !== variant.tokens.accent;
  const ctaBg = accentChosen && engine !== "obsidian" ? accent : variant.tokens.ctaBg;
  const style = {
    "--pc-bg": variant.tokens.bg,
    "--pc-surface": variant.tokens.surface,
    "--pc-ink": variant.tokens.ink,
    "--pc-ink-2": variant.tokens.ink2,
    "--pc-ink-3": variant.tokens.ink3,
    "--pc-line": variant.tokens.line,
    "--pc-press": variant.tokens.press,
    "--pc-accent": accent,
    "--pc-cta": ctaBg,
    "--pc-cta-ink": accentChosen && engine !== "obsidian" ? readableTextOn(ctaBg) : variant.tokens.ctaInk,
    "--pc-radius": radius,
    "--pc-photo": PHOTO_POSITION[focus],
    ...Object.fromEntries(
      Object.entries(variant.tokens.extra ?? {}).map(([k, v]) => [`--pc-x-${k}`, v]),
    ),
    colorScheme: variant.tokens.scheme,
  } as React.CSSProperties;

  return {
    profile,
    variant,
    shape,
    style,
    photoPosition: PHOTO_POSITION[focus],
    name: { full: identity.displayName, first, last, initials: initialsOf(identity.displayName) },
    role,
    actions,
    social,
    destinations,
    featured,
    place,
    region,
    mapHref,
    availability: presentation.availability,
    cta:
      presentation.ctaLabel && presentation.ctaUrl
        ? { label: presentation.ctaLabel, href: presentation.ctaUrl }
        : null,
  };
}

export type CardModel = ReturnType<typeof buildCardModel>;
