import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Sonde de sante pour l orchestrateur (Docker, Railway, Fly, load balancer).
 *
 * Elle interroge reellement la base : un serveur qui repond alors que
 * PostgreSQL est tombe est pire qu un serveur arrete, car le trafic continue
 * de lui etre envoye.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Aucun detail de l erreur : une sonde publique ne decrit pas
    // l infrastructure a qui la sollicite.
    return NextResponse.json(
      { status: "degraded", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
