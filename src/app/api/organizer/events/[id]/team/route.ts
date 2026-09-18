import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eventPlan } from "@/config/event-plans";
import { EVENT_PERMISSIONS, isEventPermission } from "@/lib/events/permissions";
import { generateSecureToken } from "@/lib/tokens";
import { writeAudit } from "@/server/audit";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

const permissions = z.array(z.string().refine(isEventPermission)).max(EVENT_PERMISSIONS.length);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail invalide."),
  name: z.string().trim().min(2, "Prenom et nom.").max(80),
  permissions,
});

const updateSchema = z.object({ memberId: z.string().cuid(), permissions });

/**
 * Equipe d un evenement (D5). Reserve au proprietaire ("team").
 *
 * Inviter cree le compte s il n existe pas et rend un lien d activation que
 * l organisateur transmet lui-meme (l envoi d e-mail n est pas configure) ;
 * un compte existant est simplement rattache. Un co-organisateur n obtient
 * jamais "team" : l equipe ne se gere que par le proprietaire.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "team");
  if (!access.ok) return access.response;

  const body = await parseBody(request, inviteSchema);
  if (!body.ok) return body.response;
  const granted = body.value.permissions.filter((p) => p !== "team");

  const [event, count] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id }, select: { plan: true, title: true } }),
    prisma.eventMember.count({ where: { eventId: id, role: "COORGANIZER" } }),
  ]);
  const plan = eventPlan(event.plan);
  if (count >= plan.maxCoorganizers) {
    return NextResponse.json({ error: `L offre ${plan.name} permet ${plan.maxCoorganizers} co-organisateur(s).` }, { status: 409 });
  }

  let user = await prisma.user.findUnique({ where: { email: body.value.email }, select: { id: true, status: true } });
  let inviteUrl: string | null = null;
  if (!user) {
    const token = generateSecureToken();
    user = await prisma.user.create({
      data: {
        email: body.value.email,
        name: body.value.name,
        role: "CLIENT",
        status: "INVITED",
        tokens: { create: { identifier: body.value.email, token, purpose: "INVITE", expires: new Date(Date.now() + 14 * 86_400_000) } },
      },
      select: { id: true, status: true },
    });
    inviteUrl = `/reset-password?token=${token}`;
  } else if (user.id === access.value.userId) {
    return NextResponse.json({ error: "Vous etes deja proprietaire de cet evenement." }, { status: 409 });
  }

  const existing = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId: id, userId: user.id } } });
  if (existing) return NextResponse.json({ error: "Cette personne fait deja partie de l equipe." }, { status: 409 });

  const member = await prisma.eventMember.create({
    data: { eventId: id, userId: user.id, role: "COORGANIZER", permissions: granted },
    select: { id: true },
  });
  await writeAudit({ actorId: access.value.userId, action: "team.invite", targetType: "Event", targetId: id, metadata: { userId: user.id, permissions: granted } });

  return NextResponse.json({ memberId: member.id, inviteUrl, pending: user.status === "INVITED" }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "team");
  if (!access.ok) return access.response;

  const body = await parseBody(request, updateSchema);
  if (!body.ok) return body.response;

  // Le proprietaire ne se modifie pas lui-meme ; seuls les co-organisateurs de CET evenement.
  const updated = await prisma.eventMember.updateMany({
    where: { id: body.value.memberId, eventId: id, role: "COORGANIZER" },
    data: { permissions: body.value.permissions.filter((p) => p !== "team") },
  });
  if (!updated.count) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await writeAudit({ actorId: access.value.userId, action: "team.permissions", targetType: "EventMember", targetId: body.value.memberId, metadata: { permissions: body.value.permissions } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "team");
  if (!access.ok) return access.response;

  const memberId = z.string().cuid().safeParse(new URL(request.url).searchParams.get("member"));
  if (!memberId.success) return NextResponse.json({ error: "Membre requis" }, { status: 400 });

  const removed = await prisma.eventMember.deleteMany({ where: { id: memberId.data, eventId: id, role: "COORGANIZER" } });
  if (!removed.count) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await writeAudit({ actorId: access.value.userId, action: "team.remove", targetType: "EventMember", targetId: memberId.data });
  return new NextResponse(null, { status: 204 });
}
