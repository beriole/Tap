import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isInvitationToken, stateAfterOpen } from "@/lib/events/invitation-access";

const schema = z.object({ token: z.string().refine(isInvitationToken) });

/**
 * Ouverture d une invitation, signalee par le navigateur de l invite.
 *
 * Pourquoi pas cote serveur, au rendu, comme les scans de cartes : quand
 * l organisateur colle le lien dans WhatsApp, les robots d apercu (WhatsApp,
 * Facebook, Telegram) telechargent la page. Comptee au rendu, chaque
 * invitation serait "ouverte" des son envoi, et la liste des relances
 * (§9 "non ouvertes") deviendrait fausse. Ces robots n executent pas de
 * JavaScript : ce signal-ci ne vient que d un vrai navigateur.
 *
 * Les membres de l evenement qui ouvrent un lien pour verifier ne comptent
 * pas non plus. Reponse toujours 204 : rien a apprendre sur le jeton.
 */
export async function POST(request: Request) {
  const limit = await rateLimit(`invitation-open:${clientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 204 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const invitation = await prisma.invitation.findUnique({
    where: { token: parsed.data.token },
    select: { id: true, state: true, firstOpenedAt: true, revokedAt: true, group: { select: { eventId: true } } },
  });
  if (!invitation || invitation.revokedAt) return new NextResponse(null, { status: 204 });

  const session = await auth();
  if (session?.user?.id) {
    const member = await prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId: invitation.group.eventId, userId: session.user.id } },
      select: { id: true },
    });
    if (member) return new NextResponse(null, { status: 204 });
  }

  const now = new Date();
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      state: stateAfterOpen(invitation.state),
      firstOpenedAt: invitation.firstOpenedAt ?? now,
      lastOpenedAt: now,
      openCount: { increment: 1 },
    },
  });
  return new NextResponse(null, { status: 204 });
}
