import { randomBytes } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { THEMES } from "../src/config/themes";

const prisma = new PrismaClient();

/**
 * Seed : synchronise la bibliotheque de themes du code vers la base (§17), puis
 * cree des comptes de demonstration COMPLETS - un client et un administrateur.
 *
 * "Complet" a un sens precis ici : chaque ecran des deux espaces doit avoir de
 * quoi s afficher. Un seed qui ne remplit que le strict minimum donne une
 * plateforme qui parait cassee - des statistiques vides, un apercu sans photo,
 * un back-office sans stock - alors que le code fonctionne. On peuple donc
 * aussi les medias, l historique de scans et de clics, et le stock de cartes.
 *
 * Le seed est idempotent : on peut le rejouer, il met a jour sans dupliquer.
 * Il ne touche jamais aux mots de passe existants (`update` ne les contient
 * pas), pour ne pas ecraser un mot de passe deja change en production.
 */

/** Mot de passe aleatoire respectant le schema applicatif (minuscule/majuscule/chiffre). */
function makePassword(prefix: string): string {
  return `${prefix}${randomBytes(9).toString("base64url")}9A`;
}

type LinkSeed = {
  type: Prisma.ProfileLinkCreateManyInput["type"];
  label: string;
  value: string;
  description?: string;
  isVisible?: boolean;
};

/** Remplace l integralite des liens d un profil - le seed fait autorite. */
async function setLinks(profileId: string, links: LinkSeed[]) {
  await prisma.profileLink.deleteMany({ where: { profileId } });
  await prisma.profileLink.createMany({
    data: links.map((l, position) => ({
      profileId,
      type: l.type,
      label: l.label,
      value: l.value,
      description: l.description ?? null,
      isVisible: l.isVisible ?? true,
      position,
    })),
  });
}

async function setTheme(
  profileId: string,
  key: string,
  config: { accentColor: string; mode: "LIGHT" | "DARK" | "AUTO"; buttonStyle: "SOLID" | "OUTLINE" | "PILL" | "ICON_TEXT" },
) {
  const theme = await prisma.theme.findUniqueOrThrow({ where: { key } });
  await prisma.profileTheme.upsert({
    where: { profileId },
    update: { themeId: theme.id, ...config },
    create: { profileId, themeId: theme.id, ...config },
  });
}

/**
 * Historique de consultation sur les 60 derniers jours.
 *
 * Sans lui, les pages Statistiques et Analytics sont des cadres vides : on ne
 * peut ni verifier les graphiques, ni juger la mise en page. Les volumes
 * suivent une semaine de travail - creux le week-end, pic en milieu de semaine.
 */
async function seedHistory(cardId: string, profileId: string, linkIds: string[], intensity: number) {
  await prisma.scanEvent.deleteMany({ where: { cardId } });
  await prisma.clickEvent.deleteMany({ where: { profileId } });

  const devices = ["ios", "ios", "android", "android", "other"];
  const sources = ["NFC", "NFC", "NFC", "QR", "LINK"];
  const countries = ["Cameroun", "Cameroun", "Cameroun", "France", "Senegal", "Cote d Ivoire"];
  const actions = ["VCARD", "LINK", "LINK", "CALL", "WHATSAPP", "EMAIL", "SHARE", "QR"] as const;

  const scans: Prisma.ScanEventCreateManyInput[] = [];
  const clicks: Prisma.ClickEventCreateManyInput[] = [];
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

  for (let day = 59; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    // Croissance douce vers le present : un compte qui demarre, pas un plateau.
    const trend = 0.5 + (60 - day) / 60;
    const count = Math.round((weekend ? 1 : 4) * trend * intensity * (0.6 + Math.random()));

    for (let i = 0; i < count; i++) {
      const at = new Date(date);
      at.setHours(8 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
      scans.push({
        cardId,
        timestamp: at,
        coarseDevice: pick(devices),
        source: pick(sources),
        country: pick(countries),
      });

      // Tout le monde ne clique pas : environ deux visiteurs sur trois agissent.
      if (Math.random() < 0.68) {
        const action = pick(actions);
        const after = new Date(at.getTime() + 20_000 + Math.random() * 90_000);
        clicks.push({
          profileId,
          linkId: action === "LINK" && linkIds.length ? pick(linkIds) : null,
          action,
          timestamp: after,
        });
      }
    }
  }

  await prisma.scanEvent.createMany({ data: scans });
  await prisma.clickEvent.createMany({ data: clicks });
  return { scans: scans.length, clicks: clicks.length };
}

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

  // 2. Super-administrateur reel -----------------------------------------
  // C est le compte du proprietaire de la plateforme. On ne lui invente ni
  // profil ni carte : il decidera lui-meme s il en veut un.
  const ownerEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@tap.exemple";
  const ownerPassword = process.env.SEED_ADMIN_PASSWORD ?? makePassword("Owner");
  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: "SUPERADMIN", status: "ACTIVE" },
    create: {
      email: ownerEmail,
      name: "Administrateur",
      role: "SUPERADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(ownerPassword, 12),
    },
  });
  console.log(`Super-administrateur : ${ownerEmail}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`  mot de passe genere : ${ownerPassword}`);
  }

  // 3. Client de demonstration complet -----------------------------------
  //
  // Le mot de passe n est JAMAIS ecrit en dur : ce fichier est versionne, et un
  // compte de demonstration reste un compte reel sur l instance publiee.
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? makePassword("Demo");
  const demoCreated = !(await prisma.user.findUnique({ where: { email: "demo@tap.exemple" } }));
  const demo = await prisma.user.upsert({
    where: { email: "demo@tap.exemple" },
    update: { role: "CLIENT", status: "ACTIVE" },
    create: {
      email: "demo@tap.exemple",
      name: "Awa Ndiaye",
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(demoPassword, 12),
    },
  });

  await prisma.subscription.upsert({
    where: { userId: demo.id },
    update: { plan: "PREMIUM", status: "ACTIVE" },
    create: {
      userId: demo.id,
      plan: "PREMIUM",
      status: "ACTIVE",
      renewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });

  const demoProfileData = {
    displayName: "Awa Ndiaye",
    firstName: "Awa",
    lastName: "Ndiaye",
    title: "Consultante en strategie de marque",
    company: "Studio Meridien",
    tagline: "Je transforme une bonne offre en marque qu on retient",
    bio: "Douze ans aupres de PME et de groupes familiaux en Afrique centrale et de l Ouest. J interviens la ou la promesse commerciale et la realite du terrain ont cesse de se parler : positionnement, architecture d offre, discours de vente.",
    introText: "Enchantee. Voici tout ce qu il faut pour me joindre.",
    phone: "+237699112233",
    whatsapp: "+237699112233",
    emailPublic: "awa@studio-meridien.com",
    website: "https://studio-meridien.com",
    address: "12 avenue Kennedy, Akwa",
    city: "Douala",
    country: "Cameroun",
    mapUrl: "https://maps.google.com/?q=Akwa+Douala",
    avatarUrl: "/demo/portrait.jpg",
    coverUrl: "/demo/cover.jpg",
    logoUrl: "/demo/logo.png",
    availability: "Deux accompagnements ouverts ce trimestre",
    ctaLabel: "Reserver un premier echange",
    ctaUrl: "https://cal.com/awa-ndiaye",
    isPublished: true,
    seoIndexable: true,
    fieldVisibility: {} as Prisma.InputJsonValue,
  };

  const existingDemoProfile = await prisma.profile.findFirst({ where: { userId: demo.id } });
  const demoProfile = existingDemoProfile
    ? await prisma.profile.update({ where: { id: existingDemoProfile.id }, data: demoProfileData })
    : await prisma.profile.create({ data: { userId: demo.id, ...demoProfileData } });

  await setLinks(demoProfile.id, [
    { type: "WHATSAPP", label: "WhatsApp", value: "+237699112233", description: "Reponse sous 2 h en semaine" },
    { type: "PHONE", label: "M appeler", value: "+237699112233" },
    { type: "EMAIL", label: "M ecrire", value: "awa@studio-meridien.com" },
    { type: "BOOKING", label: "Reserver un echange", value: "cal.com/awa-ndiaye", description: "30 minutes, sans engagement" },
    { type: "LINKEDIN", label: "LinkedIn", value: "linkedin.com/in/awa-ndiaye" },
    { type: "INSTAGRAM", label: "Instagram", value: "instagram.com/studiomeridien" },
    { type: "X", label: "X", value: "x.com/awandiaye" },
    { type: "WEBSITE", label: "Studio Meridien", value: "studio-meridien.com" },
    { type: "PORTFOLIO", label: "Etudes de cas", value: "studio-meridien.com/cas", description: "Six missions detaillees" },
    { type: "CATALOG", label: "Nos offres", value: "studio-meridien.com/offres" },
    { type: "MAPS", label: "Le studio", value: "maps.google.com/?q=Akwa+Douala" },
    { type: "RESUME", label: "Parcours (PDF)", value: "studio-meridien.com/awa-ndiaye.pdf", isVisible: false },
  ]);

  await setTheme(demoProfile.id, "executive", {
    accentColor: "#B08D57",
    mode: "DARK",
    buttonStyle: "OUTLINE",
  });

  const demoCard = await prisma.nfcCard.upsert({
    where: { publicToken: "SEEDA23" },
    update: { assignedProfileId: demoProfile.id, status: "ACTIVE" },
    create: {
      publicToken: "SEEDA23",
      batch: "SEED",
      label: "Carte de demonstration - client",
      status: "ACTIVE",
      assignedProfileId: demoProfile.id,
      activatedAt: new Date(),
    },
  });

  // 4. Administrateur de demonstration, avec sa propre carte --------------
  //
  // Un administrateur est aussi un porteur de carte. Ce compte sert a montrer
  // les deux espaces et la bascule de l un a l autre avec un seul login.
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? makePassword("Staff");
  const staffCreated = !(await prisma.user.findUnique({ where: { email: "manager@tap.exemple" } }));
  const staff = await prisma.user.upsert({
    where: { email: "manager@tap.exemple" },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: "manager@tap.exemple",
      name: "Serge Mbala",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(staffPassword, 12),
    },
  });

  await prisma.subscription.upsert({
    where: { userId: staff.id },
    update: { plan: "BUSINESS", status: "ACTIVE" },
    create: { userId: staff.id, plan: "BUSINESS", status: "ACTIVE" },
  });

  const staffProfileData = {
    displayName: "Serge Mbala",
    firstName: "Serge",
    lastName: "Mbala",
    title: "Responsable des operations",
    company: "Tap",
    tagline: "Cartes NFC, du lot vierge au contact enregistre",
    bio: "Je pilote la production des cartes, l activation des comptes clients et le suivi apres livraison.",
    introText: "Une question sur une commande ou une carte ? Ecrivez-moi.",
    phone: "+237677445566",
    whatsapp: "+237677445566",
    emailPublic: "serge@tap.exemple",
    website: "https://tap-blue-mu.vercel.app",
    address: "Rue Prince de Galles, Bonanjo",
    city: "Douala",
    country: "Cameroun",
    avatarUrl: "/demo/portrait.jpg",
    coverUrl: "/demo/cover.jpg",
    logoUrl: "/demo/logo.png",
    availability: "Du lundi au vendredi, 8 h - 18 h",
    ctaLabel: "Suivre ma commande",
    ctaUrl: "https://tap-blue-mu.vercel.app",
    isPublished: true,
    seoIndexable: false,
    fieldVisibility: {} as Prisma.InputJsonValue,
  };

  const existingStaffProfile = await prisma.profile.findFirst({ where: { userId: staff.id } });
  const staffProfile = existingStaffProfile
    ? await prisma.profile.update({ where: { id: existingStaffProfile.id }, data: staffProfileData })
    : await prisma.profile.create({ data: { userId: staff.id, ...staffProfileData } });

  await setLinks(staffProfile.id, [
    { type: "WHATSAPP", label: "WhatsApp", value: "+237677445566", description: "Support commandes" },
    { type: "PHONE", label: "Ligne directe", value: "+237677445566" },
    { type: "EMAIL", label: "serge@tap.exemple", value: "serge@tap.exemple" },
    { type: "LINKEDIN", label: "LinkedIn", value: "linkedin.com/in/serge-mbala" },
    { type: "FORM", label: "Signaler une carte perdue", value: "tap-blue-mu.vercel.app/contact" },
    { type: "MAPS", label: "Nos bureaux", value: "maps.google.com/?q=Bonanjo+Douala" },
  ]);

  await setTheme(staffProfile.id, "signal", {
    accentColor: "#2563EB",
    mode: "LIGHT",
    buttonStyle: "PILL",
  });

  const staffCard = await prisma.nfcCard.upsert({
    where: { publicToken: "SEEDM47" },
    update: { assignedProfileId: staffProfile.id, status: "ACTIVE" },
    create: {
      publicToken: "SEEDM47",
      batch: "SEED",
      label: "Carte de demonstration - equipe",
      status: "ACTIVE",
      assignedProfileId: staffProfile.id,
      activatedAt: new Date(),
    },
  });

  // 5. Historique de consultation ----------------------------------------
  //
  // Ce sont des evenements FICTIFS, rattaches aux seules deux cartes de
  // demonstration. Ils remplissent les pages Statistiques et Analytics, qui
  // sinon ne montrent rien et paraissent cassees. Poser SEED_HISTORY=false
  // pour ne pas en creer - a faire des que la plateforme sert de vrais
  // clients, pour que les chiffres agreges restent exacts.
  if (process.env.SEED_HISTORY === "false") {
    console.log("Historique : ignore (SEED_HISTORY=false)");
  } else {
  const demoLinks = await prisma.profileLink.findMany({
    where: { profileId: demoProfile.id },
    select: { id: true },
  });
  const staffLinks = await prisma.profileLink.findMany({
    where: { profileId: staffProfile.id },
    select: { id: true },
  });
  const h1 = await seedHistory(demoCard.id, demoProfile.id, demoLinks.map((l) => l.id), 1);
  const h2 = await seedHistory(staffCard.id, staffProfile.id, staffLinks.map((l) => l.id), 0.4);
    console.log(
      `Historique : ${h1.scans + h2.scans} scans, ${h1.clicks + h2.clicks} clics fictifs sur 60 jours`,
    );
  }

  // 6. Stock de cartes pour le back-office --------------------------------
  // Un ecran /admin/cards vide ne permet ni de juger le tableau, ni d essayer
  // l attribution. On depose un lot vierge et deux cas particuliers.
  const stock: Array<{ token: string; status: "UNASSIGNED" | "LOST" | "SUSPENDED"; label: string }> = [
    { token: "SEEDB01", status: "UNASSIGNED", label: "Lot SEED-B - vierge" },
    { token: "SEEDB02", status: "UNASSIGNED", label: "Lot SEED-B - vierge" },
    { token: "SEEDB03", status: "UNASSIGNED", label: "Lot SEED-B - vierge" },
    { token: "SEEDB04", status: "UNASSIGNED", label: "Lot SEED-B - vierge" },
    { token: "SEEDL09", status: "LOST", label: "Declaree perdue par le client" },
    { token: "SEEDS12", status: "SUSPENDED", label: "Suspendue - impaye" },
  ];
  for (const c of stock) {
    await prisma.nfcCard.upsert({
      where: { publicToken: c.token },
      update: { status: c.status, label: c.label },
      create: {
        publicToken: c.token,
        batch: "SEED-B",
        label: c.label,
        status: c.status,
        suspendedAt: c.status === "SUSPENDED" ? new Date() : null,
      },
    });
  }
  console.log(`Stock de cartes : ${stock.length} cartes de demonstration`);

  // 7. Recapitulatif ------------------------------------------------------
  console.log("");
  console.log("Comptes de demonstration");
  console.log(`  Client        demo@tap.exemple      profil /c/${demoCard.publicToken}`);
  if (demoCreated && !process.env.SEED_DEMO_PASSWORD) {
    console.log(`                mot de passe : ${demoPassword}`);
  } else if (!demoCreated) {
    console.log("                mot de passe inchange (compte existant)");
  }
  console.log(`  Administrateur manager@tap.exemple  profil /c/${staffCard.publicToken}`);
  if (staffCreated && !process.env.SEED_STAFF_PASSWORD) {
    console.log(`                mot de passe : ${staffPassword}`);
  } else if (!staffCreated) {
    console.log("                mot de passe inchange (compte existant)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
