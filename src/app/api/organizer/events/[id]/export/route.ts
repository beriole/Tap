import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessEvent } from "@/lib/events/permissions";
import { buildExportRows, exportFileName, exportMatchesHeadcount, toCsv, type ExportKind } from "@/lib/events/exports";
import { writeAudit } from "@/server/audit";
import { eventRoute } from "@/server/events/api";
import { loadExportGroups } from "@/server/events/headcount";
import { toPdf, toXlsx } from "@/server/events/export-files";
import { dateParts } from "@/lib/events/invitation-view";

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

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as ExportKind | null;
  const format = url.searchParams.get("format") ?? "csv";
  if (!kind || !KINDS.includes(kind)) return NextResponse.json({ error: "Export inconnu" }, { status: 400 });
  if (!["csv", "xlsx", "pdf"].includes(format)) return NextResponse.json({ error: "Format inconnu" }, { status: 400 });

  const [event, groups] = await Promise.all([
    prisma.event.findUniqueOrThrow({ where: { id }, select: { title: true, startsAt: true, timezone: true } }),
    loadExportGroups(id, { sensitive: canAccessEvent(access.value, "sensitive") }),
  ]);

  if (!exportMatchesHeadcount(kind, groups)) {
    console.error("[export] totaux divergents", { eventId: id, kind });
    return NextResponse.json({ error: "Les totaux de cet export ne correspondent pas au tableau de bord. Export refuse." }, { status: 500 });
  }

  await writeAudit({ actorId: access.value.userId, action: "event.export", targetType: "Event", targetId: id, metadata: { kind, format, rows: groups.length } });

  // Un seul calcul des lignes, trois formats.
  const rows = buildExportRows(kind, groups);
  const fileName = exportFileName(kind, event.title).replace(/\.csv$/, `.${format}`);
  const headers = { "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" };
  // Copie dans un ArrayBuffer propre : un Buffer Node peut partager un tampon
  // plus large que son contenu, et Response n accepte pas ce type.
  const asBody = (bytes: Uint8Array) => new Blob([bytes.slice().buffer as ArrayBuffer]);

  if (format === "xlsx") {
    return new NextResponse(asBody(await toXlsx(kind, rows, event.title)), {
      headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    });
  }
  if (format === "pdf") {
    const subtitle = dateParts(event.startsAt, event.timezone).long;
    return new NextResponse(asBody(await toPdf(kind, rows, event.title, subtitle)), { headers: { ...headers, "Content-Type": "application/pdf" } });
  }
  return new NextResponse(toCsv(rows), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
}
