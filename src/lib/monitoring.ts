import "server-only";
import { buildEnvelope, parseDsn, type ErrorContext } from "@/lib/monitoring-envelope";

/**
 * Remontee des erreurs vers Sentry (cahier §20), SANS le SDK.
 *
 * Le SDK @sentry/nextjs ajoute ~30 ko au JavaScript de chaque page, et
 * enveloppe le serveur d une instrumentation que nous n exploitons pas. Ce
 * qu il nous faut tient en une requete : l API "envelope" de Sentry, avec
 * la cle publique du DSN. Sans DSN, rien ne part et rien ne casse.
 *
 * Ce qui est envoye : type et message de l erreur, pile, URL et methode de la
 * requete, l identifiant de deploiement. Jamais un corps de requete, jamais
 * un cookie : une invitation contient des noms et un jeton.
 */
export async function reportError(error: unknown, context: ErrorContext = {}): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const target = parseDsn(dsn);
  if (!target) return;

  const envelope = buildEnvelope(error, context, {
    // Web Crypto : ce module est aussi compile pour le runtime Edge via instrumentation.ts.
    eventId: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });

  try {
    await fetch(target.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=tap/1.0, sentry_key=${target.key}` },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // La remontee d une erreur ne doit jamais en provoquer une autre.
  }
}
