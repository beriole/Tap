import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { eventCreateSchema } from "@/lib/validations/event";
import { parseBody } from "@/server/events/api";
import { createEvent } from "@/server/events/event.service";

/**
 * Creation d un evenement. Le createur en devient proprietaire ; il n existe
 * aucun autre moyen de devenir membre d un evenement a ce stade.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const limit = await rateLimit(`event-create:${session.user.id}`, 20, 60 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop d evenements crees en peu de temps. Reessayez plus tard." }, { status: 429 });
  }

  const body = await parseBody(request, eventCreateSchema);
  if (!body.ok) return body.response;

  const event = await createEvent(session.user.id, body.value);
  return NextResponse.json({ id: event.id }, { status: 201 });
}
