import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assignCardSchema } from "@/lib/validations/card";
import { assignCard } from "@/server/cards";

/**
 * §11 - L association carte/profil est une operation strictement
 * administrative : le client ne peut pas reaffecter sa propre carte.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const parsed = assignCardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const card = await assignCard({ ...parsed.data, actorId: admin.id });
  return NextResponse.json({ card });
}
