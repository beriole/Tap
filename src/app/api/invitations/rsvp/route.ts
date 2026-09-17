import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { rsvpSubmissionSchema } from "@/lib/validations/rsvp";
import { submitRsvp } from "@/server/events/rsvp.service";

const STATUS = { NOT_FOUND: 404, CLOSED: 409, LOCKED: 409, CONFLICT: 409, QUOTA: 422, CONSENT: 422, INVALID: 422 } as const;

/**
 * Reponse d un invite, sans compte : le jeton fait foi (§6, §19).
 * Limitee par adresse ET par jeton - un formulaire rejoue en boucle ne doit
 * pas saturer l historique d une famille.
 */
export async function POST(request: Request) {
  const ipLimit = await rateLimit(`rsvp:${clientIp(request.headers)}`, 20, 60_000);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Trop d’envois. Réessayez dans une minute." }, { status: 429 });

  const parsed = rsvpSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Réponse incomplète." }, { status: 422 });

  const tokenLimit = await rateLimit(`rsvp-token:${parsed.data.token}`, 10, 60_000);
  if (!tokenLimit.allowed) return NextResponse.json({ error: "Trop d’envois. Réessayez dans une minute." }, { status: 429 });

  const result = await submitRsvp(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: STATUS[result.code] });
  return NextResponse.json(result);
}
