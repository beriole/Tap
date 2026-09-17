import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSecureToken } from "@/lib/tokens";
import { stateAfterRegenerate, stateAfterShare } from "@/lib/events/share";
import { writeAudit } from "@/server/audit";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string; groupId: string }> };

const schema = z.object({ action: z.enum(["shared", "revoke", "regenerate"]) });

/**
 * Cycle de vie d un lien d invitation (plan phase 6, D4). Permission "messages".
 *
 * - shared     : l organisateur confirme avoir envoye le message. N avance
 *                l etat que depuis "creee" : jamais de retour en arriere.
 * - revoke     : le lien cesse de fonctionner immediatement (page neutre).
 * - regenerate : nouveau jeton. L ancien est mort ; une reponse deja donnee
 *                reste acquise. C est le geste quand un lien a circule trop loin.
 *
 * Revocation et regeneration sont journalisees (§19).
 */
export async function POST(request: Request, { params }: Params) {
  const { id, groupId } = await params;
  const access = await eventRoute(id, "messages");
  if (!access.ok) return access.response;

  const body = await parseBody(request, schema);
  if (!body.ok) return body.response;

  // Toujours cherche DANS l evenement autorise.
  const invitation = await prisma.invitation.findFirst({
    where: { groupId, group: { eventId: id } },
    select: { id: true, state: true, sharedAt: true, revokedAt: true, response: { select: { id: true } } },
  });
  if (!invitation) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const now = new Date();
  switch (body.value.action) {
    case "shared": {
      if (invitation.revokedAt) return NextResponse.json({ error: "Ce lien est revoque : regenerez-le avant de le partager." }, { status: 409 });
      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: { state: stateAfterShare(invitation.state), sharedAt: invitation.sharedAt ?? now },
        select: { state: true, sharedAt: true },
      });
      return NextResponse.json(updated);
    }
    case "revoke": {
      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: { state: "REVOKED", revokedAt: now },
        select: { state: true },
      });
      await writeAudit({ actorId: access.value.userId, action: "invitation.revoke", targetType: "GuestGroup", targetId: groupId });
      return NextResponse.json(updated);
    }
    case "regenerate": {
      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          token: generateSecureToken(32),
          state: stateAfterRegenerate(Boolean(invitation.response)),
          revokedAt: null,
          sharedAt: null,
          // Les ouvertures de l ancien lien ne disent rien du nouveau.
          firstOpenedAt: null,
          lastOpenedAt: null,
          openCount: 0,
        },
        select: { state: true, token: true },
      });
      await writeAudit({ actorId: access.value.userId, action: "invitation.regenerate", targetType: "GuestGroup", targetId: groupId });
      return NextResponse.json(updated);
    }
  }
}
