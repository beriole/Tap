/**
 * Remplit le compte de demonstration : un profil public complet avec ses
 * images, une carte NFC, des statistiques de scan, un lien de partage
 * restreint, et CINQ evenements (mariage, anniversaire, entreprise, hommage,
 * brouillon) avec leurs invites et leurs reponses.
 *
 *   node --env-file=.env scripts/seed-demo-content.mjs
 *   DATABASE_URL="postgresql://..." node scripts/seed-demo-content.mjs
 *
 * A lancer APRES scripts/create-test-accounts.mjs, qui cree les deux comptes.
 *
 * Garde-fous, parce que ce script peut viser la production :
 *  - il ne touche QUE le compte demo.client@tap-demo.app (et son profil) ;
 *  - il ne supprime QUE des evenements dont l identifiant commence par
 *    "demoev-" ET dont ce compte est proprietaire ;
 *  - il s arrete si le compte n existe pas, plutot que d en creer un.
 *
 * Idempotent : relance-le autant de fois que necessaire, le contenu est
 * remis a l identique (les reponses saisies a la main sur ces evenements de
 * demonstration sont donc perdues).
 */
import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const CLIENT_EMAIL = "demo.client@tap-demo.app";
const CARD_TOKEN = "TAPDEMX";
const SPARE_TOKENS = ["TAPDEM2", "TAPDEM3", "TAPDEM4"];
// Un identifiant d evenement doit etre alphanumerique et faire 20 a 32
// caracteres (server/events/access-control.ts) : sinon la page repond 404.
const EVENT_PREFIX = "demoev";

const CLD = "https://res.cloudinary.com/sz6vjbkr/image/upload";
const IMG = {
  avatar: `${CLD}/c_fill,w_900,h_1125,g_face/samples/man-portrait.jpg`,
  cover: `${CLD}/c_fill,w_1600,h_900/samples/people/jazz.jpg`,
  logo: `${CLD}/c_fill,w_400,h_400/e_colorize:100,co_rgb:1C1B19/l_text:Arial_150_bold:SM,co_rgb:F6F3EC/samples/smile.jpg`,
  mariage: `${CLD}/c_fill,w_1400,h_1750/samples/landscapes/girl-urban-view.jpg`,
  anniversaire: `${CLD}/c_fill,w_1400,h_1750/samples/food/dessert.jpg`,
  entreprise: `${CLD}/c_fill,w_1400,h_1750/samples/landscapes/architecture-signs.jpg`,
  hommage: `${CLD}/c_fill,w_1400,h_1750/samples/landscapes/nature-mountains.jpg`,
};

/** Generateur deterministe : deux passages produisent le meme jeu de donnees. */
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = prng(20261118);
const pick = (list) => list[Math.floor(rand() * list.length)];
const token = () => randomBytes(32).toString("base64url");
const days = (n) => new Date(Date.now() - n * 86400000);

const LAST_NAMES = ["Ngono", "Mbarga", "Fotso", "Tchoua", "Nkoulou", "Essomba", "Kamga", "Ndongo", "Atangana", "Djeumeni", "Onana", "Mvondo", "Fouda", "Owona", "Kengne", "Moukoko", "Bello", "Ekwalla", "Njoya", "Sadjo"];
const ADULT_FIRST = ["Anna", "Paul", "Brigitte", "Samuel", "Clarisse", "Hervé", "Josiane", "Arnaud", "Mireille", "Cédric", "Laure", "Patrick", "Estelle", "Joël", "Nadège", "Franck", "Sandrine", "Yannick", "Carine", "Odile"];
const CHILD_FIRST = ["Nathan", "Maeva", "Ethan", "Grâce", "Lucas", "Inès", "Noah", "Kelly"];
const CATEGORIES = ["Famille", "Amis", "Collègues", "Voisins"];

const prisma = new PrismaClient();

/** Numero camerounais plausible, dans les formats reellement recus. */
function phone(i) {
  const digits = `6${String(70000000 + ((i * 7919) % 29999999)).padStart(8, "0")}`;
  switch (i % 5) {
    case 0: return { raw: `+237 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`, e164: `+237${digits}` };
    case 1: return { raw: digits, e164: `+237${digits}` };
    case 2: return { raw: `00237${digits}`, e164: `+237${digits}` };
    case 3: return { raw: digits.slice(0, 6), e164: null }; // incomplet : jamais complete au hasard
    default: return { raw: null, e164: null };
  }
}

/**
 * Cree les groupes, les invites, les invitations et les reponses d un
 * evenement. Repartition realiste : environ deux tiers de confirmations, des
 * refus, des "peut-etre", des sans-reponse, un lien revoque.
 */
async function seedGuests(event, { groups: groupCount, withChildren = true, startIndex = 0 }) {
  const meals = await prisma.mealOption.findMany({ where: { eventId: event.id } });
  const adultMeals = meals.filter((m) => !m.forChildren);
  const childMeal = meals.find((m) => m.forChildren);
  let personIndex = startIndex;
  let guests = 0;
  let attendingPeople = 0;

  for (let g = 0; g < groupCount; g += 1) {
    const lastName = LAST_NAMES[(g + startIndex) % LAST_NAMES.length];
    const shape = rand();
    const members = [{ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT", isPrimary: true }];
    if (shape > 0.3) members.push({ firstName: pick(ADULT_FIRST), lastName, ageCategory: "ADULT" });
    if (withChildren && shape > 0.72) {
      const kids = 1 + Math.floor(rand() * 2);
      for (let k = 0; k < kids; k += 1) members.push({ firstName: pick(CHILD_FIRST), lastName, ageCategory: k === 1 ? "BABY" : "CHILD" });
    }

    const groupName = members.length === 1 ? `${members[0].firstName} ${lastName}` : `Famille ${lastName}`;
    const allowPlusOne = members.length === 1 && g % 3 === 0;
    const maxSeats = members.length + (allowPlusOne ? 1 : 0);

    const roll = rand();
    let status = roll < 0.66 ? "ATTENDING" : roll < 0.78 ? "DECLINED" : roll < 0.84 ? "MAYBE" : "PENDING";
    let state = status !== "PENDING" ? "RESPONDED" : pick(["CREATED", "SHARED", "SHARED", "OPENED"]);
    if (g === 4) { status = "PENDING"; state = "REVOKED"; }
    if (allowPlusOne && status === "ATTENDING") members.push({ firstName: g % 2 === 0 ? pick(ADULT_FIRST) : null, lastName: null, ageCategory: "ADULT", isPlusOne: true });

    const group = await prisma.guestGroup.create({
      data: {
        eventId: event.id,
        name: groupName,
        maxSeats,
        category: pick(CATEGORIES),
        tags: g % 6 === 0 ? ["proches"] : [],
        internalNote: g === 2 ? "À placer près de la sortie (mobilité réduite)" : null,
      },
    });

    let present = 0;
    for (const [position, member] of members.entries()) {
      const p = member.isPrimary ? phone(personIndex) : { raw: null, e164: null };
      personIndex += 1;
      let attending = null;
      if (status === "ATTENDING") attending = member.isPrimary || member.isPlusOne ? true : rand() > 0.18;
      else if (status === "DECLINED") attending = false;
      if (attending) present += 1;

      const mealOptionId =
        attending && member.ageCategory === "ADULT" && adultMeals.length > 0 ? pick(adultMeals).id
        : attending && member.ageCategory === "CHILD" && childMeal ? childMeal.id
        : null;
      const allergies = attending && personIndex % 13 === 0 ? pick(["Arachides", "Fruits de mer", "Lactose"]) : null;

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
      guests += 1;
    }
    attendingPeople += present;

    if (g !== 6) {
      const opened = state === "OPENED" || state === "RESPONDED" ? days(9 - (g % 7)) : null;
      await prisma.invitation.create({
        data: {
          groupId: group.id,
          token: token(),
          state,
          sharedAt: state === "CREATED" ? null : days(12),
          firstOpenedAt: opened,
          lastOpenedAt: opened,
          openCount: opened ? 1 + (g % 4) : 0,
          revokedAt: state === "REVOKED" ? days(5) : null,
          response:
            status === "PENDING"
              ? undefined
              : {
                  create: {
                    status,
                    respondedAt: days(8 - (g % 6)),
                    sensitiveConsentAt: status === "ATTENDING" ? days(8 - (g % 6)) : null,
                    message: g === 1 ? "Merci pour l’invitation, nous serons là !" : null,
                  },
                },
          ticket: status === "ATTENDING" ? { create: { code: token(), seats: present } } : undefined,
        },
      });
    }
  }
  return { guests, attendingPeople };
}

try {
  const user = await prisma.user.findUnique({ where: { email: CLIENT_EMAIL }, select: { id: true, role: true } });
  if (!user) {
    console.error(`ARRET : ${CLIENT_EMAIL} n existe pas. Lancez d abord scripts/create-test-accounts.mjs.`);
    process.exit(1);
  }
  if (user.role !== "CLIENT") {
    console.error(`ARRET : ${CLIENT_EMAIL} a le role ${user.role}. Aucune donnee n a ete modifiee.`);
    process.exit(1);
  }

  // ------------------------------------------------------------ Le profil
  const existing = await prisma.profile.findFirst({ where: { userId: user.id }, select: { id: true } });
  const identity = {
    isPublished: true,
    displayName: "Landry Mbarga",
    firstName: "Landry",
    lastName: "Mbarga",
    title: "Photographe · Directeur artistique",
    company: "Studio Mbarga",
    tagline: "Je photographie les gens comme ils sont, pas comme ils posent",
    bio: "Portraits, mariages et campagnes de marque, à Douala et partout où l’avion va. Douze ans de métier, deux studios, une équipe de quatre. Je travaille à la lumière naturelle chaque fois que c’est possible, et je livre en trois semaines.",
    phone: "+237699442108",
    whatsapp: "+237699442108",
    emailPublic: "landry@studiombarga.cm",
    website: "https://studiombarga.cm",
    address: "Rue Njo-Njo, Bonapriso",
    city: "Douala",
    country: "Cameroun",
    lat: 4.0293,
    lng: 9.7043,
    avatarUrl: IMG.avatar,
    coverUrl: IMG.cover,
    logoUrl: IMG.logo,
    introText: "Premier échange gratuit, au studio ou en visio : on parle de votre projet, des dates et du budget.",
    availability: "Disponible pour des commandes en janvier",
    ctaLabel: "Prendre rendez-vous",
    ctaUrl: "https://cal.com/studio-mbarga/decouverte",
    seoIndexable: true,
  };

  const profile = existing
    ? await prisma.profile.update({ where: { id: existing.id }, data: identity, select: { id: true } })
    : await prisma.profile.create({ data: { userId: user.id, slug: "studio-mbarga", ...identity }, select: { id: true } });

  const LINKS = [
    { type: "BOOKING", label: "Réserver une séance", description: "Portrait, mariage ou campagne", value: "https://cal.com/studio-mbarga/decouverte", icon: "CalendarCheck" },
    { type: "PORTFOLIO", label: "Le portfolio", description: "Quarante photographies choisies", value: "https://studiombarga.cm/portfolio", icon: "LayoutGrid" },
    { type: "WEBSITE", label: "Studio Mbarga", description: "Site web", value: "https://studiombarga.cm", icon: "Globe" },
    { type: "CATALOG", label: "Tarifs et formules", description: "PDF · 6 pages", value: "https://studiombarga.cm/tarifs-2026.pdf", icon: "BookOpen" },
    { type: "SHOP", label: "Tirages d’art", description: "Boutique en ligne", value: "https://studiombarga.cm/tirages", icon: "ShoppingBag" },
    { type: "FORM", label: "Demander un devis", description: "Réponse sous 48 heures", value: "https://studiombarga.cm/devis", icon: "FileText" },
    { type: "INSTAGRAM", label: "Instagram", description: "Le travail du mois", value: "https://instagram.com/studiombarga", icon: "instagram" },
    { type: "LINKEDIN", label: "LinkedIn", description: null, value: "https://linkedin.com/in/landry-mbarga", icon: "linkedin" },
    { type: "BEHANCE", label: "Behance", description: "Séries et campagnes", value: "https://behance.net/studiombarga", icon: "behance" },
    { type: "YOUTUBE", label: "Dans les coulisses", description: "7 minutes", value: "https://youtube.com/watch?v=studio-mbarga", icon: "youtube" },
    { type: "MAPS", label: "Le studio", description: "Rue Njo-Njo, Bonapriso", value: "https://maps.google.com/?q=Bonapriso+Douala", icon: "MapPin" },
  ];
  await prisma.profileLink.deleteMany({ where: { profileId: profile.id } });
  await prisma.profileLink.createMany({
    data: LINKS.map((l, i) => ({ profileId: profile.id, ...l, position: i, isVisible: true })),
  });
  const links = await prisma.profileLink.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" }, select: { id: true, type: true } });

  // Theme : Signature, variante ivoire, forme douce.
  const signature = await prisma.theme.findFirst({ where: { key: "signature" }, select: { id: true } });
  if (!signature) console.warn("ATTENTION : le theme Signature est absent de la base. Lancez scripts/sync-themes.ts, puis relancez ce script.");
  if (signature) {
    await prisma.profileTheme.upsert({
      where: { profileId: profile.id },
      update: { themeId: signature.id, variant: "ivory", accentColor: "#1C1B19", mode: "LIGHT", customConfig: { accent: "#1C1B19", shape: "soft", photo: "center" } },
      create: { profileId: profile.id, themeId: signature.id, variant: "ivory", accentColor: "#1C1B19", mode: "LIGHT", customConfig: { accent: "#1C1B19", shape: "soft", photo: "center" } },
    });
  }

  // -------------------------------------------------------- Cartes NFC
  const card = await prisma.nfcCard.upsert({
    where: { publicToken: CARD_TOKEN },
    update: { assignedProfileId: profile.id, status: "ACTIVE", activatedAt: days(120), label: "Carte de démonstration", batch: "DEMO-2026" },
    create: { publicToken: CARD_TOKEN, assignedProfileId: profile.id, status: "ACTIVE", activatedAt: days(120), label: "Carte de démonstration", batch: "DEMO-2026" },
    select: { id: true },
  });
  for (const t of SPARE_TOKENS) {
    await prisma.nfcCard.upsert({
      where: { publicToken: t },
      update: {},
      create: { publicToken: t, status: "UNASSIGNED", batch: "DEMO-2026", label: "Stock de démonstration" },
    });
  }

  // Statistiques : 45 jours d historique, plus de scans en semaine.
  await prisma.scanEvent.deleteMany({ where: { cardId: card.id } });
  await prisma.clickEvent.deleteMany({ where: { profileId: profile.id } });
  const scans = [];
  for (let d = 44; d >= 0; d -= 1) {
    const weekday = new Date(Date.now() - d * 86400000).getDay();
    const base = weekday === 0 || weekday === 6 ? 1 : 4;
    const count = base + Math.floor(rand() * 6) + (d < 10 ? 3 : 0);
    for (let i = 0; i < count; i += 1) {
      scans.push({
        cardId: card.id,
        timestamp: new Date(Date.now() - d * 86400000 + randomInt(9, 20) * 3600000 + randomInt(0, 59) * 60000),
        coarseDevice: pick(["ios", "android", "android", "other"]),
        source: pick(["NFC", "NFC", "NFC", "QR", "LINK"]),
        country: "CM",
        region: pick(["Littoral", "Centre", "Ouest"]),
      });
    }
  }
  await prisma.scanEvent.createMany({ data: scans });

  const clicks = [];
  const actions = ["VCARD", "CALL", "WHATSAPP", "EMAIL", "LINK", "LINK", "LINK", "DIRECTIONS", "SHARE", "QR"];
  for (let d = 44; d >= 0; d -= 1) {
    const count = 1 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i += 1) {
      const action = pick(actions);
      const link = action === "LINK" ? pick(links) : null;
      clicks.push({
        profileId: profile.id,
        linkId: link?.id ?? null,
        action,
        timestamp: new Date(Date.now() - d * 86400000 + randomInt(9, 21) * 3600000 + randomInt(0, 59) * 60000),
      });
    }
  }
  await prisma.clickEvent.createMany({ data: clicks });

  // Lien de partage restreint : ce qu un client montre a un salon.
  const salonLinks = links.filter((l) => ["BOOKING", "PORTFOLIO", "WEBSITE"].includes(l.type)).map((l) => l.id);
  await prisma.shareLink.deleteMany({ where: { profileId: profile.id, slug: { in: ["standdua25", "chantpre25"] } } });
  await prisma.shareLink.createMany({
    data: [
      {
        profileId: profile.id,
        slug: "standdua25",
        label: "Salon du mariage, Douala",
        note: "Imprimé sur le kakémono du stand",
        fieldVisibility: { avatar: true, title: true, company: true, tagline: true, phone: true, email: true, website: true, address: true, map: true, cta: true, qr: true },
        linkIds: salonLinks,
        isActive: true,
      },
      {
        profileId: profile.id,
        slug: "chantpre25",
        label: "Clients en cours de reportage",
        note: "Numéro direct, sans les réseaux",
        fieldVisibility: { avatar: true, title: true, company: true, phone: true, whatsapp: true, email: true, availability: true },
        linkIds: [],
        isActive: true,
      },
    ],
  });

  // --------------------------------------------------------- Evenements
  const mine = await prisma.event.findMany({
    where: { id: { startsWith: EVENT_PREFIX }, members: { some: { userId: user.id, role: "OWNER" } } },
    select: { id: true },
  });
  if (mine.length > 0) await prisma.event.deleteMany({ where: { id: { in: mine.map((e) => e.id) } } });

  const inDays = (n, h = 19, m = 0) => {
    const d = new Date(Date.now() + n * 86400000);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const owner = { create: { userId: user.id, role: "OWNER" } };
  const summary = [];

  // 1. Mariage - l evenement complet : deux lieux, menu, questions, accueil.
  const mariage = await prisma.event.create({
    data: {
      id: `${EVENT_PREFIX}mariage2026clarisse`,
      type: "WEDDING",
      status: "PUBLISHED",
      title: "Mariage de Clarisse & Hervé",
      hosts: "Clarisse & Hervé",
      startsAt: inDays(58, 14),
      endsAt: inDays(59, 2),
      capacity: 180,
      themeKey: "royal-ivory",
      themeSettings: { variant: "ivoire", accent: "champagne", countdown: true },
      rsvpSettings: { allowMaybe: true, allowEdit: true, deadline: inDays(44, 23).toISOString() },
      plan: "premium",
      heroImageUrl: IMG.mariage,
      publishedAt: days(14),
      contentUpdatedAt: days(3),
      members: owner,
      venues: {
        create: [
          { label: "Cérémonie", name: "Cathédrale Saints-Pierre-et-Paul", address: "Bonanjo, Douala", landmark: "Parvis côté boulevard", startsAt: inDays(58, 14), position: 0 },
          { label: "Réception", name: "Hôtel La Falaise — Salle Wouri", address: "Rue de la Motte Piquet, Douala", landmark: "Entrée par le jardin", startsAt: inDays(58, 19), position: 1 },
        ],
      },
      sections: {
        create: [
          { kind: "program", title: "Programme", position: 0, data: { items: [
            { time: "14:00", label: "Cérémonie religieuse" },
            { time: "16:30", label: "Séance photo et cocktail" },
            { time: "19:00", label: "Dîner de réception" },
            { time: "22:00", label: "Ouverture du bal" },
          ] } },
          { kind: "dresscode", title: "Dress code", position: 1, data: { text: "Tenue de soirée. Les couleurs du mariage sont l’ivoire et le champagne.", palette: ["#F4EDE1", "#D8C3A5", "#8C6D46"] } },
          { kind: "menu", title: "Menu", position: 2, data: { courses: [
            { label: "Entrée", items: ["Velouté de potiron au gingembre"] },
            { label: "Plat", items: ["Poulet DG", "Bar braisé, plantain mûr", "Risotto aux légumes"] },
            { label: "Dessert", items: ["Pièce montée et mignardises"] },
          ] } },
          { kind: "faq", title: "Questions pratiques", position: 3, data: { items: [
            { q: "Les enfants sont-ils invités ?", a: "Oui, ceux mentionnés sur votre invitation." },
            { q: "Y a-t-il un parking ?", a: "Parking gratuit et surveillé à l’hôtel." },
            { q: "Peut-on offrir un cadeau ?", a: "Une urne sera à l’entrée de la salle, mais votre présence suffit." },
          ] } },
        ],
      },
      meals: { create: [
        { label: "Poulet DG", position: 0 },
        { label: "Bar braisé", position: 1 },
        { label: "Risotto aux légumes", description: "Végétarien", position: 2 },
        { label: "Menu enfant", forChildren: true, position: 3 },
      ] },
      questions: { create: [
        { type: "SINGLE_CHOICE", label: "Avez-vous besoin de la navette depuis la cathédrale ?", options: ["Oui", "Non"], position: 0 },
        { type: "TEXT", label: "Une chanson qui vous fera danser ?", position: 1 },
      ] },
    },
  });
  summary.push(["Mariage de Clarisse & Hervé", mariage.id, await seedGuests(mariage, { groups: 38 })]);

  // Un poste d accueil, avec un code a quatre chiffres tire au sort.
  const pin = String(randomInt(1000, 9999));
  await prisma.checkInStation.create({
    data: { eventId: mariage.id, label: "Entrée principale", token: token(), pinHash: bcrypt.hashSync(pin, 12) },
  });

  // 2. Anniversaire - le nouveau theme Elegant.
  const anniversaire = await prisma.event.create({
    data: {
      id: `${EVENT_PREFIX}anniversaire2026maeva`,
      type: "BIRTHDAY",
      status: "PUBLISHED",
      title: "Les 30 ans de Maeva",
      hosts: "Maeva",
      startsAt: inDays(26, 20),
      capacity: 60,
      themeKey: "elegant",
      themeSettings: { variant: "lin", accent: "bronze", countdown: true },
      rsvpSettings: { allowMaybe: true, allowEdit: true, deadline: inDays(19, 23).toISOString() },
      plan: "premium",
      heroImageUrl: IMG.anniversaire,
      publishedAt: days(9),
      members: owner,
      venues: { create: [{ label: "Soirée", name: "Rooftop du Djeuga Palace", address: "Rue Joseph Essono Balla, Yaoundé", landmark: "Accès par le parking arrière", startsAt: inDays(26, 20), position: 0 }] },
      sections: {
        create: [
          { kind: "program", title: "Au programme", position: 0, data: { items: [
            { time: "20:00", label: "Cocktail et DJ" },
            { time: "21:30", label: "Gâteau" },
            { time: "22:00", label: "Piste de danse" },
          ] } },
          { kind: "dresscode", title: "Dress code", position: 1, data: { text: "Tenue de soirée, touche de doré bienvenue.", palette: ["#111111", "#D4B067"] } },
          { kind: "faq", title: "Questions", position: 2, data: { items: [{ q: "Peut-on offrir un cadeau ?", a: "Votre présence suffit. Sinon, une cagnotte sera sur place." }] } },
        ],
      },
      meals: { create: [
        { label: "Buffet salé", position: 0 },
        { label: "Option végétarienne", description: "Sans viande ni poisson", position: 1 },
      ] },
      questions: { create: [{ type: "BOOLEAN", label: "Repartez-vous en taxi ? (nous en réservons)", position: 0 }] },
    },
  });
  summary.push(["Les 30 ans de Maeva", anniversaire.id, await seedGuests(anniversaire, { groups: 17, withChildren: false, startIndex: 60 })]);

  // 3. Soiree d entreprise.
  const entreprise = await prisma.event.create({
    data: {
      id: `${EVENT_PREFIX}vernissage2026studio`,
      type: "CORPORATE",
      status: "PUBLISHED",
      title: "Vernissage — dix ans de Studio Mbarga",
      hosts: "Studio Mbarga",
      startsAt: inDays(12, 18, 30),
      endsAt: inDays(12, 22),
      capacity: 90,
      themeKey: "executive",
      themeSettings: { variant: "blanc", accent: "marine", countdown: true },
      rsvpSettings: { allowMaybe: false, allowEdit: true, deadline: inDays(6, 23).toISOString() },
      plan: "premium",
      heroImageUrl: IMG.entreprise,
      publishedAt: days(21),
      members: owner,
      venues: { create: [{ label: "Accueil", name: "Studio Mbarga", address: "Rue Njo-Njo, Bonapriso, Douala", landmark: "Badge à retirer à l’entrée", startsAt: inDays(12, 18, 30), position: 0 }] },
      sections: {
        create: [
          { kind: "program", title: "Agenda", position: 0, data: { items: [
            { time: "18:30", label: "Accueil et enregistrement" },
            { time: "19:00", label: "Visite guidée de l’exposition" },
            { time: "19:45", label: "Rencontre avec les modèles et les équipes" },
            { time: "21:00", label: "Cocktail dînatoire" },
          ] } },
          { kind: "custom", title: "Intervenants", position: 1, data: { text: "Landry Mbarga, fondateur\nJoseph Kengne, tirage et encadrement\nUne photographe invitée d’Abidjan" } },
          { kind: "faq", title: "Informations pratiques", position: 2, data: { items: [
            { q: "Faut-il imprimer l’invitation ?", a: "Non : votre QR d’accès sera sur votre téléphone après confirmation." },
            { q: "Parking ?", a: "Parking gardé, gratuit sur présentation de l’invitation." },
          ] } },
        ],
      },
      meals: { create: [{ label: "Cocktail dînatoire", position: 0 }] },
      questions: { create: [{ type: "TEXT", label: "Le nom de votre société (pour le badge)", required: true, position: 0 }] },
    },
  });
  summary.push(["Vernissage des dix ans", entreprise.id, await seedGuests(entreprise, { groups: 24, withChildren: false, startIndex: 120 })]);

  // 4. Hommage - ni compte a rebours, ni enveloppe.
  const hommage = await prisma.event.create({
    data: {
      id: `${EVENT_PREFIX}hommage2026ngobell`,
      type: "MEMORIAL",
      status: "PUBLISHED",
      title: "Hommage à Marie Ngo Bell",
      hosts: "Marie Ngo Bell",
      startsAt: inDays(5, 9),
      themeKey: "serenity",
      themeSettings: { variant: "aube", accent: "gris", countdown: false },
      plan: "essentiel",
      heroImageUrl: IMG.hommage,
      publishedAt: days(4),
      members: owner,
      venues: {
        create: [
          { label: "Levée du corps", name: "Hôpital Général de Douala", address: "Boulevard de la République, Douala", startsAt: inDays(5, 7), position: 0 },
          { label: "Messe", name: "Cathédrale Saints-Pierre-et-Paul", address: "Bonanjo, Douala", startsAt: inDays(5, 9), position: 1 },
        ],
      },
      sections: {
        create: [
          { kind: "custom", title: null, position: 0, data: { text: "La famille Ngo Bell vous remercie de votre présence et de vos prières. Ni fleurs ni couronnes : un don à l’orphelinat de Bonabéri sera possible sur place." } },
          { kind: "program", title: "Déroulement", position: 1, data: { items: [
            { time: "07:00", label: "Levée du corps" },
            { time: "09:00", label: "Messe de requiem" },
            { time: "11:00", label: "Inhumation au cimetière de Bonamouti" },
            { time: "13:00", label: "Repas familial" },
          ] } },
        ],
      },
    },
  });
  summary.push(["Hommage à Marie Ngo Bell", hommage.id, await seedGuests(hommage, { groups: 11, startIndex: 180 })]);

  // 5. Brouillon : un evenement en preparation, non publie.
  const brouillon = await prisma.event.create({
    data: {
      id: `${EVENT_PREFIX}brouillon2026studio`,
      type: "OTHER",
      status: "DRAFT",
      title: "Inauguration du second studio",
      hosts: "Studio Mbarga",
      startsAt: inDays(95, 17),
      themeKey: "minimal",
      themeSettings: { variant: "blanc", accent: "encre", countdown: true },
      plan: "free",
      members: owner,
      venues: { create: [{ label: "Studio", name: "Studio Mbarga — Bonanjo", address: "Rue Joss, Bonanjo, Douala", startsAt: inDays(95, 17), position: 0 }] },
      sections: { create: [{ kind: "custom", title: null, position: 0, data: { text: "Brouillon : les invités ne voient rien tant que l’événement n’est pas publié." } }] },
    },
  });
  summary.push(["Inauguration du second studio (brouillon)", brouillon.id, { guests: 0, attendingPeople: 0 }]);

  console.log("\nContenu de demonstration en place.\n");
  console.log(`  Profil public   ${identity.displayName} - ${LINKS.length} liens, photo, couverture, logo`);
  console.log(`  Carte NFC       /c/${CARD_TOKEN}  (+ ${SPARE_TOKENS.length} cartes en stock, lot DEMO-2026)`);
  console.log(`  Statistiques    ${scans.length} scans et ${clicks.length} clics sur 45 jours`);
  console.log("  Liens partages  /s/standdua25 (salon) et /s/chantpre25 (clients en reportage)");
  console.log(`  Accueil mariage code a quatre chiffres : ${pin}\n`);
  for (const [title, id, counts] of summary) {
    console.log(`  ${title}\n    /dashboard/events/${id} - ${counts.guests} invites, ${counts.attendingPeople} confirmes`);
  }
  console.log("");
} finally {
  await prisma.$disconnect();
}
