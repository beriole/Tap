import { NextResponse } from "next/server";
import { sectionsSchema } from "@/lib/validations/event";
import { eventRoute, parseBody } from "@/server/events/api";
import { replaceSections } from "@/server/events/event.service";

type Params = { params: Promise<{ id: string }> };

/** Programme, dress code, menu, FAQ, texte libre - chacun valide selon son type. */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, sectionsSchema);
  if (!body.ok) return body.response;

  await replaceSections(id, body.value.sections);
  return NextResponse.json({ ok: true });
}
