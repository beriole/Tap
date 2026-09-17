import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eventPlan } from "@/config/event-plans";
import { stationCreateSchema } from "@/lib/validations/checkin";
import { eventRoute, parseBody } from "@/server/events/api";
import { createStation, revokeStation } from "@/server/events/access.service";

type Params = { params: Promise<{ id: string }> };

/**
 * Postes d accueil (D6). Permission "checkin".
 * Le PIN n est renvoye qu a la creation : il n existe ensuite que hache.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "checkin");
  if (!access.ok) return access.response;

  const body = await parseBody(request, stationCreateSchema);
  if (!body.ok) return body.response;

  const [event, active] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id }, select: { plan: true } }),
    prisma.checkInStation.count({ where: { eventId: id, revokedAt: null } }),
  ]);
  const plan = eventPlan(event.plan);
  if (active >= plan.maxCheckInStations) {
    return NextResponse.json({ error: `L offre ${plan.name} permet ${plan.maxCheckInStations} poste(s) d accueil actif(s).` }, { status: 409 });
  }

  const station = await createStation(id, body.value.label, access.value.userId);
  return NextResponse.json(station, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "checkin");
  if (!access.ok) return access.response;

  const stationId = z.string().cuid().safeParse(new URL(request.url).searchParams.get("station"));
  if (!stationId.success) return NextResponse.json({ error: "Poste requis" }, { status: 400 });

  const done = await revokeStation(id, stationId.data, access.value.userId);
  return done ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Introuvable" }, { status: 404 });
}
