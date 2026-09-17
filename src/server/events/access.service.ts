import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateSecureToken } from "@/lib/tokens";
import { admissionQuantity, generatePin, isTicketCode, ticketVerdict, type TicketVerdict } from "@/lib/events/checkin";
import { displayName } from "@/lib/events/names";
import { writeAudit } from "@/server/audit";

/**
 * Accueil le jour J (§10, §17 AccessService) : postes, verification, entrees.
 *
 * Les droits sont verifies en amont (route organisateur : permission
 * "checkin" ; route de poste : jeton + PIN). Ici, les regles et l atomicite.
 */

// --------------------------------------------------------------- postes --

export async function createStation(eventId: string, label: string, actorId: string) {
  const pin = generatePin();
  const station = await prisma.checkInStation.create({
    data: { eventId, label, token: generateSecureToken(32), pinHash: await hashPassword(pin) },
    select: { id: true, label: true, token: true },
  });
  await writeAudit({ actorId, action: "station.create", targetType: "CheckInStation", targetId: station.id, metadata: { eventId, label } });
  // Le PIN n est montre qu une fois, a la creation : il n est stocke que hache.
  return { ...station, pin };
}

export async function revokeStation(eventId: string, stationId: string, actorId: string): Promise<boolean> {
  const updated = await prisma.checkInStation.updateMany({ where: { id: stationId, eventId, revokedAt: null }, data: { revokedAt: new Date() } });
  if (updated.count) await writeAudit({ actorId, action: "station.revoke", targetType: "CheckInStation", targetId: stationId });
  return updated.count > 0;
}

/** Ouvre un poste : jeton + PIN. Le PIN est compare a son hachage, jamais en clair. */
export async function openStation(token: string, pin: string) {
  if (!isTicketCode(token)) return null;
  const station = await prisma.checkInStation.findUnique({
    where: { token },
    select: { id: true, label: true, pinHash: true, revokedAt: true, event: { select: { id: true, title: true, status: true } } },
  });
  if (!station || station.revokedAt) return null;
  if (!(await verifyPassword(pin, station.pinHash))) return null;
  return { id: station.id, label: station.label, event: station.event };
}

// ---------------------------------------------------------- verification --

export type TicketLookup = {
  ticketId: string;
  groupName: string;
  people: string[];
  seats: number;
  seatsUsed: number;
  verdict: TicketVerdict;
  /** Note interne : seulement si l organisateur l a autorisee pour l accueil (jamais au MVP) */
  note: null;
  lastCheckIn: { at: Date; quantity: number; operator: string } | null;
};

const ticketSelect = {
  id: true,
  seats: true,
  seatsUsed: true,
  cancelledAt: true,
  checkIns: { orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true, quantity: true, operatorName: true } },
  invitation: {
    select: {
      group: {
        select: {
          eventId: true,
          name: true,
          guests: { where: { attending: true }, orderBy: { position: "asc" as const }, select: { firstName: true, lastName: true } },
          event: { select: { status: true } },
        },
      },
    },
  },
};

function toLookup(t: NonNullable<Awaited<ReturnType<typeof findTicketByCode>>>): TicketLookup {
  const { group } = t.invitation;
  const last = t.checkIns[0];
  return {
    ticketId: t.id,
    groupName: group.name,
    people: group.guests.map((g) => displayName(g, "Accompagnant")),
    seats: t.seats,
    seatsUsed: t.seatsUsed,
    verdict: ticketVerdict({ seats: t.seats, seatsUsed: t.seatsUsed, cancelledAt: t.cancelledAt, eventStatus: group.event.status }),
    note: null,
    lastCheckIn: last ? { at: last.createdAt, quantity: last.quantity, operator: last.operatorName } : null,
  };
}

function findTicketByCode(code: string) {
  return prisma.ticket.findUnique({ where: { code }, select: ticketSelect });
}

/** Ticket d un QR scanne, DANS l evenement du poste : un QR d un autre evenement est inconnu ici. */
export async function lookupTicket(eventId: string, code: string): Promise<TicketLookup | null> {
  if (!isTicketCode(code)) return null;
  const t = await findTicketByCode(code);
  if (!t || t.invitation.group.eventId !== eventId) return null;
  return toLookup(t);
}

export async function lookupTicketById(eventId: string, ticketId: string): Promise<TicketLookup | null> {
  const t = await prisma.ticket.findFirst({ where: { id: ticketId, invitation: { group: { eventId } } }, select: ticketSelect });
  return t ? toLookup(t) : null;
}

/**
 * Recherche manuelle par nom ou numero (§10 "ecran casse, QR indisponible").
 * Ne renvoie que des groupes attendus (ticket emis) : le poste n a pas a voir
 * les absents ni les sans-reponse.
 */
export async function searchTickets(eventId: string, query: string): Promise<TicketLookup[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const tickets = await prisma.ticket.findMany({
    where: {
      invitation: {
        group: {
          eventId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { guests: { some: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } } },
            ...(digits.length >= 4 ? [{ guests: { some: { phoneE164: { contains: digits } } } }] : []),
          ],
        },
      },
    },
    select: ticketSelect,
    take: 12,
    orderBy: { invitation: { group: { name: "asc" } } },
  });
  return tickets.map(toLookup);
}

// ---------------------------------------------------------------- entree --

export type AdmitResult =
  | { ok: true; quantity: number; forced: boolean; lookup: TicketLookup }
  | { ok: false; reason: "not_found" | "nothing_to_admit" | "conflict"; lookup: TicketLookup | null };

/**
 * Enregistre une entree. L increment est CONDITIONNEL dans la requete
 * elle-meme : deux postes qui scannent le meme QR a la meme seconde ne
 * peuvent pas faire entrer deux fois les memes places (§22).
 */
export async function admit(input: {
  eventId: string;
  ticketId: string;
  quantity: number;
  method: "QR" | "MANUAL";
  operatorName: string;
  stationId: string | null;
  actorId: string | null;
  override?: boolean;
}): Promise<AdmitResult> {
  const t = await prisma.ticket.findFirst({
    where: { id: input.ticketId, invitation: { group: { eventId: input.eventId } } },
    select: { ...ticketSelect, code: true },
  });
  if (!t) return { ok: false, reason: "not_found", lookup: null };

  const state = { seats: t.seats, seatsUsed: t.seatsUsed, cancelledAt: t.cancelledAt, eventStatus: t.invitation.group.event.status };
  const { quantity, forced } = admissionQuantity(state, input.quantity, input.override);
  if (quantity <= 0) return { ok: false, reason: "nothing_to_admit", lookup: toLookup(t) };

  const result = await prisma.$transaction(async (tx) => {
    // Sans forcage : n avance que si les places suffisent ENCORE au moment de l ecriture.
    const updated = forced
      ? await tx.ticket.updateMany({ where: { id: t.id }, data: { seatsUsed: { increment: quantity } } })
      : await tx.$executeRaw`UPDATE "Ticket" SET "seatsUsed" = "seatsUsed" + ${quantity}, "updatedAt" = NOW() WHERE id = ${t.id} AND "cancelledAt" IS NULL AND "seatsUsed" + ${quantity} <= seats`;
    const count = typeof updated === "number" ? updated : updated.count;
    if (count === 0) return null;
    await tx.checkIn.create({
      data: { ticketId: t.id, stationId: input.stationId, operatorName: input.operatorName, quantity, method: input.method, override: forced },
    });
    return quantity;
  });

  if (result === null) {
    const fresh = await findTicketByCode(t.code);
    return { ok: false, reason: "conflict", lookup: fresh ? toLookup(fresh) : null };
  }
  if (forced) {
    await writeAudit({
      actorId: input.actorId,
      action: "checkin.override",
      targetType: "Ticket",
      targetId: t.id,
      metadata: { quantity, operator: input.operatorName, stationId: input.stationId },
    });
  }
  const fresh = await findTicketByCode(t.code);
  return { ok: true, quantity: result, forced, lookup: toLookup(fresh!) };
}

/** Annule la derniere entree d un ticket (erreur de manipulation), jamais plus loin. */
export async function undoLastCheckIn(eventId: string, ticketId: string, actorId: string | null, operatorName: string): Promise<boolean> {
  const last = await prisma.checkIn.findFirst({
    where: { ticketId, ticket: { invitation: { group: { eventId } } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, quantity: true },
  });
  if (!last) return false;
  await prisma.$transaction([
    prisma.checkIn.delete({ where: { id: last.id } }),
    prisma.ticket.update({ where: { id: ticketId }, data: { seatsUsed: { decrement: last.quantity } } }),
  ]);
  await writeAudit({ actorId, action: "checkin.undo", targetType: "Ticket", targetId: ticketId, metadata: { quantity: last.quantity, operator: operatorName } });
  return true;
}
