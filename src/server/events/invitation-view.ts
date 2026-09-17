import "server-only";
import { prisma } from "@/lib/prisma";
import { buildInvitationView, type RawInvitationEvent } from "@/lib/events/invitation-view";
import type { InvitationView } from "@/types/invitation";

/**
 * Chargement de l InvitationView depuis la base.
 *
 * Le `select` est l inventaire exact de ce qui peut atteindre un theme : tout
 * champ absent ici (notes internes, telephones, jetons, allergies, autres
 * groupes) est hors d atteinte du rendu, par construction.
 */
const eventSelect = {
  type: true,
  title: true,
  hosts: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  heroImageUrl: true,
  contentUpdatedAt: true,
  publishedAt: true,
  themeKey: true,
  themeSettings: true,
  rsvpSettings: true,
  venues: {
    orderBy: { position: "asc" as const },
    select: { label: true, name: true, address: true, landmark: true, lat: true, lng: true, startsAt: true },
  },
  sections: {
    orderBy: { position: "asc" as const },
    select: { id: true, kind: true, title: true, isVisible: true, data: true },
  },
};

/** Apercu organisateur : aucun invite reel, reglages eventuellement essayes sans etre enregistres. */
export async function loadPreviewInvitation(
  eventId: string,
  themeOverride?: { key?: string; settings?: unknown },
): Promise<InvitationView> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: eventSelect });
  return buildInvitationView(event as RawInvitationEvent, null, { preview: true, themeOverride });
}
