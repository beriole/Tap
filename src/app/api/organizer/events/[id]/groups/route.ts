import { NextResponse } from "next/server";
import { groupCreateSchema } from "@/lib/validations/guest";
import { canAccessEvent } from "@/lib/events/permissions";
import { eventRoute, parseBody } from "@/server/events/api";
import { createGroups, GuestError } from "@/server/events/guest.service";

type Params = { params: Promise<{ id: string }> };

/** Ajout manuel d un groupe (famille, couple, personne seule). */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "guests");
  if (!access.ok) return access.response;

  const body = await parseBody(request, groupCreateSchema);
  if (!body.ok) return body.response;

  try {
    const [group] = await createGroups(id, [body.value], access.value.userId, {
      canEditSensitive: canAccessEvent(access.value, "sensitive"),
    });
    return NextResponse.json({ id: group!.id }, { status: 201 });
  } catch (error) {
    if (error instanceof GuestError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
