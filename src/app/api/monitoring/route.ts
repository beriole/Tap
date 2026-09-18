import { NextResponse } from "next/server";
import { z } from "zod";
import { reportError } from "@/lib/monitoring";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().trim().min(1).max(500),
  name: z.string().trim().max(80).optional(),
  stack: z.string().max(4000).optional(),
  url: z.string().max(500).optional(),
});

/**
 * Erreurs du navigateur (limite d erreur globale). Peu de champs, tres peu
 * par adresse : un point de collecte ouvert est aussi un point de spam.
 */
export async function POST(request: Request) {
  const limit = await rateLimit(`monitoring:${clientIp(request.headers)}`, 5, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const error = new Error(parsed.data.message);
  error.name = parsed.data.name ?? "ClientError";
  error.stack = parsed.data.stack;
  await reportError(error, { url: parsed.data.url, source: "browser" });
  return new NextResponse(null, { status: 204 });
}
