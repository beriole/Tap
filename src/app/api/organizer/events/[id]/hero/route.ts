import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { deleteObject, putObject, UnsupportedImageError } from "@/lib/storage";
import { eventRoute } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Photo principale de l invitation. Meme discipline que /api/upload pour les profils. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const limit = await rateLimit(`hero:${clientIp(request.headers)}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop d envois. Reessayez dans une minute." }, { status: 429 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Format non supporte (JPEG, PNG, WebP, AVIF)" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (8 Mo maximum)" }, { status: 413 });

  let stored;
  try {
    stored = await putObject({ ownerId: access.value.userId, file });
  } catch (error) {
    if (error instanceof UnsupportedImageError) return NextResponse.json({ error: error.message }, { status: 415 });
    console.error("[hero]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envoi impossible." }, { status: 502 });
  }

  const previous = await prisma.event.findUniqueOrThrow({ where: { id }, select: { heroImageUrl: true } });
  await prisma.event.update({ where: { id }, data: { heroImageUrl: stored.url } });
  if (previous.heroImageUrl && previous.heroImageUrl !== stored.url) await deleteObject(previous.heroImageUrl);

  return NextResponse.json({ url: stored.url });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const current = await prisma.event.findUniqueOrThrow({ where: { id }, select: { heroImageUrl: true } });
  await prisma.event.update({ where: { id }, data: { heroImageUrl: null } });
  if (current.heroImageUrl) await deleteObject(current.heroImageUrl);
  return new NextResponse(null, { status: 204 });
}
