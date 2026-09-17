import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { canReadInvitation, isInvitationToken } from "@/lib/events/invitation-access";
import { buildInvitationView, dateParts, type RawInvitationEvent } from "@/lib/events/invitation-view";
import { parseRsvpSettings } from "@/lib/events/rsvp";
import type { InvitationView, RsvpFormData } from "@/types/invitation";

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
  rsvpForm: RsvpFormData;
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
        response: {
          select: {
            status: true,
            version: true,
            message: true,
            answers: { select: { questionId: true, guestId: true, value: true } },
          },
        },
        group: {
          select: {
            name: true,
            maxSeats: true,
            guests: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                ageCategory: true,
                isPlusOne: true,
                attending: true,
                preference: { select: { mealOptionId: true, allergies: true } },
              },
            },
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
                meals: { orderBy: { position: "asc" }, select: { id: true, label: true, description: true, forChildren: true } },
                questions: {
                  orderBy: { position: "asc" },
                  select: { id: true, type: true, label: true, options: true, required: true, perGuest: true },
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

    const settings = parseRsvpSettings(event.rsvpSettings);
    const rsvpForm: RsvpFormData = {
      token,
      version: invitation.response?.version ?? 0,
      status: invitation.response?.status ?? "PENDING",
      allowMaybe: settings.allowMaybe,
      allowEdit: settings.allowEdit,
      closed: view.rsvp.closed,
      maxSeats: group.maxSeats,
      members: group.guests.map((g) => ({
        key: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        ageCategory: g.ageCategory,
        isPlusOne: g.isPlusOne,
        attending: g.attending,
        mealOptionId: g.preference?.mealOptionId ?? null,
        // Donnee de la famille elle-meme, rendue a qui tient son lien pour qu elle puisse la corriger.
        allergies: g.preference?.allergies ?? null,
      })),
      meals: event.meals,
      questions: event.questions.map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string") : [],
      })),
      answers: invitation.response?.answers.map((a) => ({ questionId: a.questionId, key: a.guestId, value: a.value })) ?? [],
      message: invitation.response?.message ?? null,
      deadlineLabel: settings.deadline ? dateParts(new Date(settings.deadline), event.timezone).long : null,
    };

    return { invitationId: invitation.id, eventId: event.id, firstOpenedAt: invitation.firstOpenedAt, view, rsvpForm };
  },
);
