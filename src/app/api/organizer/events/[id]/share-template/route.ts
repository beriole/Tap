import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ template: z.string().max(1000, "1000 caracteres maximum.").nullable() });

/** Modele du message de partage. Vide = modele par defaut. Permission "messages". */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "messages");
  if (!access.ok) return access.response;

  const body = await parseBody(request, schema);
  if (!body.ok) return body.response;

  const template = body.value.template?.trim() || null;
  await prisma.event.update({ where: { id }, data: { shareTemplate: template } });
  return NextResponse.json({ template });
}
