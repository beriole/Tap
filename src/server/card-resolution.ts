import "server-only";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cardTag, shareTag } from "@/lib/cache-tags";
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

/**
 * Chargement de la carte et de son profil.
 *
 * UNE seule requete, et non deux enchainees. Le scan est le moment qui compte :
 * deux allers-retours SQL sequentiels coutaient une centaine de millisecondes
 * pendant que deux personnes attendent, la carte encore en main.
 *
 * Le resultat est mis en cache et n est relu en base qu apres invalidation
 * explicite : un scan ne touche donc plus la base du tout pour s afficher.
 * L enregistrement du scan, lui, reste cote serveur - il se produit APRES la
 * reponse (`after`), donc il ne retarde rien et aucun bloqueur de scripts ne
 * peut le faire disparaitre des statistiques.
 */
function loadCard(token: string) {
  return unstable_cache(
    async () =>
      prisma.nfcCard.findUnique({
        where: { publicToken: token },
        select: {
          id: true,
          status: true,
          assignedProfileId: true,
          assignedProfile: {
            include: {
              user: { select: { status: true } },
              theme: { include: { theme: true } },
              links: { where: { isVisible: true }, orderBy: { position: "asc" } },
            },
          },
        },
      }),
    ["card-resolution", token],
    // Une heure de filet de securite : meme si une invalidation etait
    // manquee un jour, la carte se remettrait a jour d elle-meme.
    { tags: [cardTag(token)], revalidate: 3600 },
  )();
}

export const resolveCard = cache(async (rawToken: string): Promise<CardResolution> => {
  const token = rawToken.trim().toUpperCase();
  if (!isValidCardToken(token)) return { ok: false, reason: "NOT_FOUND", status: null };

  const card = await loadCard(token);

  if (!card) return { ok: false, reason: "NOT_FOUND", status: null };
  if (card.status === "SUSPENDED" || card.status === "LOST" || card.status === "REPLACED") {
    return { ok: false, reason: "SUSPENDED", status: card.status };
  }
  if (!card.assignedProfileId || card.status === "UNASSIGNED") {
    return { ok: false, reason: "UNASSIGNED", status: card.status };
  }

  const profile = card.assignedProfile;
  if (!profile || !profile.isPublished || profile.user.status === "SUSPENDED") {
    return { ok: false, reason: "UNPUBLISHED", status: card.status };
  }

  return { ok: true, cardId: card.id, profile: toPublicProfile(profile, token) };
});

/** Invalide une carte precise (changement d etat, d association). */
export function revalidateCard(token: string) {
  revalidateTag(cardTag(token));
}

/**
 * Invalide toutes les cartes qui pointent vers un profil.
 *
 * La recherche des jetons se fait ici, dans le chemin d ECRITURE, ou une
 * requete de plus ne coute rien a personne. La lecture, elle, reste a zero
 * requete.
 */
export async function revalidateProfileCards(profileId: string) {
  const [cards, shares] = await Promise.all([
    prisma.nfcCard.findMany({
      where: { assignedProfileId: profileId },
      select: { publicToken: true },
    }),
    // Les liens de partage montrent les memes donnees derriere un masque :
    // les oublier ici laisserait un ancien numero visible dans un partage
    // deja remis a quelqu un.
    prisma.shareLink.findMany({ where: { profileId }, select: { slug: true } }),
  ]);
  for (const card of cards) revalidateTag(cardTag(card.publicToken));
  for (const share of shares) revalidateTag(shareTag(share.slug));
}

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
 * Restriction appliquee par-dessus le profil, pour un lien de partage.
 *
 * Le masque ne remplace pas les donnees : il decide, champ par champ, de ce
 * qui sort. Un seul mapper sert donc la carte et le partage restreint - le
 * jour ou un champ change de forme, il ne change qu a un endroit.
 */
export type ProfileOverlay = {
  /** Renvoie true si le champ doit sortir. */
  allow: (key: string) => boolean;
  /** Identifiants des liens autorises ; null = tous les liens visibles. */
  linkIds: Set<string> | null;
  /** Adresse publique de cette vue, si elle differe de celle de la carte. */
  canonicalUrl?: string;
  theme?: {
    key: ThemeKey;
    accentColor: string | null;
    mode: PublicProfile["theme"]["mode"] | null;
    buttonStyle: PublicProfile["theme"]["buttonStyle"] | null;
  };
};

/**
 * §17 - "Tous les themes recoivent le meme objet de donnees normalise."
 * Ce mapper est le seul endroit ou le schema Prisma touche la couche de rendu :
 * changer de theme ne change donc jamais la structure des donnees.
 */
export function toPublicProfile(
  profile: NonNullable<ProfileWithRelations>,
  cardToken: string,
  overlay?: ProfileOverlay,
): PublicProfile {
  const visibility = (profile.fieldVisibility ?? {}) as Record<string, boolean>;
  // Sur le profil, un champ non renseigne est VISIBLE par defaut.
  // Sur un lien restreint, il est MASQUE : c est une liste d autorisation.
  const shown = overlay ? overlay.allow : (key: string) => visibility[key] !== false;

  // flatMap plutot que map + filter : une URL rejetee par sanitizeHref (§11)
  // disparait simplement du profil public, sans etape de narrowing.
  const links: PublicLink[] = profile.links
    .filter((l) => l.isVisible)
    .filter((l) => !overlay?.linkIds || overlay.linkIds.has(l.id))
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

  // Le lien de partage peut porter son propre habillage ; a defaut il herite
  // de celui du profil, comme n importe quel scan de carte.
  const themeKey = (overlay?.theme?.key ?? profile.theme?.theme.key ?? "minimal") as ThemeKey;
  const definition = getThemeDefinition(themeKey) ?? THEMES[0];

  return {
    id: profile.id,
    cardToken,
    canonicalUrl: overlay?.canonicalUrl ?? cardUrl(cardToken),
    // Une vue restreinte n a rien a faire dans un moteur de recherche : elle
    // a ete creee pour etre donnee a quelqu un, pas pour etre trouvee.
    seoIndexable: overlay ? false : profile.seoIndexable,

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
      accentColor:
        overlay?.theme?.accentColor ?? profile.theme?.accentColor ?? definition.defaultAccent,
      mode: overlay?.theme?.mode ?? profile.theme?.mode ?? definition.defaultMode,
      variant: profile.theme?.variant ?? null,
      fontPair: profile.theme?.fontPair ?? null,
      buttonStyle: overlay?.theme?.buttonStyle ?? profile.theme?.buttonStyle ?? "SOLID",
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
