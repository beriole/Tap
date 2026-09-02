import { NextResponse } from "next/server";
import { z } from "zod";
import { recordClick } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  profileId: z.string().cuid(),
  linkId: z.string().cuid().nullable().optional(),
  action: z.enum([
    "LINK", "CALL", "WHATSAPP", "EMAIL", "VCARD", "SHARE", "COPY_LINK", "QR", "DIRECTIONS",
  ]),
});

/** §15 - collecte minimale : ni IP, ni identifiant de visiteur n est stocke. */
export async function POST(request: Request) {
  const limit = rateLimit(`click:${clientIp(request.headers)}`, 60, 60_000);
  if (!limit.allowed) return new NextResponse(null, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  await recordClick(parsed.data);
  return new NextResponse(null, { status: 204 });
}
