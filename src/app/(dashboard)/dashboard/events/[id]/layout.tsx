/**
 * Segment d un evenement : toujours rendu a la demande.
 *
 * Sans cette declaration, router.refresh() recevait une version deja rendue :
 * le tableau de bord affichait 68 attendus alors que la base en comptait 77.
 * Les chiffres d un evenement changent a chaque reponse d invite ; aucune
 * page de ce segment ne doit etre servie depuis un cache de rendu.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
