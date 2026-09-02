import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Aiguillage apres connexion.
 *
 * signIn doit connaitre sa destination AVANT de savoir qui se connecte : on ne
 * peut donc pas lui passer directement /admin ou /dashboard. Cette page sert de
 * relais - elle lit la session etablie, puis renvoie chacun chez lui.
 *
 * La version precedente envoyait tout le monde sur /dashboard. Un
 * administrateur atterrissait donc dans l espace client, sans aucun indice que
 * le back-office existait : il en concluait, legitimement, qu il n existait pas.
 *
 * Le renvoi n a lieu QU ICI, jamais sur /dashboard lui-meme : un administrateur
 * possede aussi une carte et doit pouvoir editer son propre profil.
 */
export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  redirect(role === "ADMIN" || role === "SUPERADMIN" ? "/admin" : "/dashboard");
}
