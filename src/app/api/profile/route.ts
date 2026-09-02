import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/profile";
import { siteConfig } from "@/config/site";

/** GET : profil du client connecte (jamais celui d un autre - §12, §20). */
export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    include: { links: { orderBy: { position: "asc" } }, theme: { include: { theme: true } } },
  });

  return NextResponse.json({ profile });
}

/**
 * PUT : mise a jour du profil.
 * §11 - "Les modifications du profil sont visibles immediatement apres
 * publication" : on revalide donc chaque URL de carte associee.
 */
export async function PUT(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides", issues: parsed.error.issues }, { status: 422 });
  }

  const existing = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  const data = { ...parsed.data, userId: user.id };
  const profile = existing
    ? await prisma.profile.update({ where: { id: existing.id }, data })
    : await prisma.profile.create({ data });

  const cards = await prisma.nfcCard.findMany({
    where: { assignedProfileId: profile.id },
    select: { publicToken: true },
  });
  for (const card of cards) {
    revalidatePath(`${siteConfig.cardPath}/${card.publicToken}`);
  }

  return NextResponse.json({ profile });
}
