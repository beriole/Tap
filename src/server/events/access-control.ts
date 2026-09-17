import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canAccessEvent, type EventAccessNeed } from "@/lib/events/permissions";

/**
 * Garde unique de TOUT acces organisateur a un evenement (§19, §22).
 *
 * Chaque page, route ou action qui recoit un identifiant d evenement passe par
 * ici avant la moindre lecture. On ne se fie jamais a ce que l interface
 * affiche ou masque.
 *
 * Refus = 404, pas 403 : repondre "interdit" confirmerait qu un evenement
 * existe sous cet identifiant. Modifier un ID dans l URL ne doit rien
 * apprendre a personne.
 *
 * `cache` : une meme requete (layout + page) ne relit l appartenance qu une fois.
 */
const loadMembership = cache(async (eventId: string, userId: string) =>
  prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { role: true, permissions: true },
  }),
);

export type EventAccess = {
  userId: string;
  eventId: string;
  role: "OWNER" | "COORGANIZER";
  permissions: string[];
};

/** Pour les pages : 404 si l acces est refuse. */
export async function requireEventAccess(eventId: string, need: EventAccessNeed = "view"): Promise<EventAccess> {
  const access = await checkEventAccess(eventId, need);
  if (!access) notFound();
  return access;
}

/** Pour les routes API : null si refuse, a traduire en 404 par l appelant. */
export async function checkEventAccess(eventId: string, need: EventAccessNeed = "view"): Promise<EventAccess | null> {
  const user = await requireUser();
  // Un cuid fait 25 caracteres ; inutile d interroger la base pour autre chose.
  if (!/^[a-z0-9]{20,32}$/.test(eventId)) return null;

  const member = await loadMembership(eventId, user.id);
  if (!canAccessEvent(member, need)) return null;
  return { userId: user.id, eventId, role: member!.role, permissions: member!.permissions };
}
