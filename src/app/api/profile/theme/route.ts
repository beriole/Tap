import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileThemeSchema } from "@/lib/validations/theme";

/**
 * §20 - "Le changement de theme conserve toutes les informations et tous les
 * liens" : on ne touche qu a la table ProfileTheme, jamais au contenu.
 */
export async function PUT(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const parsed = profileThemeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Theme invalide", issues: parsed.error.issues }, { status: 422 });
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const theme = await prisma.theme.findUnique({
    where: { key: parsed.data.themeKey },
    select: { id: true, isActive: true },
  });
  if (!theme?.isActive) return NextResponse.json({ error: "Theme indisponible" }, { status: 400 });

  // themeKey a servi a resoudre theme.id ; seules les options de rendu restent.
  const { themeKey, ...settings } = parsed.data;
  void themeKey;

  const saved = await prisma.profileTheme.upsert({
    where: { profileId: profile.id },
    create: { profileId: profile.id, themeId: theme.id, ...settings },
    update: { themeId: theme.id, ...settings },
  });

  return NextResponse.json({ theme: saved });
}
