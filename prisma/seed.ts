import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { THEMES } from "../src/config/themes";

const prisma = new PrismaClient();

/**
 * Seed : synchronise la bibliotheque de themes du code vers la base (§17),
 * cree le compte administrateur initial, puis un client de demonstration avec
 * une carte NFC active pour valider le parcours complet (§4, §20).
 */
async function main() {
  // 1. Themes ------------------------------------------------------------
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
  console.log(`Themes synchronises : ${THEMES.length}`);

  // 2. Administrateur ----------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@tap.exemple";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMoi!2026";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "SUPERADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "Administrateur",
      role: "SUPERADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  console.log(`Administrateur : ${adminEmail}`);

  // 3. Client de demonstration + carte active ----------------------------
  //
  // Le mot de passe n est JAMAIS ecrit en dur : ce fichier est versionne, et
  // un compte de demonstration reste un compte reel sur l instance publiee.
  // Sans SEED_DEMO_PASSWORD, on en tire un au hasard et on l affiche une fois.
  const demoPassword =
    process.env.SEED_DEMO_PASSWORD ?? `Demo${randomBytes(9).toString("base64url")}9A`;
  const demo = await prisma.user.upsert({
    where: { email: "demo@tap.exemple" },
    update: {},
    create: {
      email: "demo@tap.exemple",
      name: "Compte de demonstration",
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(demoPassword, 12),
    },
  });

  const existingProfile = await prisma.profile.findFirst({ where: { userId: demo.id } });
  const profile =
    existingProfile ??
    (await prisma.profile.create({
      data: {
        userId: demo.id,
        displayName: "Awa Ndiaye",
        firstName: "Awa",
        lastName: "Ndiaye",
        title: "Consultante en strategie",
        company: "Studio Meridien",
        tagline: "Strategie de marque et croissance",
        bio: "J accompagne les PME africaines dans la structuration de leur marque et de leur offre commerciale.",
        phone: "+237600000000",
        whatsapp: "+237600000000",
        emailPublic: "awa@studio-meridien.com",
        website: "https://studio-meridien.com",
        address: "12 avenue Kennedy",
        city: "Douala",
        country: "Cameroun",
        availability: "Disponible pour de nouveaux projets",
        ctaLabel: "Prendre rendez-vous",
        ctaUrl: "https://cal.com/awa",
        isPublished: true,
        fieldVisibility: {},
      },
    }));

  if (!existingProfile) {
    await prisma.profileLink.createMany({
      data: [
        { profileId: profile.id, type: "LINKEDIN", label: "LinkedIn", value: "linkedin.com/in/awa", position: 0 },
        { profileId: profile.id, type: "WEBSITE", label: "Site web", value: "studio-meridien.com", position: 1 },
        { profileId: profile.id, type: "BOOKING", label: "Reserver un appel", value: "cal.com/awa", position: 2 },
        { profileId: profile.id, type: "SHOP", label: "Nos offres", value: "studio-meridien.com/offres", position: 3, isVisible: false },
      ],
    });

    const seedTheme = await prisma.theme.findUniqueOrThrow({ where: { key: "executive" } });
    await prisma.profileTheme.create({
      data: {
        profileId: profile.id,
        themeId: seedTheme.id,
        accentColor: "#B08D57",
        mode: "DARK",
        buttonStyle: "OUTLINE",
      },
    });
  }

  const card = await prisma.nfcCard.upsert({
    where: { publicToken: "SEEDA23" },
    update: { assignedProfileId: profile.id, status: "ACTIVE" },
    create: {
      publicToken: "SEEDA23",
      batch: "SEED",
      label: "Carte de demonstration",
      status: "ACTIVE",
      assignedProfileId: profile.id,
      activatedAt: new Date(),
    },
  });

  console.log(`Profil de demonstration accessible sur /c/${card.publicToken}`);
  if (!process.env.SEED_DEMO_PASSWORD) {
    console.log(`Mot de passe du compte de demonstration : ${demoPassword}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
