/**
 * Synchronise le catalogue des themes (src/config/themes.ts) avec la base.
 *
 *   npx tsx --env-file=.env scripts/sync-themes.ts
 *   DATABASE_URL="postgresql://..." npx tsx scripts/sync-themes.ts
 *
 * Le meme upsert que prisma/seed.ts, mais SEUL : ajouter un design ne doit
 * pas obliger a rejouer le jeu de demonstration, qui, lui, reecrit des
 * profils. Aucun profil, aucun compte, aucune carte n est touche ici.
 */
import { PrismaClient } from "@prisma/client";
import { THEMES } from "../src/config/themes";

const prisma = new PrismaClient();

async function main() {
  for (const [index, theme] of THEMES.entries()) {
    await prisma.theme.upsert({
      where: { key: theme.key },
      update: {
        name: theme.name,
        description: theme.direction,
        category: theme.target,
        position: index,
        isActive: true,
        allowedPlans: theme.mvp ? ["FREE", "PREMIUM", "BUSINESS"] : ["PREMIUM", "BUSINESS"],
      },
      create: {
        key: theme.key,
        name: theme.name,
        description: theme.direction,
        category: theme.target,
        position: index,
        isActive: true,
        allowedPlans: theme.mvp ? ["FREE", "PREMIUM", "BUSINESS"] : ["PREMIUM", "BUSINESS"],
        configSchema: { variants: theme.variants, defaultAccent: theme.defaultAccent },
      },
    });
  }
  const total = await prisma.theme.count();
  console.log(`Themes synchronises : ${THEMES.length} ecrits, ${total} en base.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
