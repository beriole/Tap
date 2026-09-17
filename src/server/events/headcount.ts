import "server-only";
import { prisma } from "@/lib/prisma";
import { computeHeadcount, type Headcount } from "@/lib/events/headcount";
import type { ExportGroup } from "@/lib/events/exports";
import { formatPhone } from "@/lib/events/phone";
import { displayName } from "@/lib/events/names";

/**
 * Chargement d un evenement sous la forme attendue par computeHeadcount ET
 * par les exports : une seule requete, une seule forme, pour que le
 * dashboard et les fichiers ne puissent pas differer (§22).
 *
 * Le texte des allergies ne sort qu avec `sensitive` ; sinon seul un booleen
 * (hasAllergies) survit, pour le compteur.
 */
export async function loadExportGroups(eventId: string, options: { sensitive: boolean }): Promise<ExportGroup[]> {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      groups: {
        orderBy: { name: "asc" },
        select: {
          name: true,
          category: true,
          maxSeats: true,
          invitation: {
            select: {
              state: true,
              response: { select: { status: true } },
              ticket: { select: { seatsUsed: true } },
            },
          },
          guests: {
            orderBy: { position: "asc" },
            select: {
              firstName: true,
              lastName: true,
              phoneE164: true,
              ageCategory: true,
              attending: true,
              isPlusOne: true,
              preference: { select: { mealOptionId: true, allergies: true, meal: { select: { label: true } } } },
            },
          },
        },
      },
    },
  });

  return event.groups.map((group) => {
    const status = group.invitation?.response?.status ?? "PENDING";
    return {
      name: group.name,
      category: group.category,
      maxSeats: group.maxSeats,
      primaryPhone: (() => {
        const phone = group.guests.find((g) => !g.isPlusOne && g.phoneE164)?.phoneE164;
        return phone ? formatPhone(phone) : null;
      })(),
      responseStatus: status,
      invitation: group.invitation
        ? { state: group.invitation.state, status, seatsUsed: group.invitation.ticket?.seatsUsed ?? 0 }
        : null,
      guests: group.guests.map((guest) => ({
        name: displayName(guest, "Accompagnant"),
        ageCategory: guest.ageCategory,
        attending: guest.attending,
        isPlusOne: guest.isPlusOne,
        mealOptionId: guest.preference?.mealOptionId ?? null,
        mealLabel: guest.preference?.meal?.label ?? null,
        hasAllergies: Boolean(guest.preference?.allergies?.trim()),
        allergies: options.sensitive ? (guest.preference?.allergies?.trim() || null) : null,
      })),
    };
  });
}

export async function loadEventHeadcount(eventId: string): Promise<Headcount> {
  const [event, groups] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { capacity: true } }),
    loadExportGroups(eventId, { sensitive: false }),
  ]);
  return computeHeadcount(groups, event.capacity);
}
