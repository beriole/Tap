/**
 * Cree (ou reinitialise) DEUX comptes de demonstration : un administrateur et
 * un client. A lancer une fois apres un deploiement, sur la base visee par
 * DATABASE_URL :
 *
 *   node --env-file=.env scripts/create-test-accounts.mjs
 *   DATABASE_URL="postgresql://..." node scripts/create-test-accounts.mjs
 *
 * Deux garde-fous, parce que ce script peut viser la production :
 *  - il n ecrit QUE sur les deux adresses ci-dessous ;
 *  - si l une d elles existe deja avec un autre role, il s arrete plutot que
 *    de changer les droits d un compte reel.
 *
 * Le mot de passe est passe en argument, ou tire au sort et affiche une seule
 * fois (il n est stocke que hache, comme tout mot de passe de la plateforme).
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = "demo.admin@tap-demo.app";
const CLIENT_EMAIL = "demo.client@tap-demo.app";

/** Meme fonction que lib/password.ts : bcrypt, 12 tours. */
const hashPassword = (password) => bcrypt.hashSync(password, 12);

function makePassword(prefix) {
  // Sans caracteres ambigus : ces mots de passe se recopient a la main.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const body = Array.from(randomBytes(14), (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${body}`;
}

const prisma = new PrismaClient();
const given = process.argv[2];

try {
  const adminPassword = given ?? makePassword("Demo");
  const clientPassword = given ?? makePassword("Demo");

  for (const [email, role] of [
    [ADMIN_EMAIL, "SUPERADMIN"],
    [CLIENT_EMAIL, "CLIENT"],
  ]) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing && existing.role !== role) {
      console.error(`ARRET : ${email} existe deja avec le role ${existing.role}. Aucun compte n a ete modifie.`);
      process.exit(1);
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "SUPERADMIN", status: "ACTIVE", passwordHash: hashPassword(adminPassword), emailVerified: new Date() },
    create: {
      email: ADMIN_EMAIL,
      name: "Demo Administrateur",
      role: "SUPERADMIN",
      status: "ACTIVE",
      passwordHash: hashPassword(adminPassword),
      emailVerified: new Date(),
    },
    select: { id: true },
  });

  const client = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: { role: "CLIENT", status: "ACTIVE", passwordHash: hashPassword(clientPassword), emailVerified: new Date() },
    create: {
      email: CLIENT_EMAIL,
      name: "Demo Client",
      role: "CLIENT",
      status: "ACTIVE",
      passwordHash: hashPassword(clientPassword),
      emailVerified: new Date(),
    },
    select: { id: true },
  });

  // Un client sans profil arrive sur un tableau de bord vide : on lui en donne un.
  const profile = await prisma.profile.findFirst({ where: { userId: client.id }, select: { id: true } });
  if (!profile) {
    await prisma.profile.create({
      data: {
        userId: client.id,
        slug: `demo-client-${Date.now().toString(36)}`,
        displayName: "Demo Client",
        title: "Compte de demonstration",
        company: "Tap",
        isPublished: false,
      },
    });
  }

  // Verification : le mot de passe affiche ouvre bien le compte.
  const check = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { passwordHash: true } });
  const ok = bcrypt.compareSync(adminPassword, check.passwordHash);

  console.log(`\nComptes de demonstration ${given ? "mis a jour" : "crees"} (mot de passe verifie : ${ok ? "oui" : "NON"})\n`);
  console.log(`  Administrateur  ${ADMIN_EMAIL}`);
  console.log(`  mot de passe    ${adminPassword}\n`);
  console.log(`  Client          ${CLIENT_EMAIL}`);
  console.log(`  mot de passe    ${clientPassword}\n`);
  console.log(`  admin id ${admin.id} · client id ${client.id}`);
  console.log("\nA changer ou a supprimer des que la demonstration est terminee.\n");
} finally {
  await prisma.$disconnect();
}
