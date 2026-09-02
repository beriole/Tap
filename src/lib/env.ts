import { z } from "zod";

/**
 * Verification des variables d environnement au demarrage du serveur.
 *
 * Une plateforme de cartes NFC ne peut pas se permettre de demarrer a moitie :
 * un AUTH_SECRET manquant, et les sessions deviennent invalides a chaque
 * redemarrage ; une NEXT_PUBLIC_APP_URL erronee, et les URL gravees dans les
 * puces pointent ailleurs. Mieux vaut refuser de demarrer que servir une
 * configuration fausse.
 *
 * Appelee par instrumentation.ts - donc au lancement du serveur, jamais
 * pendant `next build`, qui n a pas acces aux secrets de production.
 */

const production = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL doit etre une URL PostgreSQL valide."),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET doit faire au moins 32 caracteres (openssl rand -base64 32)."),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    // HTTPS obligatoire (§12), sauf en local : verifier un build de production
    // sur sa machine est une operation normale, et localhost est de confiance
    // par construction.
    .refine(
      (v) => v.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(v),
      "NEXT_PUBLIC_APP_URL doit etre en HTTPS (§12). Seul localhost est tolere en clair.",
    ),
});

export type EnvReport = { ok: true } | { ok: false; problems: string[] };

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  if (env.NODE_ENV !== "production") return { ok: true };

  const parsed = production.safeParse(env);
  const problems = parsed.success
    ? []
    : parsed.error.issues.map((i) => `${i.path.join(".")} : ${i.message}`);

  // Avertissements : la plateforme demarre, mais une fonction restera muette.
  const warnings: string[] = [];
  if (!env.RESEND_API_KEY) {
    warnings.push(
      "RESEND_API_KEY absente : aucun e-mail ne partira. Les liens d invitation et de reinitialisation devront etre transmis a la main.",
    );
  }
  if (!env.CLOUDINARY_CLOUD_NAME && !env.UPLOAD_DIR) {
    warnings.push(
      "Ni CLOUDINARY_CLOUD_NAME ni UPLOAD_DIR : les images iront dans .uploads/, qui doit etre un volume persistant.",
    );
  }
  for (const w of warnings) console.warn(`[config] ${w}`);

  return problems.length ? { ok: false, problems } : { ok: true };
}

export function assertEnv(): void {
  const report = checkEnv();
  if (report.ok) return;

  console.error("\nConfiguration invalide, demarrage interrompu :");
  for (const p of report.problems) console.error(`  - ${p}`);
  console.error("\nVoir .env.example et docs/deploiement.md.\n");
  throw new Error("Variables d environnement invalides");
}
