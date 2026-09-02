import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { deleteObject, putObject, storageDriver } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const KINDS = { avatar: "avatarUrl", cover: "coverUrl", logo: "logoUrl" } as const;

/**
 * §5.2 - Photo, couverture et logo du profil.
 *
 * L URL est ecrite directement sur le profil du client connecte : c est le
 * serveur qui decide de quel profil il s agit, jamais le client.
 */
export async function POST(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const limit = rateLimit(`upload:${clientIp(request.headers)}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de requetes" }, { status: 429 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "avatar") as keyof typeof KINDS;

  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporte (JPEG, PNG, WebP, AVIF)" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (5 Mo maximum)" }, { status: 413 });
  }
  if (!(kind in KINDS)) {
    return NextResponse.json({ error: "Type d image inconnu" }, { status: 400 });
  }

  const column = KINDS[kind];
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true, avatarUrl: true, coverUrl: true, logoUrl: true },
  });
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  let stored;
  try {
    stored = await putObject({ ownerId: user.id, file });
  } catch (error) {
    // Message utilisable par le client, detail complet dans les journaux.
    console.error("[upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Envoi impossible." },
      { status: 502 },
    );
  }

  const previous = profile[column];

  await prisma.profile.update({
    where: { id: profile.id },
    data: { [column]: stored.url },
  });

  // Menage APRES l enregistrement : si la suppression echoue, le profil pointe
  // deja sur la nouvelle image. L inverse laisserait le client sans photo.
  if (previous && previous !== stored.url) {
    await deleteObject(previous);
  }

  return NextResponse.json({ url: stored.url, driver: storageDriver() });
}
