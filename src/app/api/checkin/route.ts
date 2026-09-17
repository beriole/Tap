import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { extractTicketCode } from "@/lib/events/checkin";
import { stationAdmitSchema, stationLookupSchema, stationOpenSchema } from "@/lib/validations/checkin";
import { admit, lookupTicket, lookupTicketById, openStation, searchTickets, undoLastCheckIn } from "@/server/events/access.service";

/**
 * API du poste d accueil, sans compte (D6) : chaque appel porte le jeton du
 * poste et son PIN, verifies a chaque fois. Pas de session a voler sur un
 * telephone prete pour la soiree.
 *
 * Un PIN faux coute une tentative sur un quota par adresse ET par jeton :
 * dix mille combinaisons ne s essaient pas a l accueil d un mariage.
 */
async function limited(request: Request, token: string) {
  const [byIp, byToken] = await Promise.all([
    rateLimit(`checkin-ip:${clientIp(request.headers)}`, 240, 60_000),
    rateLimit(`checkin-token:${token}`, 240, 60_000),
  ]);
  return !byIp.allowed || !byToken.allowed;
}

async function wrongPin(request: Request, token: string) {
  const [byIp, byToken] = await Promise.all([
    rateLimit(`checkin-pin-ip:${clientIp(request.headers)}`, 8, 15 * 60_000),
    rateLimit(`checkin-pin-token:${token}`, 8, 15 * 60_000),
  ]);
  return !byIp.allowed || !byToken.allowed;
}

const unauthorized = () => NextResponse.json({ error: "Lien ou code PIN incorrect." }, { status: 401 });
const tooMany = () => NextResponse.json({ error: "Trop de tentatives. Patientez quelques minutes." }, { status: 429 });

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const json = await request.json().catch(() => null);

  if (action === "open") {
    const parsed = stationOpenSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Donnees invalides" }, { status: 422 });
    if (await wrongPin(request, parsed.data.token)) return tooMany();
    const station = await openStation(parsed.data.token, parsed.data.pin);
    if (!station) return unauthorized();
    return NextResponse.json({ station: { id: station.id, label: station.label }, event: { title: station.event.title, status: station.event.status } });
  }

  if (action === "lookup") {
    const parsed = stationLookupSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });
    if (await limited(request, parsed.data.token)) return tooMany();
    const station = await openStation(parsed.data.token, parsed.data.pin);
    if (!station) {
      if (await wrongPin(request, parsed.data.token)) return tooMany();
      return unauthorized();
    }
    if (parsed.data.scanned !== undefined) {
      const code = extractTicketCode(parsed.data.scanned);
      const ticket = code ? await lookupTicket(station.event.id, code) : null;
      return NextResponse.json({ ticket, unknown: !ticket });
    }
    return NextResponse.json({ results: await searchTickets(station.event.id, parsed.data.query ?? "") });
  }

  if (action === "admit") {
    const parsed = stationAdmitSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });
    if (await limited(request, parsed.data.token)) return tooMany();
    const station = await openStation(parsed.data.token, parsed.data.pin);
    if (!station) {
      if (await wrongPin(request, parsed.data.token)) return tooMany();
      return unauthorized();
    }
    if (parsed.data.undo) {
      const done = await undoLastCheckIn(station.event.id, parsed.data.ticketId, null, parsed.data.operatorName);
      return NextResponse.json({ ok: done, ticket: done ? await lookupTicketById(station.event.id, parsed.data.ticketId) : null });
    }
    const result = await admit({
      eventId: station.event.id,
      ticketId: parsed.data.ticketId,
      quantity: parsed.data.quantity,
      method: parsed.data.method,
      operatorName: parsed.data.operatorName,
      stationId: station.id,
      actorId: null,
      override: parsed.data.override,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
