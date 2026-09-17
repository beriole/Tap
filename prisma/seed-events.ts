import { randomBytes } from "node:crypto";
import { PrismaClient, type GuestAgeCategory, type InvitationState, type RsvpStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Jeu de donnees du module Invitations & Evenements (plan, phase 1).
 *
 * Un mariage realiste plutot qu un echantillon minimal : ~60 groupes, ~180
 * personnes, toutes les situations que le dashboard et les exports doivent
 * savoir compter - famille partiellement presente, +1 ajoute puis retire,
 * "peut-etre", lien revoque, groupe sans invitation, numero illisible, nom
 * interminable.
 *
 * Il cree aussi trois comptes de TEST - organisateur, co-organisateur et un
 * "intrus" sans aucun droit - pour verifier en local qu on ne lit pas
 * l evenement d un autre en changeant l URL (§22). Des mots de passe connus
 * n ont rien a faire hors d une machine de developpement : le script refuse
 * donc toute base qui n est pas locale.
 *
 * Idempotent : l evenement de demonstration est supprime puis recree a chaque
 * passage. Les reponses saisies a la main dessus sont donc perdues.
 */

const DEMO_EVENT_ID = "demoeventmariageberioleanna";

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  if (!local || process.env.NODE_ENV === "production") {
    console.error("seed-events : refuse. Ce script cree des comptes de test et ne tourne que sur une base locale.");
    process.exit(1);
  }
}

/** Generateur deterministe : le meme seed produit toujours les memes donnees. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20261212);
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
const token = () => randomBytes(32).toString("base64url");

const LAST_NAMES = [
  "Ngono", "Mbarga", "Fotso", "Tchoua", "Nkoulou", "Essomba", "Kamga", "Ndongo", "Biya", "Atangana",
  "Djeumeni", "Tamba", "Onana", "Eto'o", "Mvondo", "Nana", "Fouda", "Owona", "Kengne", "Moukoko",
];
const ADULT_FIRST = [
  "Anna", "Beriole", "Paul", "Brigitte", "Samuel", "Clarisse", "Herve", "Josiane", "Arnaud", "Mireille",
  "Cedric", "Laure", "Patrick", "Estelle", "Joel", "Nadege", "Franck", "Sandrine", "Yannick", "Carine",
];
const CHILD_FIRST = ["Nathan", "Maeva", "Ethan", "Grace", "Lucas", "Ines", "Noah", "Kelly"];

/** Formats reellement recus : avec indicatif, avec espaces, sans indicatif, errone. */
function phone(i: number): { raw: string | null; e164: string | null } {
  const digits = `6${String(70000000 + ((i * 7919) % 29999999)).padStart(8, "0")}`;
  switch (i % 6) {
    case 0: return { raw: `+237 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`, e164: `+237${digits}` };
    case 1: return { raw: digits, e164: `+237${digits}` };
    case 2: return { raw: `00237${digits}`, e164: `+237${digits}` };
    case 3: return { raw: `${digits.slice(0, 6)}`, e164: null }; // incomplet : jamais complete au hasard
    case 4: return { raw: null, e164: null };
    default: return { raw: `(+237) ${digits}`, e164: `+237${digits}` };
  }
}

type GuestSeed = {
  firstName: string | null;
  lastName: string | null;
  ageCategory: GuestAgeCategory;
  isPrimary?: boolean;
  isPlusOne?: boolean;
};

async function qaUser(email: string, name: string, password: string) {
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12), status: "ACTIVE" },
    create: {
      email,
      name,
      role: "CLIENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}

async function main() {
  assertLocalDatabase();

  const password = process.env.SEED_QA_PASSWORD ?? `Qa${randomBytes(6).toString("base64url")}9a`;
  const owner = await qaUser("organisateur@tap.exemple", "Beriole Organisateur", password);
  const coorganizer = await qaUser("coorganisateur@tap.exemple", "Carine Co-organisatrice", password);
  const intruder = await qaUser("intrus@tap.exemple", "Intrus Sans Droit", password);

  await prisma.event.deleteMany({ where: { id: DEMO_EVENT_ID } });
  // L intrus organise son propre evenement : il a donc un espace non vide, et
  // le test verifie bien un refus, pas une simple absence de donnees.
  await prisma.event.deleteMany({ where: { members: { some: { userId: intruder.id } } } });

  const event = await prisma.event.create({
    data: {
      id: DEMO_EVENT_ID,
      type: "WEDDING",
      status: "PUBLISHED",
      title: "Mariage de Beriole & Anna",
      hosts: "Beriole & Anna",
      startsAt: new Date("2026-12-12T14:00:00+01:00"),
      endsAt: new Date("2026-12-13T02:00:00+01:00"),
      capacity: 170,
      themeKey: "royal-ivory",
      rsvpSettings: { allowMaybe: true, allowEdit: true, deadline: "2026-11-28T23:59:00+01:00" },
      plan: "premium",
      publishedAt: new Date("2026-09-10T10:00:00+01:00"),
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: coorganizer.id, role: "COORGANIZER", permissions: ["guests", "checkin"] },
        ],
      },
      venues: {
        create: [
          { label: "Ceremonie", name: "Cathedrale Notre-Dame des Victoires", address: "Avenue Kennedy, Yaounde", landmark: "Face a la poste centrale", startsAt: new Date("2026-12-12T14:00:00+01:00"), position: 0 },
          { label: "Reception", name: "Hilton Yaounde - Salle des Ambassadeurs", address: "Boulevard du 20 Mai, Yaounde", landmark: "Entree cote jardin", startsAt: new Date("2026-12-12T19:00:00+01:00"), position: 1 },
        ],
      },
      sections: {
        create: [
          { kind: "program", title: "Programme", position: 0, data: { items: [
            { time: "14:00", label: "Ceremonie religieuse" },
            { time: "16:30", label: "Seance photo et cocktail" },
            { time: "19:00", label: "Diner de reception" },
            { time: "22:00", label: "Ouverture du bal" },
          ] } },
          { kind: "dresscode", title: "Dress code", position: 1, data: { text: "Tenue de soiree. Les couleurs du mariage sont l ivoire et le champagne.", palette: ["#F4EDE1", "#D8C3A5", "#8C6D46"] } },
          { kind: "menu", title: "Menu", position: 2, data: { courses: [
            { label: "Entree", items: ["Veloute de potiron au gingembre"] },
            { label: "Plat", items: ["Poulet DG", "Bar braise, plantain mur", "Risotto aux legumes"] },
            { label: "Dessert", items: ["Piece montee et mignardises"] },
          ] } },
          { kind: "faq", title: "Questions pratiques", position: 3, data: { items: [
            { q: "Les enfants sont-ils invites ?", a: "Oui, ceux mentionnes sur votre invitation." },
            { q: "Y a-t-il un parking ?", a: "Parking gratuit et surveille a l hotel." },
          ] } },
        ],
      },
      meals: {
        create: [
          { label: "Poulet DG", position: 0 },
          { label: "Bar braise", position: 1 },
          { label: "Risotto aux legumes", description: "Vegetarien", position: 2 },
          { label: "Menu enfant", forChildren: true, position: 3 },
        ],
      },
      questions: {
        create: [
          { type: "SINGLE_CHOICE", label: "Avez-vous besoin de la navette depuis la cathedrale ?", options: ["Oui", "Non"], position: 0 },
          { type: "TEXT", label: "Une chanson qui vous fera danser ?", position: 1 },
        ],
      },
    },
    include: { meals: true },
  });

  const adultMeals = event.meals.filter((m) => !m.forChildren);
  const childMeal = event.meals.find((m) => m.forChildren)!;

  // Repartition cible : ~65 % confirment, ~12 % declinent, ~5 % peut-etre, le reste sans reponse.
  const GROUP_COUNT = 62;
  let personIndex = 0;
  const totals = { groups: 0, guests: 0 };

  for (let g = 0; g < GROUP_COUNT; g += 1) {
    const lastName = LAST_NAMES[g % LAST_NAMES.length]!;
    const shape = rand();
    const members: GuestSeed[] = [];

    if (shape < 0.25) {
      members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT", isPrimary: true });
    } else if (shape < 0.55) {
      members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT", isPrimary: true });
      members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT" });
    } else {
      members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT", isPrimary: true });
      members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT" });
      const kids = 1 + Math.floor(rand() * 3);
      for (let k = 0; k < kids; k += 1) {
        members.push({ firstName: pick(CHILD_FIRST), lastName, ageCategory: k === 2 ? "BABY" : "CHILD" });
      }
    }

    // Cas limites volontaires
    let groupName = members.length === 1 ? `${members[0]!.firstName} ${lastName}` : `Famille ${lastName}`;
    if (g === 7) groupName = "Famille Djeumeni Tchoua Nkoulou-Essomba et leurs enfants venus de Douala";
    const allowPlusOne = members.length === 1 && g % 3 === 0;
    const maxSeats = members.length + (allowPlusOne ? 1 : 0);

    const roll = rand();
    let status: RsvpStatus =
      roll < 0.65 ? "ATTENDING" : roll < 0.77 ? "DECLINED" : roll < 0.82 ? "MAYBE" : "PENDING";
    let state: InvitationState =
      status !== "PENDING" ? "RESPONDED" : pick(["CREATED", "SHARED", "SHARED", "OPENED"] as const);
    if (g === 11) { status = "PENDING"; state = "REVOKED"; }
    const withoutInvitation = g === 13;

    if (allowPlusOne && status === "ATTENDING") {
      // Un +1 sur deux vient ; l autre a ete ajoute puis retire.
      members.push({ firstName: g % 2 === 0 ? pick(ADULT_FIRST) : null, lastName: null, ageCategory: "ADULT", isPlusOne: true });
    }

    const group = await prisma.guestGroup.create({
      data: {
        eventId: event.id,
        name: groupName,
        maxSeats,
        category: pick(["Famille de la mariee", "Famille du marie", "Amis", "Collegues"]),
        tags: g % 5 === 0 ? ["proches"] : [],
        internalNote: g === 3 ? "Oncle a placer pres de la sortie (mobilite reduite)" : null,
      },
    });

    let present = 0;
    for (const [position, member] of members.entries()) {
      const p = member.isPrimary ? phone(personIndex) : { raw: null, e164: null };
      personIndex += 1;

      let attending: boolean | null = null;
      if (status === "ATTENDING") {
        // Une famille sur quatre ne vient pas au complet.
        attending = member.isPrimary || member.isPlusOne ? true : rand() > (members.length > 2 ? 0.25 : 0.1);
        if (member.isPlusOne && g % 2 === 1) attending = false;
      } else if (status === "DECLINED") {
        attending = false;
      }
      if (attending) present += 1;

      const mealOptionId =
        attending && member.ageCategory === "ADULT" ? pick(adultMeals).id
        : attending && member.ageCategory === "CHILD" ? childMeal.id
        : null;
      const allergies = attending && personIndex % 17 === 0 ? pick(["Arachides", "Fruits de mer", "Lactose"]) : null;

      await prisma.guest.create({
        data: {
          groupId: group.id,
          firstName: member.firstName,
          lastName: member.lastName,
          phoneRaw: p.raw,
          phoneE164: p.e164,
          ageCategory: member.ageCategory,
          isPrimary: Boolean(member.isPrimary),
          isPlusOne: Boolean(member.isPlusOne),
          attending,
          position,
          preference: mealOptionId || allergies ? { create: { mealOptionId, allergies } } : undefined,
        },
      });
      totals.guests += 1;
    }

    if (!withoutInvitation) {
      const openedAt = state === "OPENED" || state === "RESPONDED" ? new Date("2026-09-12T20:15:00+01:00") : null;
      await prisma.invitation.create({
        data: {
          groupId: group.id,
          token: token(),
          state,
          sharedAt: state === "CREATED" ? null : new Date("2026-09-11T09:00:00+01:00"),
          firstOpenedAt: openedAt,
          lastOpenedAt: openedAt,
          openCount: openedAt ? 1 + (g % 4) : 0,
          revokedAt: state === "REVOKED" ? new Date("2026-09-14T08:00:00+01:00") : null,
          response:
            status === "PENDING"
              ? undefined
              : {
                  create: {
                    status,
                    respondedAt: new Date("2026-09-13T18:30:00+01:00"),
                    sensitiveConsentAt: status === "ATTENDING" ? new Date("2026-09-13T18:30:00+01:00") : null,
                    message: g === 2 ? "Tous nos voeux de bonheur, nous serons la !" : null,
                  },
                },
          ticket:
            status === "ATTENDING"
              ? { create: { code: token(), seats: present } }
              : undefined,
        },
      });
    }
    totals.groups += 1;
  }

  // Evenement de l intrus : il existe, il lui appartient, il ne doit rien ouvrir d autre.
  await prisma.event.create({
    data: {
      type: "BIRTHDAY",
      title: "Anniversaire de l intrus",
      hosts: "Intrus",
      startsAt: new Date("2026-10-01T18:00:00+01:00"),
      members: { create: { userId: intruder.id, role: "OWNER" } },
    },
  });

  console.log(`Evenement de demonstration : ${totals.groups} groupes, ${totals.guests} personnes`);
  console.log(`  /dashboard/events/${DEMO_EVENT_ID}`);
  console.log("");
  console.log("Comptes de test (base locale uniquement)");
  console.log("  organisateur@tap.exemple    proprietaire");
  console.log("  coorganisateur@tap.exemple  invites + accueil");
  console.log("  intrus@tap.exemple          aucun droit sur le mariage");
  console.log(`  mot de passe commun : ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
