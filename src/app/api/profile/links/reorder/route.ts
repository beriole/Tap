import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reorderSchema } from "@/lib/validations/link";
import { revalidateProfileCards } from "@/server/card-resolution";

/** §6.2 - "Ordre des liens par glisser-deposer." Ecriture atomique. */
export async function PUT(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const owned = await prisma.profileLink.findMany({
    where: { id: { in: parsed.data.order }, profile: { userId: user.id } },
    select: { id: true, profileId: true },
  });
  if (owned.length !== parsed.data.order.length) {
    return NextResponse.json({ error: "Liens invalides" }, { status: 403 });
  }

  await prisma.$transaction(
    parsed.data.order.map((id, position) =>
      prisma.profileLink.update({ where: { id }, data: { position } }),
    ),
  );

  await revalidateProfileCards(owned[0].profileId);

  return new NextResponse(null, { status: 204 });
}
