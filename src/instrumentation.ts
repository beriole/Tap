/**
 * Point d entree execute une fois au demarrage du serveur.
 *
 * On y verifie la configuration : c est le seul moment ou l on peut refuser de
 * demarrer proprement, avant qu une seule requete ne soit servie avec des
 * reglages faux.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("@/lib/env");
    assertEnv();
  }
}
