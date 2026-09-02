import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cardUrl } from "@/config/site";
import { LINK_TYPES } from "@/config/link-types";
import { LINK_SUBTITLES } from "@/config/brand";
import { getThemeDefinition, THEMES } from "@/config/themes";
import { sanitizeHref } from "@/lib/url-safety";
import { isValidCardToken } from "@/lib/tokens";
import type { CardResolution, PublicLink, PublicProfile, ThemeKey } from "@/types/profile";

/**
 * §9 - "Route publique /c/[token] -> resolution de la carte -> profil actif ->
 * rendu du theme choisi."
 *
 * Regles metier appliquees ici (§11) :
 *  - une carte ne pointe que vers un profil actif a un instant donne ;
 *  - une carte suspendue affiche une page neutre et ne revele rien de l ancien
 *    contenu (on ne charge donc meme pas le profil dans ce cas) ;
 *  - un lien masque reste en base mais n est jamais serialise vers le public.
 */
export const resolveCard = cache(async (rawToken: string): Promise<CardResolution> => {
  const token = rawToken.trim().toUpperCase();
  if (!isValidCardToken(token)) return { ok: false, reason: "NOT_FOUND", status: null };

  const card = await prisma.nfcCard.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, assignedProfileId: true },
  });

  if (!card) return { ok: false, reason: "NOT_FOUND", status: null };
  if (card.status === "SUSPENDED" || card.status === "LOST" || card.status === "REPLACED") {
    return { ok: false, reason: "SUSPENDED", status: card.status };
  }
  if (!card.assignedProfileId || card.status === "UNASSIGNED") {
    return { ok: false, reason: "UNASSIGNED", status: card.status };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: card.assignedProfileId },
    include: {
      user: { select: { status: true } },
      theme: { include: { theme: true } },
      links: { where: { isVisible: true }, orderBy: { position: "asc" } },
    },
  });

  if (!profile || !profile.isPublished || profile.user.status === "SUSPENDED") {
    return { ok: false, reason: "UNPUBLISHED", status: card.status };
  }

  return { ok: true, cardId: card.id, profile: toPublicProfile(profile, token) };
});

type ProfileWithRelations = Awaited<ReturnType<typeof loadProfile>>;
async function loadProfile(id: string) {
  return prisma.profile.findUniqueOrThrow({
    where: { id },
    include: {
      user: { select: { status: true } },
      theme: { include: { theme: true } },
      links: { orderBy: { position: "asc" } },
    },
  });
}

/**
 * §17 - "Tous les themes recoivent le meme objet de donnees normalise."
 * Ce mapper est le seul endroit ou le schema Prisma touche la couche de rendu :
 * changer de theme ne change donc jamais la structure des donnees.
 */
export function toPublicProfile(
  profile: NonNullable<ProfileWithRelations>,
  cardToken: string,
): PublicProfile {
  const visibility = (profile.fieldVisibility ?? {}) as Record<string, boolean>;
  const shown = (key: string) => visibility[key] !== false;

  // flatMap plutot que map + filter : une URL rejetee par sanitizeHref (§11)
  // disparait simplement du profil public, sans etape de narrowing.
  const links: PublicLink[] = profile.links
    .filter((l) => l.isVisible)
    .flatMap((l) => {
      const def = LINK_TYPES[l.type];
      const checked = sanitizeHref(def ? def.toHref(l.value) : l.value);
      if (!checked.ok) return [];

      return [
        {
          id: l.id,
          type: l.type,
          label: l.label,
          description: l.description ?? LINK_SUBTITLES[l.type] ?? null,
          href: checked.href,
          icon: l.icon ?? def?.icon ?? null,
          color: l.color,
          style: l.style,
        },
      ];
    });

  const themeKey = (profile.theme?.theme.key ?? "minimal") as ThemeKey;
  const definition = getThemeDefinition(themeKey) ?? THEMES[0];

  return {
    id: profile.id,
    cardToken,
    canonicalUrl: cardUrl(cardToken),
    seoIndexable: profile.seoIndexable,

    identity: {
      displayName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: shown("title") ? profile.title : null,
      company: shown("company") ? profile.company : null,
      tagline: shown("tagline") ? profile.tagline : null,
      bio: shown("bio") ? profile.bio : null,
      avatarUrl: shown("avatar") ? profile.avatarUrl : null,
      coverUrl: shown("cover") ? profile.coverUrl : null,
      logoUrl: shown("logo") ? profile.logoUrl : null,
    },

    contact: {
      phone: shown("phone") ? profile.phone : null,
      whatsapp: shown("whatsapp") ? profile.whatsapp : null,
      email: shown("email") ? profile.emailPublic : null,
      website: shown("website") ? profile.website : null,
    },

    location: {
      address: shown("address") ? profile.address : null,
      city: shown("address") ? profile.city : null,
      country: shown("address") ? profile.country : null,
      lat: shown("map") ? profile.lat : null,
      lng: shown("map") ? profile.lng : null,
      mapUrl: shown("map") ? profile.mapUrl : null,
    },

    presentation: {
      introText: profile.introText,
      availability: shown("availability") ? profile.availability : null,
      ctaLabel: shown("cta") ? profile.ctaLabel : null,
      ctaUrl: shown("cta") ? profile.ctaUrl : null,
    },

    links,

    theme: {
      key: themeKey,
      accentColor: profile.theme?.accentColor ?? definition.defaultAccent,
      mode: profile.theme?.mode ?? definition.defaultMode,
      variant: profile.theme?.variant ?? null,
      fontPair: profile.theme?.fontPair ?? null,
      buttonStyle: profile.theme?.buttonStyle ?? "SOLID",
      customConfig: (profile.theme?.customConfig ?? {}) as Record<string, unknown>,
    },
  };
}

/** Utilise par l apercu temps reel du dashboard (§6.2) : pas de carte requise. */
export async function previewProfile(profileId: string): Promise<PublicProfile> {
  const profile = await loadProfile(profileId);
  const card = await prisma.nfcCard.findFirst({
    where: { assignedProfileId: profileId, status: "ACTIVE" },
    select: { publicToken: true },
  });
  return toPublicProfile(profile, card?.publicToken ?? "PREVIEW");
}
