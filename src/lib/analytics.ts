import type { ClickAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * §12 / §15 - "Collecter le minimum necessaire dans les statistiques."
 * On ne stocke ni IP, ni user-agent complet, ni identifiant de visiteur :
 * seulement une famille d appareil grossiere et un referrer de domaine.
 */

export type CoarseDevice = "ios" | "android" | "other";

export function coarseDevice(userAgent: string | null): CoarseDevice {
  if (!userAgent) return "other";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

/** Ne conserve que le domaine du referrer, jamais le chemin ni les parametres. */
export function coarseReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

export async function recordScan(input: {
  cardId: string;
  userAgent: string | null;
  referrer: string | null;
  source?: "NFC" | "QR" | "LINK";
  country?: string | null;
  region?: string | null;
}): Promise<void> {
  await prisma.scanEvent.create({
    data: {
      cardId: input.cardId,
      coarseDevice: coarseDevice(input.userAgent),
      referrer: coarseReferrer(input.referrer),
      source: input.source ?? "NFC",
      country: input.country ?? null,
      region: input.region ?? null,
    },
  });
}

export async function recordClick(input: {
  profileId: string;
  linkId?: string | null;
  action: ClickAction;
}): Promise<void> {
  await prisma.clickEvent.create({
    data: {
      profileId: input.profileId,
      linkId: input.linkId ?? null,
      action: input.action,
    },
  });
}
