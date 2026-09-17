import "server-only";
import { canAccessEvent, type EventAccessNeed } from "@/lib/events/permissions";
import { requireEventAccess } from "@/server/events/access-control";

/**
 * Acces + onglets autorises, pour les pages d un evenement.
 * Une seule fonction pour que chaque page calcule les onglets de la meme facon.
 */
export async function eventPageContext(eventId: string, need: EventAccessNeed) {
  const access = await requireEventAccess(eventId, need);
  const can = (n: EventAccessNeed) => canAccessEvent(access, n);
  return {
    access,
    can,
    tabs: { content: can("design"), guests: can("guests") },
  };
}
