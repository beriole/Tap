import { NextResponse } from "next/server";
import type { LinkType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkLinkValue, linkSchema, linkUpdateSchema } from "@/lib/validations/link";
import { LINK_TYPES } from "@/config/link-types";

/** Verifie que le profil vise appartient bien au client connecte (§12, §20). */
async function ownedProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.profile.findFirst({ where: { userId }, select: { id: true } });
  return profile?.id ?? null;
}

/** §5.3 - creation d un lien dynamique, place en fin de liste. */
export async function POST(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const profileId = await ownedProfileId(user.id);
  if (!profileId) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const parsed = linkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides", issues: parsed.error.issues }, { status: 422 });
  }

  const last = await prisma.profileLink.findFirst({
    where: { profileId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const type = parsed.data.type as LinkType;
  const link = await prisma.profileLink.create({
    data: {
      ...parsed.data,
      type,
      icon: parsed.data.icon ?? LINK_TYPES[type]?.icon ?? null,
      profileId,
      position: (last?.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}

/** §5.3 - edition d un lien (titre, valeur, icone, couleur, visibilite). */
export async function PATCH(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const parsed = linkUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides", issues: parsed.error.issues }, { status: 422 });
  }

  const { id, ...data } = parsed.data;
  const owned = await prisma.profileLink.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { id: true, type: true },
  });
  if (!owned) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Le type peut ne pas etre renvoye : on valide alors la nouvelle valeur
  // contre le type deja enregistre (§11).
  if (data.value !== undefined) {
    const checked = checkLinkValue(data.type ?? owned.type, data.value);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.reason }, { status: 422 });
    }
  }

  const link = await prisma.profileLink.update({
    where: { id },
    data: { ...data, type: data.type as LinkType | undefined },
  });
  return NextResponse.json({ link });
}

/**
 * §11 - "Un lien masque reste enregistre mais n apparait pas sur le profil."
 * La suppression definitive reste possible et explicite via cette route.
 */
export async function DELETE(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const owned = await prisma.profileLink.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.profileLink.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
