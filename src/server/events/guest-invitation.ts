import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { canReadInvitation, isInvitationToken } from "@/lib/events/invitation-access";
import { buildInvitationView, type RawInvitationEvent } from "@/lib/events/invitation-view";
import type { InvitationView } from "@/types/invitation";

/**
 * Resolution d une invitation par son jeton (§6, §19).
 *
 * Un seul resultat d echec, sans raison : jeton inconnu, lien revoque ou
 * expire, evenement en brouillon - tout donne `null`. La page neutre qui en
 * resulte ne permet pas de deviner si un jeton a existe.
 *
 * `cache` : generateMetadata et la page resolvent le meme jeton dans la meme
 * requete ; une seule lecture en base.
 */
export type GuestInvitation = {
  invitationId: string;
  eventId: string;
  firstOpenedAt: Date | null;
  view: InvitationView;
};

export const resolveGuestInvitation = cache(
  async (token: string, options: { replayEnvelope?: boolean } = {}): Promise<GuestInvitation | null> => {
    if (!isInvitationToken(token)) return null;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        revokedAt: true,
        expiresAt: true,
        firstOpenedAt: true,
        group: {
          select: {
            name: true,
            maxSeats: true,
            guests: { orderBy: { position: "asc" }, select: { firstName: true, isPlusOne: true } },
            event: {
              select: {
                id: true,
                status: true,
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
                  orderBy: { position: "asc" },
                  select: { label: true, name: true, address: true, landmark: true, lat: true, lng: true, startsAt: true },
                },
                sections: {
                  orderBy: { position: "asc" },
                  select: { id: true, kind: true, title: true, isVisible: true, data: true },
                },
              },
            },
          },
        },
      },
    });
    if (!invitation) return null;

    const { event, ...group } = invitation.group;
    if (!canReadInvitation({ revokedAt: invitation.revokedAt, expiresAt: invitation.expiresAt, eventStatus: event.status })) {
      return null;
    }

    const view = buildInvitationView(
      event as RawInvitationEvent,
      { groupName: group.name, maxSeats: group.maxSeats, guests: group.guests },
      { preview: false, envelope: options.replayEnvelope || !invitation.firstOpenedAt },
    );
    return { invitationId: invitation.id, eventId: event.id, firstOpenedAt: invitation.firstOpenedAt, view };
  },
);
