import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createCardsSchema, cardStatusSchema } from "@/lib/validations/card";
import { createCardBatch, setCardStatus } from "@/server/cards";
import { cardUrl } from "@/config/site";

/** §16 - Cartes NFC : creer lot, token, statut, association, historique. */
export async function GET(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const batch = url.searchParams.get("batch");

  const cards = await prisma.nfcCard.findMany({
    where: {
      status: status ? (status as never) : undefined,
      batch: batch ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { assignedProfile: { select: { id: true, displayName: true } } },
  });

  return NextResponse.json({
    cards: cards.map((c) => ({ ...c, url: cardUrl(c.publicToken) })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const parsed = createCardsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const cards = await createCardBatch({ ...parsed.data, actorId: admin.id });
  return NextResponse.json({ cards }, { status: 201 });
}

/** §5.6 - changement d etat : suspendue, perdue, remplacee. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const parsed = cardStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const card = await setCardStatus({ ...parsed.data, actorId: admin.id });
  return NextResponse.json({ card });
}
