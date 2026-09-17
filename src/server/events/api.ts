import "server-only";
import { NextResponse } from "next/server";
import type { ZodType, ZodTypeDef } from "zod";
import { auth } from "@/lib/auth";
import type { EventAccessNeed } from "@/lib/events/permissions";
import { checkEventAccess, type EventAccess } from "@/server/events/access-control";

/**
 * Outils communs aux routes /api/organizer/events/*.
 *
 * Refus = 404, comme pour les pages : l API ne doit pas confirmer davantage
 * que l interface qu un evenement existe.
 */

export type RouteResult<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

export async function eventRoute(eventId: string, need: EventAccessNeed): Promise<RouteResult<EventAccess>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifie" }, { status: 401 }) };
  }
  const access = await checkEventAccess(eventId, need);
  if (!access) return { ok: false, response: NextResponse.json({ error: "Introuvable" }, { status: 404 }) };
  return { ok: true, value: access };
}

// Type de SORTIE du schema (apres valeurs par defaut et transformations),
// pas celui de l entree : sinon chaque champ "default" redevient optionnel.
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<RouteResult<T>> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        { error: first?.message ?? "Donnees invalides", issues: parsed.error.issues },
        { status: 422 },
      ),
    };
  }
  return { ok: true, value: parsed.data };
}
