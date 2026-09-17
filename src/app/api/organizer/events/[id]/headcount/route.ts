import { NextResponse } from "next/server";
import { eventRoute } from "@/server/events/api";
import { loadEventHeadcount } from "@/server/events/headcount";

type Params = { params: Promise<{ id: string }> };

/**
 * Totaux du tableau de bord, pour le rafraichissement automatique.
 *
 * router.refresh() ne remplacait pas l arbre dans tous les cas (le flux RSC
 * arrivait avec la bonne valeur, l ecran gardait l ancienne). Une lecture
 * JSON directe, sans cache, est plus simple a garantir - et bien plus legere
 * qu un rendu complet toutes les dix secondes.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "view");
  if (!access.ok) return access.response;

  const headcount = await loadEventHeadcount(id);
  return NextResponse.json(headcount, { headers: { "Cache-Control": "private, no-store" } });
}
