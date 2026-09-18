import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyRetention } from "@/server/events/retention";

export const dynamic = "force-dynamic";

/**
 * Purge quotidienne (vercel.json → crons). Vercel appelle cette route avec
 * `Authorization: Bearer ${CRON_SECRET}` ; sans secret configure, la route
 * n existe pas (404) plutot que de tourner ouverte.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const report = await applyRetention();
  return NextResponse.json(report);
}
