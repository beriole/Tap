import type { Instrumentation } from "next";

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

/**
 * Toute erreur non rattrapee d un rendu ou d une route (§20). Le corps de la
 * requete n est pas transmis - voir lib/monitoring.ts.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("@/lib/monitoring");
  await reportError(error, { url: request.path, method: request.method, route: context.routePath, source: context.routeType });
};
