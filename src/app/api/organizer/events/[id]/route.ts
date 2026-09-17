import { NextResponse } from "next/server";
import { eventUpdateSchema } from "@/lib/validations/event";
import { eventRoute, parseBody } from "@/server/events/api";
import { updateEvent } from "@/server/events/event.service";

type Params = { params: Promise<{ id: string }> };

/** Informations generales : titre, hotes, dates, fuseau, capacite. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, eventUpdateSchema);
  if (!body.ok) return body.response;

  await updateEvent(id, body.value);
  return NextResponse.json({ ok: true });
}
