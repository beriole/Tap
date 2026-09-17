import "server-only";
import { prisma } from "@/lib/prisma";
import { computeHeadcount, type Headcount, type HeadcountGroup } from "@/lib/events/headcount";

/**
 * Charge un evenement sous la forme attendue par computeHeadcount.
 *
 * Seule requete autorisee a produire des totaux : dashboard et exports
 * l appellent tous deux (§22 "exports = totaux affiches"). Les allergies ne
 * sortent d ici qu en booleen - le texte reste reserve aux ecrans qui ont la
 * permission "sensitive".
 */
export async function loadEventHeadcount(eventId: string): Promise<Headcount> {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    select: {
      capacity: true,
      groups: {
        select: {
          maxSeats: true,
          invitation: {
            select: {
              state: true,
              response: { select: { status: true } },
              ticket: { select: { seatsUsed: true } },
            },
          },
          guests: {
            select: {
              ageCategory: true,
              attending: true,
              isPlusOne: true,
              preference: { select: { mealOptionId: true, allergies: true } },
            },
          },
        },
      },
    },
  });

  const groups: HeadcountGroup[] = event.groups.map((group) => ({
    maxSeats: group.maxSeats,
    invitation: group.invitation
      ? {
          state: group.invitation.state,
          status: group.invitation.response?.status ?? "PENDING",
          seatsUsed: group.invitation.ticket?.seatsUsed ?? 0,
        }
      : null,
    guests: group.guests.map((guest) => ({
      ageCategory: guest.ageCategory,
      attending: guest.attending,
      isPlusOne: guest.isPlusOne,
      mealOptionId: guest.preference?.mealOptionId ?? null,
      hasAllergies: Boolean(guest.preference?.allergies?.trim()),
    })),
  }));

  return computeHeadcount(groups, event.capacity);
}
