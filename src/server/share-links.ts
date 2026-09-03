import "server-only";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { isValidShareSlug } from "@/lib/tokens";
import { shareTag } from "@/lib/cache-tags";
import { resolveCard, toPublicProfile, type ProfileOverlay } from "@/server/card-resolution";
import type { PublicProfile, ThemeKey } from "@/types/profile";

/**
 * Liens de partage restreints.
 *
 * La carte NFC porte l identite complete, et son URL ne change jamais. Il
 * existe pourtant des situations - une ceremonie, un salon, un premier
 * contact commercial - ou l on ne veut donner qu une partie de soi.
 *
 * Un lien de partage repond a ce besoin sans toucher au profil : il ne stocke
 * qu un masque et un habillage. Les donnees restent uniques. Corriger son
 * numero le corrige partout, y compris dans les liens deja distribues.
 *
 * Deux garde-fous qui ne se voient pas mais comptent :
 *  - la visibilite est une liste d AUTORISATION, pas d exclusion : un champ
 *    ajoute au produit demain n apparaitra pas tout seul dans un lien deja
 *    remis a quelqu un ;
 *  - un lien desactive ou expire ne charge meme pas le profil, exactement
 *    comme une carte suspendue (§11).
 */

/** Champs qu un lien restreint peut exposer, dans l ordre de l ecran client. */
export const SHARE_FIELDS = [
  { key: "avatar", label: "Photo de profil", group: "Identite" },
  { key: "cover", label: "Photo de couverture", group: "Identite" },
  { key: "logo", label: "Logo", group: "Identite" },
  { key: "title", label: "Fonction", group: "Identite" },
  { key: "company", label: "Entreprise", group: "Identite" },
  { key: "tagline", label: "Accroche", group: "Identite" },
  { key: "bio", label: "Presentation", group: "Identite" },
  { key: "phone", label: "Telephone", group: "Contact" },
  { key: "whatsapp", label: "WhatsApp", group: "Contact" },
  { key: "email", label: "E-mail", group: "Contact" },
  { key: "website", label: "Site web", group: "Contact" },
  { key: "address", label: "Adresse", group: "Lieu" },
  { key: "map", label: "Itineraire", group: "Lieu" },
  { key: "availability", label: "Disponibilite", group: "Complements" },
  { key: "cta", label: "Bouton d action", group: "Complements" },
  { key: "qr", label: "QR Code de la page", group: "Complements" },
] as const;

export type ShareFieldKey = (typeof SHARE_FIELDS)[number]["key"];

/** Le nom est toujours expose : sans lui, la page ne veut rien dire. */
export const shareUrl = (slug: string) => `${siteConfig.url}/s/${slug}`;

export type ShareResolution =
  | { ok: true; shareId: string; label: string; profile: PublicProfile }
  | { ok: false; reason: "NOT_FOUND" | "DISABLED" | "EXPIRED" };

function loadShare(slug: string) {
  return unstable_cache(
    async () =>
      prisma.shareLink.findUnique({
        where: { slug },
        include: {
          theme: { select: { key: true } },
          profile: {
            include: {
              user: { select: { status: true } },
              theme: { include: { theme: true } },
              links: { where: { isVisible: true }, orderBy: { position: "asc" } },
            },
          },
        },
      }),
    ["share-resolution", slug],
    { tags: [shareTag(slug)], revalidate: 3600 },
  )();
}

export const resolveShareLink = cache(async (rawSlug: string): Promise<ShareResolution> => {
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidShareSlug(slug)) return { ok: false, reason: "NOT_FOUND" };

  const share = await loadShare(slug);
  if (!share) return { ok: false, reason: "NOT_FOUND" };
  if (!share.isActive) return { ok: false, reason: "DISABLED" };
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "EXPIRED" };
  }

  const profile = share.profile;
  // Un profil depublie ou un compte suspendu ferme aussi ses liens de partage :
  // sinon une suspension laisserait des portes ouvertes derriere elle.
  if (!profile || !profile.isPublished || profile.user.status === "SUSPENDED") {
    return { ok: false, reason: "DISABLED" };
  }

  const allowed = (share.fieldVisibility ?? {}) as Record<string, boolean>;
  const overlay: ProfileOverlay = {
    allow: (key) => allowed[key] === true,
    linkIds: new Set(share.linkIds),
    canonicalUrl: shareUrl(slug),
    theme: share.theme
      ? {
          key: share.theme.key as ThemeKey,
          accentColor: share.accentColor,
          mode: share.mode,
          buttonStyle: share.buttonStyle,
        }
      : undefined,
  };

  return {
    ok: true,
    shareId: share.id,
    label: share.label,
    profile: toPublicProfile(profile, slug, overlay),
  };
});

/**
 * Resout un identifiant public, qu il vienne d une carte ou d un partage.
 *
 * Les themes ne connaissent qu un seul identifiant - celui de la page qui les
 * affiche - et le passent tel quel aux routes vCard et QR. C est ici qu on
 * decide laquelle des deux tables interroger, sur la seule forme du jeton :
 * une carte est en MAJUSCULES, un partage en minuscules.
 *
 * Consequence voulue : la vCard telechargee depuis un lien restreint ne
 * contient QUE ce que le lien expose. Enregistrer le contact ne contourne
 * jamais le masque.
 */
export async function resolvePublicToken(
  token: string,
): Promise<{ profile: PublicProfile } | null> {
  const raw = token.trim();
  if (isValidShareSlug(raw.toLowerCase()) && raw === raw.toLowerCase()) {
    const share = await resolveShareLink(raw);
    return share.ok ? { profile: share.profile } : null;
  }
  const card = await resolveCard(raw);
  return card.ok ? { profile: card.profile } : null;
}

export function revalidateShare(slug: string) {
  revalidateTag(shareTag(slug));
}

/**
 * Invalide tous les liens de partage d un profil.
 *
 * Appele depuis les memes chemins d ecriture que les cartes : une correction
 * de numero doit apparaitre partout, y compris dans un lien deja distribue.
 */
export async function revalidateProfileShares(profileId: string) {
  const shares = await prisma.shareLink.findMany({
    where: { profileId },
    select: { slug: true },
  });
  for (const share of shares) revalidateTag(shareTag(share.slug));
}
