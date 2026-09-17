import { NextResponse } from "next/server";
import { venuesSchema } from "@/lib/validations/event";
import { eventRoute, parseBody } from "@/server/events/api";
import { replaceVenues } from "@/server/events/event.service";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, venuesSchema);
  if (!body.ok) return body.response;

  await replaceVenues(id, body.value.venues);
  return NextResponse.json({ ok: true });
}
