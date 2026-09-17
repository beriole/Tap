import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePastedGuests } from "@/lib/events/paste-import";
import { importCommitSchema, importPreviewSchema } from "@/lib/validations/guest";
import { canAccessEvent } from "@/lib/events/permissions";
import { eventRoute, parseBody } from "@/server/events/api";
import { createGroups, existingGuestsForDuplicates, GuestError } from "@/server/events/guest.service";

type Params = { params: Promise<{ id: string }> };

/**
 * Import par copier-coller, en deux temps (§8.2) :
 *  - POST : analyse. Rien n est ecrit ; on renvoie des lignes annotees
 *    (numero normalise, problemes, doublons contre la base).
 *  - PUT  : enregistrement des groupes relus et corriges par l organisateur.
 *
 * Aucune invitation ne part d ici : l import cree des liens, il n envoie rien.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "guests");
  if (!access.ok) return access.response;

  const body = await parseBody(request, importPreviewSchema);
  if (!body.ok) return body.response;

  const [event, existing] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id }, select: { defaultCountry: true } }),
    existingGuestsForDuplicates(id),
  ]);
  const rows = parsePastedGuests(body.value.text, { defaultCountry: event.defaultCountry, existing });
  if (rows.length > 3000) {
    return NextResponse.json({ error: "3000 lignes maximum par collage." }, { status: 422 });
  }
  // `existing` permet a l ecran de relancer la detection des doublons apres
  // chaque correction. Rien de nouveau n est expose : la permission "guests"
  // donne deja acces a cette liste.
  return NextResponse.json({ rows, existing });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "guests");
  if (!access.ok) return access.response;

  const body = await parseBody(request, importCommitSchema);
  if (!body.ok) return body.response;

  try {
    const created = await createGroups(id, body.value.groups, access.value.userId, {
      canEditSensitive: canAccessEvent(access.value, "sensitive"),
    });
    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error) {
    if (error instanceof GuestError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
