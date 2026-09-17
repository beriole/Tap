import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessEvent } from "@/lib/events/permissions";
import { buildExportRows, exportFileName, exportMatchesHeadcount, toCsv, type ExportKind } from "@/lib/events/exports";
import { writeAudit } from "@/server/audit";
import { eventRoute } from "@/server/events/api";
import { loadExportGroups } from "@/server/events/headcount";

type Params = { params: Promise<{ id: string }> };

const KINDS: ExportKind[] = ["guests", "caterer", "checkin"];

/**
 * Export CSV (§9). Permission "exports" ; le texte des allergies exige en
 * plus "sensitive". Chaque export est journalise (§19) : une liste d invites
 * qui sort de la plateforme doit laisser une trace.
 *
 * Le fichier est refuse si ses totaux ne collent pas au dashboard : livrer
 * au traiteur un chiffre faux serait pire qu une erreur affichee.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "exports");
  if (!access.ok) return access.response;

  const kind = new URL(request.url).searchParams.get("kind") as ExportKind | null;
  if (!kind || !KINDS.includes(kind)) return NextResponse.json({ error: "Export inconnu" }, { status: 400 });

  const [event, groups] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id }, select: { title: true } }),
    loadExportGroups(id, { sensitive: canAccessEvent(access.value, "sensitive") }),
  ]);

  if (!exportMatchesHeadcount(kind, groups)) {
    console.error("[export] totaux divergents", { eventId: id, kind });
    return NextResponse.json({ error: "Les totaux de cet export ne correspondent pas au tableau de bord. Export refuse." }, { status: 500 });
  }

  await writeAudit({ actorId: access.value.userId, action: "event.export", targetType: "Event", targetId: id, metadata: { kind, rows: groups.length } });

  return new NextResponse(toCsv(buildExportRows(kind, groups)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(kind, event.title)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
