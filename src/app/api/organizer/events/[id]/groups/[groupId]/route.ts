import { NextResponse } from "next/server";
import { groupUpdateSchema } from "@/lib/validations/guest";
import { canAccessEvent } from "@/lib/events/permissions";
import { eventRoute, parseBody } from "@/server/events/api";
import { deleteGroup, GuestError, updateGroup } from "@/server/events/guest.service";

type Params = { params: Promise<{ id: string; groupId: string }> };

function errorResponse(error: unknown) {
  if (error instanceof GuestError) {
    return NextResponse.json({ error: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 });
  }
  throw error;
}

/**
 * Le groupe est toujours cherche DANS l evenement autorise (eventId + groupId) :
 * un groupId d un autre evenement, meme valide, donne 404.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id, groupId } = await params;
  const access = await eventRoute(id, "guests");
  if (!access.ok) return access.response;

  const body = await parseBody(request, groupUpdateSchema);
  if (!body.ok) return body.response;

  try {
    await updateGroup(id, groupId, body.value, access.value.userId, {
      canEditSensitive: canAccessEvent(access.value, "sensitive"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, groupId } = await params;
  const access = await eventRoute(id, "guests");
  if (!access.ok) return access.response;

  try {
    await deleteGroup(id, groupId, access.value.userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
