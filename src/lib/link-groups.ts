import type { PublicLink } from "@/types/profile";

/**
 * Regroupements de liens partages entre themes.
 *
 * Ce module n a volontairement PAS de directive "use client" : les themes sont
 * des composants serveur et doivent pouvoir appeler ces fonctions au rendu.
 * Une fonction exportee depuis un module client ne peut etre qu affichee comme
 * composant ou passee en prop - jamais appelee cote serveur.
 */

const SOCIAL_TYPES = new Set(["LINKEDIN", "INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "YOUTUBE"]);

/** Types rendus en tuiles d application par les themes qui en proposent. */
const TILE_TYPES = new Set([
  "INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "TELEGRAM", "X",
  "LINKEDIN", "GITHUB", "MESSENGER", "WHATSAPP",
]);

/** Travaux mis en avant par le theme Tech. */
const WORK_TYPES = new Set(["GITHUB", "PORTFOLIO", "WEBSITE", "DRIBBBLE", "BEHANCE"]);

export function socialLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => SOCIAL_TYPES.has(l.type));
}

export function nonSocialLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => !SOCIAL_TYPES.has(l.type));
}

export function tileLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => TILE_TYPES.has(l.type));
}

export function nonTileLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => !TILE_TYPES.has(l.type));
}

export function workLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => WORK_TYPES.has(l.type));
}

export function nonWorkLinks(links: PublicLink[]): PublicLink[] {
  return links.filter((l) => !WORK_TYPES.has(l.type));
}
