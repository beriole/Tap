import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateShareSlug } from "@/lib/tokens";
import { shareLinkCreateSchema, shareLinkUpdateSchema } from "@/lib/validations/share-link";
import { revalidateShare, shareUrl } from "@/server/share-links";

/**
 * Liens de partage restreints du client connecte.
 *
 * Tout passe par le profil possede : on ne fait jamais confiance a un
 * identifiant venu du navigateur pour decider a qui appartient un lien (§12).
 */
async function ownedProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.profile.findFirst({ where: { userId }, select: { id: true } });
  return profile?.id ?? null;
}

/** Transforme la liste de champs cochee en carte de visibilite. */
function toVisibility(fields: string[]): Record<string, boolean> {
  return Object.fromEntries(fields.map((f) => [f, true]));
}

/** Resout la cle de theme en identifiant, en refusant les themes desactives. */
async function resolveTheme(themeKey: string | null | undefined) {
  if (!themeKey) return null;
  const theme = await prisma.theme.findUnique({
    where: { key: themeKey },
    select: { id: true, isActive: true },
  });
  return theme?.isActive ? theme.id : null;
}

export async function POST(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const profileId = await ownedProfileId(user.id);
  if (!profileId) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const parsed = shareLinkCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Donnees invalides", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  // Les liens choisis doivent appartenir au profil : sans ce controle, on
  // pourrait exposer le lien d un autre client dans sa propre page.
  const owned = await prisma.profileLink.findMany({
    where: { id: { in: parsed.data.linkIds }, profileId },
    select: { id: true },
  });
  if (owned.length !== parsed.data.linkIds.length) {
    return NextResponse.json({ error: "Liens invalides" }, { status: 403 });
  }

  // Collision quasi impossible sur dix caracteres, mais on ne parie pas
  // l unicite d une URL publique sur une probabilite.
  let slug = generateShareSlug();
  while (await prisma.shareLink.findUnique({ where: { slug }, select: { id: true } })) {
    slug = generateShareSlug();
  }

  const share = await prisma.shareLink.create({
    data: {
      profileId,
      slug,
      label: parsed.data.label,
      note: parsed.data.note ?? null,
      fieldVisibility: toVisibility(parsed.data.fields),
      linkIds: parsed.data.linkIds,
      themeId: await resolveTheme(parsed.data.themeKey),
      accentColor: parsed.data.accentColor ?? null,
      mode: parsed.data.mode ?? null,
      buttonStyle: parsed.data.buttonStyle ?? null,
      isActive: parsed.data.isActive,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  return NextResponse.json({ share, url: shareUrl(share.slug) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const parsed = shareLinkUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Donnees invalides", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { id, fields, linkIds, themeKey, expiresAt, ...rest } = parsed.data;
  const existing = await prisma.shareLink.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { id: true, slug: true, profileId: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (linkIds) {
    const owned = await prisma.profileLink.findMany({
      where: { id: { in: linkIds }, profileId: existing.profileId },
      select: { id: true },
    });
    if (owned.length !== linkIds.length) {
      return NextResponse.json({ error: "Liens invalides" }, { status: 403 });
    }
  }

  const share = await prisma.shareLink.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(fields ? { fieldVisibility: toVisibility(fields) } : {}),
      ...(linkIds ? { linkIds } : {}),
      ...(themeKey !== undefined ? { themeId: await resolveTheme(themeKey) } : {}),
      ...(expiresAt !== undefined
        ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
        : {}),
    },
  });

  revalidateShare(existing.slug);
  return NextResponse.json({ share, url: shareUrl(share.slug) });
}

export async function DELETE(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const existing = await prisma.shareLink.findFirst({
    where: { id, profile: { userId: user.id } },
    select: { id: true, slug: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.shareLink.delete({ where: { id: existing.id } });
  revalidateShare(existing.slug);
  return new NextResponse(null, { status: 204 });
}
