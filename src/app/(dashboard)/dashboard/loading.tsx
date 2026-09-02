import { PageSkeleton } from "@/components/app/skeleton";

/**
 * Rendu instantanement des qu un onglet est clique, jusqu a ce que la page
 * soit prete. Sans ce fichier, le routeur laisse la page precedente a l ecran
 * et la navigation parait ne rien faire.
 */
export default function Loading() {
  return <PageSkeleton />;
}
