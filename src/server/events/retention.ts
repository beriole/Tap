import "server-only";
import { prisma } from "@/lib/prisma";
import { RETENTION_DAYS, cutoff } from "@/lib/events/retention";
import { writeAudit } from "@/server/audit";

/**
 * Application de la politique de retention (lib/events/retention.ts).
 *
 * Idempotent : rejouer la purge le meme jour ne change rien de plus. Chaque
 * passage qui a touche quelque chose laisse une entree d audit avec les
 * comptes - on doit pouvoir dire QUAND les allergies d un evenement ont ete
 * effacees.
 *
 * Aucune suppression de personne, de groupe ou de reponse : archiver rend
 * les pages inaccessibles, la liste reste a l organisateur.
 */
export type RetentionReport = {
  allergiesCleared: number;
  stationsRevoked: number;
  eventsArchived: number;
  accountTokensDeleted: number;
  invitationsExpired: number;
};

export async function applyRetention(now = new Date()): Promise<RetentionReport> {
  const endedBefore = (days: number) => ({
    OR: [
      { endsAt: { lte: cutoff(now, days) } },
      { endsAt: null, startsAt: { lte: cutoff(now, days) } },
    ],
  });

  // 1. Allergies : J+30 apres la fin, quel que soit le statut de l evenement.
  const allergies = await prisma.guestPreference.updateMany({
    where: { allergies: { not: null }, guest: { group: { event: endedBefore(RETENTION_DAYS.allergies) } } },
    data: { allergies: null },
  });

  // 2. Postes d accueil : J+7.
  const stations = await prisma.checkInStation.updateMany({
    where: { revokedAt: null, event: endedBefore(RETENTION_DAYS.stations) },
    data: { revokedAt: now },
  });

  // 3. Archivage : J+90, seulement ce qui a ete publie (un brouillon oublie reste un brouillon).
  const archived = await prisma.event.updateMany({
    where: { status: { in: ["PUBLISHED", "CLOSED"] }, ...endedBefore(RETENTION_DAYS.archive) },
    data: { status: "ARCHIVED" },
  });

  // 4. Jetons echus : comptes (verification, reinitialisation, invitation) et invitations a date limite.
  const accountTokens = await prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } });
  const invitations = await prisma.invitation.updateMany({
    where: { revokedAt: null, expiresAt: { lt: now } },
    data: { revokedAt: now },
  });

  const report = {
    allergiesCleared: allergies.count,
    stationsRevoked: stations.count,
    eventsArchived: archived.count,
    accountTokensDeleted: accountTokens.count,
    invitationsExpired: invitations.count,
  };
  if (Object.values(report).some((n) => n > 0)) {
    await writeAudit({ action: "retention.apply", targetType: "System", metadata: { ...report, at: now.toISOString() } });
  }
  return report;
}
