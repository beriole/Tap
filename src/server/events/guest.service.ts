import "server-only";
import { prisma } from "@/lib/prisma";
import { eventPlan } from "@/config/event-plans";
import { generateSecureToken } from "@/lib/tokens";
import { normalizePhone } from "@/lib/events/phone";
import type { ExistingGuest } from "@/lib/events/paste-import";
import type { GroupInput } from "@/lib/validations/guest";
import { writeAudit } from "@/server/audit";

/**
 * Groupes d invites (§17 GuestService).
 *
 * Comme event.service : les droits sont verifies par la route, en amont.
 */

export class GuestError extends Error {
  constructor(
    public code: "PLAN_LIMIT" | "SEATS_BELOW_PRESENT" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}

/** Le numero est normalise ICI, jamais cru depuis le navigateur. */
async function guestRows(guests: GroupInput["guests"], eventId: string) {
  const { defaultCountry } = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    select: { defaultCountry: true },
  });
  return guests.map((guest, position) => {
    const phone = guest.phone ? normalizePhone(guest.phone, defaultCountry) : null;
    return {
      firstName: guest.firstName,
      lastName: guest.lastName,
      phoneRaw: guest.phone,
      phoneE164: phone?.e164 ?? null,
      email: guest.email ?? null,
      ageCategory: guest.ageCategory,
      // Le premier de la liste recoit le lien.
      isPrimary: position === 0,
      position,
    };
  });
}

async function assertRoomFor(eventId: string, adding: number) {
  const [event, count] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { plan: true } }),
    prisma.guestGroup.count({ where: { eventId } }),
  ]);
  const plan = eventPlan(event.plan);
  if (count + adding > plan.maxGroups) {
    throw new GuestError(
      "PLAN_LIMIT",
      `L offre ${plan.name} permet ${plan.maxGroups} groupes : ${count} deja crees, ${adding} de plus demandes.`,
    );
  }
}

/**
 * Cree des groupes, leurs personnes et leur invitation, en une transaction :
 * un import de 300 lignes aboutit entierement ou pas du tout. Un import a
 * moitie fait est pire qu un echec - on ne sait plus ce qui manque.
 *
 * L invitation (et son jeton) nait avec le groupe : le lien existe des le
 * depart, qu il soit partage ou non.
 */
export async function createGroups(
  eventId: string,
  groups: GroupInput[],
  actorId: string,
  options: { canEditSensitive: boolean } = { canEditSensitive: false },
) {
  await assertRoomFor(eventId, groups.length);
  const prepared = await Promise.all(groups.map(async (g) => ({ group: g, guests: await guestRows(g.guests, eventId) })));

  const created = await prisma.$transaction(
    prepared.map(({ group, guests }) =>
      prisma.guestGroup.create({
        data: {
          eventId,
          name: group.name,
          maxSeats: group.maxSeats,
          category: group.category,
          tags: group.tags,
          internalNote: options.canEditSensitive ? group.internalNote : null,
          guests: { create: guests },
          invitation: { create: { token: generateSecureToken(32) } },
        },
        select: { id: true },
      }),
    ),
  );

  if (groups.length > 1) {
    await writeAudit({
      actorId,
      action: "guests.import",
      targetType: "Event",
      targetId: eventId,
      metadata: { groups: groups.length, guests: groups.reduce((n, g) => n + g.guests.length, 0) },
    });
  }
  return created;
}

/**
 * Met a jour un groupe et remplace sa liste de personnes.
 *
 * Garde-fou : le quota ne descend jamais sous le nombre de personnes deja
 * confirmees. Sinon un simple clic ferait disparaitre des invites attendus du
 * decompte traiteur, sans que personne ne s en apercoive.
 */
export async function updateGroup(
  eventId: string,
  groupId: string,
  input: GroupInput,
  actorId: string,
  options: { canEditSensitive: boolean },
) {
  const current = await prisma.guestGroup.findFirst({
    where: { id: groupId, eventId },
    select: {
      maxSeats: true,
      guests: { select: { id: true, attending: true } },
      invitation: { select: { response: { select: { status: true } } } },
    },
  });
  if (!current) throw new GuestError("NOT_FOUND", "Groupe introuvable.");

  const confirmed = current.invitation?.response?.status === "ATTENDING";
  const present = confirmed ? current.guests.filter((g) => g.attending).length : 0;
  if (input.maxSeats < present) {
    throw new GuestError(
      "SEATS_BELOW_PRESENT",
      `${present} personne(s) de ce groupe ont deja confirme : le quota ne peut pas descendre en dessous.`,
    );
  }

  const rows = await guestRows(input.guests, eventId);
  const ownIds = new Set(current.guests.map((g) => g.id));
  const keptIds = input.guests.map((g) => g.id).filter((id): id is string => Boolean(id && ownIds.has(id)));

  await prisma.$transaction([
    prisma.guestGroup.update({
      where: { id: groupId },
      data: {
        name: input.name,
        maxSeats: input.maxSeats,
        category: input.category,
        tags: input.tags,
        // Sans la permission "sensitive", la note n a jamais ete envoyee au
        // navigateur : le champ vide recu ne veut pas dire "effacer".
        ...(options.canEditSensitive ? { internalNote: input.internalNote } : {}),
      },
    }),
    prisma.guest.deleteMany({ where: { groupId, id: { notIn: keptIds } } }),
    ...input.guests.map((guest, i) =>
      // Un identifiant qui n appartient pas a CE groupe est ignore : on cree
      // une nouvelle personne plutot que de modifier celle d un autre groupe.
      guest.id && ownIds.has(guest.id)
        ? prisma.guest.update({ where: { id: guest.id }, data: rows[i]! })
        : prisma.guest.create({ data: { groupId, ...rows[i]! } }),
    ),
  ]);

  if (input.maxSeats !== current.maxSeats) {
    await writeAudit({
      actorId,
      action: "group.quota",
      targetType: "GuestGroup",
      targetId: groupId,
      metadata: { from: current.maxSeats, to: input.maxSeats },
    });
  }
}

export async function deleteGroup(eventId: string, groupId: string, actorId: string) {
  const group = await prisma.guestGroup.findFirst({
    where: { id: groupId, eventId },
    select: { name: true, _count: { select: { guests: true } } },
  });
  if (!group) throw new GuestError("NOT_FOUND", "Groupe introuvable.");
  await prisma.guestGroup.delete({ where: { id: groupId } });
  await writeAudit({
    actorId,
    action: "group.delete",
    targetType: "Event",
    targetId: eventId,
    metadata: { name: group.name, guests: group._count.guests },
  });
}

/** Invites deja en base, pour detecter les doublons d un import. */
export async function existingGuestsForDuplicates(eventId: string): Promise<ExistingGuest[]> {
  const guests = await prisma.guest.findMany({
    where: { group: { eventId } },
    select: { firstName: true, lastName: true, phoneE164: true, group: { select: { name: true } } },
  });
  return guests.map((g) => ({ firstName: g.firstName, lastName: g.lastName, phoneE164: g.phoneE164, groupName: g.group.name }));
}

