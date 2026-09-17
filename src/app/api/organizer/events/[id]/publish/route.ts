import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ published: z.boolean() });

/**
 * Publier / depublier (§5 etape 06).
 *
 * Tant qu un evenement est en brouillon, TOUS ses liens repondent la page
 * neutre - on peut preparer et verifier sans qu une invitation partie trop
 * tot ne montre un contenu inacheve.
 *
 * publishedAt n est pose qu a la premiere publication : c est la reference du
 * bandeau "mis a jour", qui ne doit pas se remettre a zero a chaque aller-retour.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, schema);
  if (!body.ok) return body.response;

  const current = await prisma.event.findUniqueOrThrow({ where: { id }, select: { status: true, publishedAt: true } });
  if (current.status === "ARCHIVED") {
    return NextResponse.json({ error: "Un evenement archive ne se publie plus." }, { status: 409 });
  }

  const status = body.value.published ? "PUBLISHED" : "DRAFT";
  await prisma.event.update({
    where: { id },
    data: { status, publishedAt: body.value.published ? (current.publishedAt ?? new Date()) : current.publishedAt },
  });
  await writeAudit({ actorId: access.value.userId, action: body.value.published ? "event.publish" : "event.unpublish", targetType: "Event", targetId: id });
  return NextResponse.json({ status });
}
