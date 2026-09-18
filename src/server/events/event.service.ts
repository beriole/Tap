import "server-only";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultThemeFor } from "@/config/invitation-themes";
import { wallTimeToUtc } from "@/lib/events/time";
import type { eventCreateSchema, eventUpdateSchema, SectionInput, venueSchema } from "@/lib/validations/event";
import { writeAudit } from "@/server/audit";

/**
 * Cycle de vie d un evenement (§17 EventService) : creation, informations,
 * lieux, sections.
 *
 * Aucune fonction ici ne verifie les droits : c est le role de
 * requireEventAccess / checkEventAccess, appele AVANT par la route. Un
 * service qui se croit protege par l appelant et un appelant qui se croit
 * protege par le service, c est la faille classique ; la regle est donc
 * unique et ecrite : la route verifie, le service execute.
 */

type Venue = z.infer<typeof venueSchema>;

function venueData(venue: Venue, position: number, timezone: string) {
  return {
    label: venue.label,
    name: venue.name,
    address: venue.address,
    landmark: venue.landmark || null,
    startsAt: venue.startsAt ? wallTimeToUtc(venue.startsAt, timezone) : null,
    position,
  };
}

export async function createEvent(userId: string, input: z.infer<typeof eventCreateSchema>) {
  const event = await prisma.event.create({
    data: {
      type: input.type,
      title: input.title,
      hosts: input.hosts,
      timezone: input.timezone,
      startsAt: wallTimeToUtc(input.startsAt, input.timezone),
      endsAt: input.endsAt ? wallTimeToUtc(input.endsAt, input.timezone) : null,
      capacity: input.capacity ?? null,
      themeKey: defaultThemeFor(input.type),
      members: { create: { userId, role: "OWNER" } },
      venues: { create: input.venues.map((v, i) => venueData(v, i, input.timezone)) },
    },
    select: { id: true },
  });
  await writeAudit({ actorId: userId, action: "event.create", targetType: "Event", targetId: event.id });
  return event;
}

/**
 * Toute modification visible par les invites d un evenement deja publie
 * date le bandeau "mis a jour le" (D7).
 */
async function touchIfPublished(eventId: string) {
  await prisma.event.updateMany({
    where: { id: eventId, status: "PUBLISHED" },
    data: { contentUpdatedAt: new Date() },
  });
}

export async function updateEvent(eventId: string, input: z.infer<typeof eventUpdateSchema>) {
  const current = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { timezone: true } });
  const timezone = input.timezone ?? current.timezone;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.type ? { type: input.type } : {}),
      ...(input.title ? { title: input.title } : {}),
      ...(input.hosts ? { hosts: input.hosts } : {}),
      ...(input.timezone ? { timezone: input.timezone } : {}),
      ...(input.startsAt ? { startsAt: wallTimeToUtc(input.startsAt, timezone) } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt ? wallTimeToUtc(input.endsAt, timezone) : null } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity ?? null } : {}),
    },
  });
  await touchIfPublished(eventId);
}

/** Les lieux sont remplaces en bloc : l ecran les edite comme une liste ordonnee. */
export async function replaceVenues(eventId: string, venues: Venue[]) {
  const { timezone } = await prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { timezone: true } });
  await prisma.$transaction([
    prisma.venue.deleteMany({ where: { eventId } }),
    prisma.venue.createMany({ data: venues.map((v, i) => ({ eventId, ...venueData(v, i, timezone) })) }),
  ]);
  await touchIfPublished(eventId);
}

export async function replaceSections(eventId: string, sections: SectionInput[]) {
  await prisma.$transaction([
    prisma.eventSection.deleteMany({ where: { eventId } }),
    prisma.eventSection.createMany({
      data: sections.map((s, position) => ({
        eventId,
        kind: s.kind,
        title: s.title || null,
        isVisible: s.isVisible,
        data: s.data,
        position,
      })),
    }),
  ]);
  await touchIfPublished(eventId);
}
