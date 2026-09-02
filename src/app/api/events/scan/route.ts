import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordScan } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(6).max(12),
  source: z.enum(["NFC", "QR", "LINK"]).default("NFC"),
});

/**
 * Le scan est normalement enregistre cote serveur par la page /c/[token].
 * Cet endpoint sert aux clients qui rendent le profil depuis un cache (PWA,
 * prefetch) et doivent signaler l ouverture reelle.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`scan:${clientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const card = await prisma.nfcCard.findUnique({
    where: { publicToken: parsed.data.token.toUpperCase() },
    select: { id: true, status: true },
  });
  if (!card || card.status !== "ACTIVE") return new NextResponse(null, { status: 204 });

  await recordScan({
    cardId: card.id,
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    source: parsed.data.source,
  });

  return new NextResponse(null, { status: 204 });
}
