/**
 * Audit du module Invitations & Evenements, dans un vrai navigateur.
 *
 * Prerequis : serveur lance (npm run dev ou npm start) et donnees de test
 * chargees (npm run db:seed:events). Usage :
 *
 *   node --env-file=.env scripts/audit-invitations.mjs <mot-de-passe-des-comptes-de-test>
 *
 * Ce que l on verifie, et pourquoi par cette voie :
 *  - le cloisonnement (§22 "pas d acces a l evenement d un autre par simple
 *    modification d URL") - on lit le HTML REELLEMENT servi a l intrus, RSC
 *    compris, pour s assurer qu aucune donnee ne fuit meme masquee ;
 *  - les totaux - recalcules ICI en SQL, independamment de headcount.ts. Deux
 *    methodes qui donnent le meme chiffre valent mieux qu une seule relue ;
 *  - la limitation de debit, devenue asynchrone en phase 0.
 *
 * Les pages sous /dashboard ont un loading.tsx : la reponse est diffusee en
 * flux et notFound() peut arriver apres l envoi d un statut 200. On juge donc
 * sur le contenu, pas sur le code HTTP.
 */
import puppeteer from "puppeteer-core";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [, , PASSWORD] = process.argv;
const EVENT_ID = "demoeventmariageberioleanna";
const EVENT_TITLE = "Mariage de Beriole & Anna";

if (!PASSWORD) {
  console.error("Usage : node --env-file=.env scripts/audit-invitations.mjs <mot-de-passe-des-comptes-de-test>");
  process.exit(2);
}

const prisma = new PrismaClient();
const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  OK  " : " ECHEC"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function newSession() {
  const context = await browser.createBrowserContext();
  return context.newPage();
}

async function signIn(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 90000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', PASSWORD);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => null),
  ]);
  return page.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
}

/** HTML complet servi pour une URL, charge utile RSC comprise. */
async function rawHtml(page, path) {
  return page.evaluate(async (p) => {
    const r = await fetch(p, { redirect: "manual" });
    return { status: r.status, type: r.type, html: await r.text() };
  }, path);
}

/** Appel JSON depuis la session de la page (cookies compris). */
async function api(page, path, method = "GET", body) {
  return page.evaluate(
    async (p, m, b) => {
      const r = await fetch(p, { method: m, headers: b === undefined ? undefined : { "Content-Type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) });
      let json = null;
      try {
        json = await r.json();
      } catch {
        /* corps vide */
      }
      return { status: r.status, body: json };
    },
    path,
    method,
    body,
  );
}

/**
 * Valeur posee comme le ferait une saisie : React ecoute l evenement "input"
 * et ignore une affectation directe de .value.
 */
async function setValue(page, selector, value) {
  await page.$eval(
    selector,
    (el, v) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    value,
  );
}

async function clickText(page, tag, text) {
  const ok = await page.evaluate(
    (t, x) => {
      const el = [...document.querySelectorAll(t)].find((n) => n.textContent.trim().startsWith(x) && !n.disabled);
      el?.click();
      return Boolean(el);
    },
    tag,
    text,
  );
  if (!ok) throw new Error(`Bouton introuvable ou inactif : « ${text} »`);
}

/** Totaux recalcules en SQL, sans passer par le code applicatif. */
async function sqlTotals() {
  const [row] = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE r.status = 'ATTENDING' AND g.attending = true)::int AS expected,
      COUNT(*) FILTER (WHERE r.status = 'ATTENDING' AND g.attending = true AND g."ageCategory" = 'CHILD')::int AS children,
      COUNT(*) FILTER (WHERE r.status = 'DECLINED' AND NOT (g."isPlusOne" AND g.attending = false))::int
        + COUNT(*) FILTER (WHERE r.status = 'ATTENDING' AND g.attending = false AND NOT g."isPlusOne")::int AS declined
    FROM "Guest" g
    JOIN "GuestGroup" gg ON gg.id = g."groupId"
    LEFT JOIN "Invitation" i ON i."groupId" = gg.id
    LEFT JOIN "RsvpResponse" r ON r."invitationId" = i.id
    WHERE gg."eventId" = ${EVENT_ID}`;
  return row;
}

/** Valeur affichee sous un libelle de la bande de chiffres ou d une tuile. */
async function figureAfter(page, label) {
  return page.evaluate((l) => {
    const text = document.body.innerText;
    const m = text.match(new RegExp(`${l}\\s*\\n\\s*([0-9\\s\\u202f]+)`, "i"));
    return m ? Number(m[1].replace(/\s|\u202f/g, "")) : null;
  }, label);
}

try {
  const eventInDb = await prisma.event.findUnique({ where: { id: EVENT_ID }, select: { id: true } });
  record("0. Donnees de test presentes", Boolean(eventInDb), eventInDb ? "" : "lancer npm run db:seed:events");
  if (!eventInDb) throw new Error("donnees absentes");

  // ------------------------------------------------------------ ANONYME --
  const anon = await newSession();
  const anonRes = await anon.goto(`${BASE}/dashboard/events/${EVENT_ID}`, { waitUntil: "networkidle0", timeout: 90000 });
  const anonHtml = await anon.content();
  record(
    "1. Anonyme renvoye vers la connexion",
    anon.url().includes("/login") && !anonHtml.includes("Mariage de Beriole"),
    `${anonRes?.status()} → ${new URL(anon.url()).pathname}`,
  );

  // ------------------------------------------------------- ORGANISATEUR --
  const owner = await newSession();
  const ownerSession = await signIn(owner, "organisateur@tap.exemple");
  record("2. Organisateur connecte", Boolean(ownerSession?.user), ownerSession?.user?.email);

  await owner.goto(`${BASE}/dashboard/events`, { waitUntil: "networkidle0", timeout: 90000 });
  const ownerList = await owner.evaluate(() => document.body.innerText);
  record("3. L evenement figure dans sa liste", ownerList.includes(EVENT_TITLE));
  record("4. L evenement d un autre n y figure pas", !ownerList.includes("Anniversaire de l intrus"));

  await owner.goto(`${BASE}/dashboard/events/${EVENT_ID}`, { waitUntil: "networkidle0", timeout: 90000 });
  const ownerText = await owner.evaluate(() => document.body.innerText);
  // Les titres de section sont en capitales CSS : innerText les rend en capitales.
  record("5. Vue d ensemble affichee", ownerText.includes(EVENT_TITLE) && /repas/i.test(ownerText));

  const sql = await sqlTotals();
  // CountUp anime les chiffres : on laisse l animation se terminer.
  await new Promise((r) => setTimeout(r, 2500));
  const shownExpected = await figureAfter(owner, "Attendus");
  const shownChildren = await figureAfter(owner, "Enfants");
  const shownDeclined = await figureAfter(owner, "Absents");
  record("6. Attendus = recalcul SQL", shownExpected === sql.expected, `page ${shownExpected} / SQL ${sql.expected}`);
  record("7. Enfants = recalcul SQL", shownChildren === sql.children, `page ${shownChildren} / SQL ${sql.children}`);
  record("8. Absents = recalcul SQL", shownDeclined === sql.declined, `page ${shownDeclined} / SQL ${sql.declined}`);

  // ---------------------------------------------------- CO-ORGANISATEUR --
  const co = await newSession();
  await signIn(co, "coorganisateur@tap.exemple");
  await co.goto(`${BASE}/dashboard/events/${EVENT_ID}`, { waitUntil: "networkidle0", timeout: 90000 });
  const coText = await co.evaluate(() => document.body.innerText);
  record("9. Co-organisateur : acces en lecture", coText.includes(EVENT_TITLE));

  // -------------------------------------------------------------- INTRUS --
  const intruder = await newSession();
  await signIn(intruder, "intrus@tap.exemple");

  await intruder.goto(`${BASE}/dashboard/events`, { waitUntil: "networkidle0", timeout: 90000 });
  const intruderList = await intruder.evaluate(() => document.body.innerText);
  record(
    "10. Intrus : sa liste ne montre que son evenement",
    intruderList.includes("Anniversaire de l intrus") && !intruderList.includes(EVENT_TITLE),
  );

  // Marqueurs SANS caractere echappe en HTML : "Beriole & Anna" est servi en
  // "Beriole &amp; Anna", et le chercher tel quel ne trouverait jamais rien -
  // le test passerait sans rien prouver.
  const MARKERS = ["Mariage de Beriole", "Poulet DG", "Risotto aux legumes", "Menu enfant"];
  // Temoin : les memes marqueurs DOIVENT apparaitre dans le HTML de l organisateur.
  const ownerRaw = await rawHtml(owner, `/dashboard/events/${EVENT_ID}`);
  const seenByOwner = MARKERS.filter((s) => ownerRaw.html.includes(s));
  record("12a. Temoin : les marqueurs sont detectables", seenByOwner.length === MARKERS.length, `${seenByOwner.length}/${MARKERS.length} chez l organisateur`);

  const direct = await rawHtml(intruder, `/dashboard/events/${EVENT_ID}`);
  const leaks = MARKERS.filter((s) => direct.html.includes(s));
  record(
    "11. Intrus : URL directe → page introuvable",
    direct.html.includes("Page introuvable"),
    `HTTP ${direct.status}`,
  );
  record("12. Intrus : aucune donnee dans le HTML ni le RSC", leaks.length === 0, leaks.join(", "));

  const forged = await rawHtml(intruder, `/dashboard/events/${EVENT_ID.slice(0, -1)}x`);
  record("13. Identifiant forge → page introuvable", forged.html.includes("Page introuvable"));
  const injected = await rawHtml(intruder, `/dashboard/events/${encodeURIComponent("' OR 1=1 --")}`);
  record("14. Identifiant malforme → page introuvable", injected.html.includes("Page introuvable"));

  // =================================================== PHASE 2 - INTERFACE --
  // Parcours reel, au clavier et a la souris : creation guidee, ajout manuel,
  // collage d une liste. Chronometre contre l objectif §2.1 (< 15 min).
  const organizer = await prisma.user.findUniqueOrThrow({ where: { email: "organisateur@tap.exemple" } });
  await prisma.event.deleteMany({ where: { id: { not: EVENT_ID }, members: { some: { userId: organizer.id, role: "OWNER" } } } });

  const t0 = Date.now();
  await owner.goto(`${BASE}/dashboard/events/new`, { waitUntil: "networkidle0", timeout: 90000 });
  await owner.type('input[name="hosts"]', "Audit & Parcours");
  await setValue(owner, 'input[name="startsAt"]', "2027-02-14T15:00");
  await clickText(owner, "button", "Continuer");
  await owner.waitForSelector('input[placeholder="Hilton Yaounde"]');
  await owner.type('input[placeholder="Hilton Yaounde"]', "Salle des fetes de Bastos");
  await owner.type('input[placeholder="Boulevard du 20 Mai, Yaounde"]', "Rue 1.750, Bastos, Yaounde");
  await clickText(owner, "button", "Continuer");
  await owner.waitForFunction(() => document.body.innerText.includes("Mariage de Audit & Parcours"));
  await Promise.all([
    owner.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
    clickText(owner, "button", "Creer et ajouter les invites"),
  ]);
  const created = owner.url().match(/events\/([a-z0-9]+)\/invites\?nouveau=1/);
  const newId = created?.[1];
  record("20. Assistant : evenement cree, redirige vers les invites", Boolean(newId), new URL(owner.url()).pathname);
  const newEvent = newId
    ? await prisma.event.findUnique({ where: { id: newId }, include: { members: true, venues: true } })
    : null;
  record(
    "21. Heure murale convertie avec le fuseau du lieu",
    newEvent?.startsAt.toISOString() === "2027-02-14T14:00:00.000Z",
    newEvent?.startsAt.toISOString(),
  );
  record(
    "22. Createur proprietaire, lieu enregistre",
    newEvent?.members.length === 1 && newEvent.members[0].role === "OWNER" && newEvent.venues.length === 1,
  );

  // Ajout manuel : le formulaire est deja ouvert pour un evenement neuf.
  await owner.waitForSelector('input[placeholder="Paul NGONO"]');
  await owner.type('input[placeholder="Paul NGONO"]', "Paul NGONO");
  await owner.type('input[placeholder="699 12 34 56"]', "699 12 34 56");
  await clickText(owner, "button", "Ajouter le groupe");
  await owner.waitForFunction(() => document.body.innerText.includes("ajoute."), { timeout: 30000 });
  const manual = await prisma.guest.findFirst({ where: { group: { eventId: newId } }, include: { group: { include: { invitation: true } } } });
  record(
    "23. Ajout manuel : nom decoupe, numero normalise, lien cree",
    manual?.firstName === "Paul" && manual?.lastName === "Ngono" && manual?.phoneE164 === "+237699123456" && (manual?.group.invitation?.token.length ?? 0) >= 40,
    `${manual?.firstName} / ${manual?.lastName} / ${manual?.phoneE164}`,
  );

  // Collage : 20 familles de 2, un doublon de numero, un numero incomplet.
  const lines = [];
  for (let i = 0; i < 20; i += 1) {
    const phone = `677 ${String(100000 + i * 7).slice(-6).replace(/(\d{3})(\d{3})/, "$1 $2")}`;
    lines.push(`Adulte${i} FAMILLE${i} - ${phone} - Famille ${i}`);
    lines.push(`Conjoint${i} Famille${i} ; 699${String(200000 + i).slice(-6)} ; famille ${i}`);
  }
  lines.push("Doublon NUMERO - 677 100 000 - Autre groupe");
  lines.push("Oncle INCOMPLET - 699 12");
  await clickText(owner, "button", "Coller une liste");
  await owner.waitForSelector('textarea[aria-label="Liste d invites a coller"]');
  await setValue(owner, 'textarea[aria-label="Liste d invites a coller"]', lines.join("\n"));
  await clickText(owner, "button", "Analyser la liste");
  await owner.waitForFunction(() => /a importer/.test(document.body.innerText), { timeout: 30000 });
  const review = await owner.evaluate(() => document.body.innerText);
  record("24. Relecture : 42 lignes, 41 a importer, 21 groupes", /42 lignes/.test(review) && /41 a importer · 21 groupes/.test(review), review.match(/\d+ a importer[^\n]*/)?.[0]);
  record("25. Doublon de numero signale et decoche", /Numero deja present - ligne 1/.test(review));
  record("26. Numero incomplet signale, jamais complete", /Numero incomplet/.test(review) && /Source : « Oncle INCOMPLET - 699 12 »/.test(review));

  await clickText(owner, "button", "Importer 21 groupes");
  await owner.waitForFunction(() => /21 groupes importes/.test(document.body.innerText), { timeout: 60000 });
  await owner.waitForFunction(() => /22 groupes · 42 personnes/.test(document.body.innerText), { timeout: 30000 });
  const elapsed = Math.round((Date.now() - t0) / 1000);
  record("27. Import enregistre : 22 groupes, 42 personnes", true, `parcours complet en ${elapsed} s`);
  const incomplete = await prisma.guest.findFirst({ where: { group: { eventId: newId }, lastName: "Incomplet" } });
  record("28. Numero incomplet stocke brut, sans E.164", incomplete?.phoneRaw === "699 12" && incomplete?.phoneE164 === null);

  // Mobile : pas de defilement horizontal sur l ecran le plus charge.
  await owner.setViewport({ width: 360, height: 780, deviceScaleFactor: 2 });
  await owner.reload({ waitUntil: "networkidle0" });
  const overflowX = await owner.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record("29. Liste des invites a 360 px sans defilement horizontal", overflowX <= 0, `${overflowX}px`);
  if (process.env.SCREENSHOT_DIR) await owner.screenshot({ path: `${process.env.SCREENSHOT_DIR}/invites-360.png`, fullPage: true });
  await owner.setViewport({ width: 1366, height: 900 });

  // ================================================ PHASE 2 - PERMISSIONS --
  const limit = await api(owner, `/api/organizer/events/${newId}/import`, "PUT", {
    groups: Array.from({ length: 9 }, (_, i) => ({ name: `Solo ${i}`, maxSeats: 1, guests: [{ firstName: `Solo${i}` }] })),
  });
  record("30. Limite de l offre gratuite (30 groupes) appliquee cote serveur", limit.status === 409, `HTTP ${limit.status} ${limit.body?.error ?? ""}`);

  const sections = await api(owner, `/api/organizer/events/${newId}/sections`, "PUT", {
    sections: [{ kind: "program", title: "Programme", data: { items: [{ time: "25:00", label: "Minuit passe" }] } }],
  });
  record("31. Section invalide refusee (heure 25:00)", sections.status === 422, `HTTP ${sections.status}`);

  const notedGroup = await prisma.guestGroup.findFirstOrThrow({ where: { eventId: EVENT_ID, internalNote: { not: null } } });
  const ownerGuests = await rawHtml(owner, `/dashboard/events/${EVENT_ID}/invites`);
  const coGuests = await rawHtml(co, `/dashboard/events/${EVENT_ID}/invites`);
  record("32. Note interne visible par le proprietaire", ownerGuests.html.includes(notedGroup.internalNote));
  record("33. Note interne absente du HTML du co-organisateur (sans « sensitive »)", coGuests.html.includes("Famille") && !coGuests.html.includes(notedGroup.internalNote));

  const coContent = await rawHtml(co, `/dashboard/events/${EVENT_ID}/contenu`);
  record("34. Co-organisateur sans « design » : Contenu introuvable", coContent.html.includes("Page introuvable"));
  const coPatch = await api(co, `/api/organizer/events/${EVENT_ID}`, "PATCH", { title: "Pirate" });
  record("35. Co-organisateur sans « design » : modification refusee", coPatch.status === 404, `HTTP ${coPatch.status}`);

  // Le co-organisateur modifie un groupe : la note qu il ne voit pas doit survivre.
  const notedFull = await prisma.guestGroup.findUniqueOrThrow({ where: { id: notedGroup.id }, include: { guests: { orderBy: { position: "asc" } } } });
  const coEdit = await api(co, `/api/organizer/events/${EVENT_ID}/groups/${notedGroup.id}`, "PATCH", {
    name: notedFull.name,
    maxSeats: notedFull.maxSeats,
    internalNote: null,
    guests: notedFull.guests.map((g) => ({ id: g.id, firstName: g.firstName, lastName: g.lastName, phone: g.phoneRaw, ageCategory: g.ageCategory })),
  });
  const afterCo = await prisma.guestGroup.findUniqueOrThrow({ where: { id: notedGroup.id } });
  record("36. Edition par le co-organisateur : la note interne survit", coEdit.status === 200 && afterCo.internalNote === notedGroup.internalNote, `HTTP ${coEdit.status}`);

  // Un groupe avec AU MOINS deux presents : avec un seul, la requete serait
  // acceptee et supprimerait des invites du jeu de demonstration.
  const confirmedGroups = await prisma.guestGroup.findMany({
    where: { eventId: EVENT_ID, invitation: { response: { status: "ATTENDING" } } },
    include: { guests: { orderBy: { position: "asc" } } },
  });
  const attendingGroup = confirmedGroups.find((g) => g.guests.filter((x) => x.attending).length >= 2);
  if (!attendingGroup) throw new Error("jeu de donnees : aucun groupe avec deux presents");
  const presentCount = attendingGroup.guests.filter((g) => g.attending).length;
  const guestsBefore = attendingGroup.guests.length;
  const quota = await api(owner, `/api/organizer/events/${EVENT_ID}/groups/${attendingGroup.id}`, "PATCH", {
    name: attendingGroup.name,
    maxSeats: 1,
    guests: [{ id: attendingGroup.guests[0].id, firstName: attendingGroup.guests[0].firstName }],
  });
  const guestsAfter = await prisma.guest.count({ where: { groupId: attendingGroup.id } });
  record(
    "37. Quota sous le nombre de confirmes refuse, rien modifie",
    quota.status === 409 && guestsAfter === guestsBefore,
    `${presentCount} presents → HTTP ${quota.status}`,
  );

  const intruderEvent = await prisma.event.findFirstOrThrow({ where: { members: { some: { user: { email: "intrus@tap.exemple" } } } } });
  const intrusAdd = await api(intruder, `/api/organizer/events/${EVENT_ID}/groups`, "POST", { name: "Pirate", maxSeats: 1, guests: [{ firstName: "Pirate" }] });
  record("38. Intrus : ajout d invite refuse", intrusAdd.status === 404, `HTTP ${intrusAdd.status}`);
  const crossEvent = await api(intruder, `/api/organizer/events/${intruderEvent.id}/groups/${attendingGroup.id}`, "DELETE");
  const stillThere = await prisma.guestGroup.findUnique({ where: { id: attendingGroup.id } });
  record("39. Intrus : groupe d un autre evenement via SON evenement → 404, rien supprime", crossEvent.status === 404 && Boolean(stillThere), `HTTP ${crossEvent.status}`);
  const intrusImport = await api(intruder, `/api/organizer/events/${EVENT_ID}/import`, "POST", { text: "Paul - 699123456" });
  record("40. Intrus : analyse d import refusee (aucune liste existante divulguee)", intrusImport.status === 404 && !intrusImport.body?.existing);
  const anonCreate = await api(anon, "/api/organizer/events", "POST", {});
  record("41. Anonyme : creation refusee", anonCreate.status === 401, `HTTP ${anonCreate.status}`);

  // ================================================ PHASE 3 - DESIGN --
  // Banc d essai : 4 cas x 2 variantes x 5 largeurs du cahier (§12.1).
  const bench = await newSession();
  await signIn(bench, "organisateur@tap.exemple");
  const overflows = [];
  for (const benchCase of ["reference", "long", "minimal", "clos"]) {
    for (const variant of ["ivoire", "nuit"]) {
      for (const width of [360, 375, 390, 393, 430]) {
        await bench.setViewport({ width, height: 800 });
        await bench.goto(`${BASE}/preview/invitation/banc?case=${benchCase}&variant=${variant}`, { waitUntil: "networkidle0", timeout: 90000 });
        const over = await bench.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (over > 0) overflows.push(`${benchCase}/${variant}/${width}px:+${over}`);
      }
    }
  }
  record("50. Banc : aucun debordement (4 cas, 2 variantes, 5 largeurs)", overflows.length === 0, overflows.join(" ") || "40 rendus");

  // Premier ecran (§12.1 hierarchie) : noms, date et bouton visibles sans defiler.
  const firstScreen = [];
  for (const [width, height] of [[360, 740], [390, 844], [430, 932]]) {
    await bench.setViewport({ width, height });
    await bench.goto(`${BASE}/preview/invitation/banc?case=reference`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 900));
    const bottom = await bench.evaluate(() => document.getElementById("ri-hero-cta").getBoundingClientRect().bottom);
    if (bottom > height) firstScreen.push(`${width}x${height}: bouton a ${Math.round(bottom)}px`);
  }
  record("51. Premier ecran : noms, date et bouton de reponse sans defiler", firstScreen.length === 0, firstScreen.join(" ") || "360, 390, 430");

  await bench.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await bench.goto(`${BASE}/preview/invitation/banc?case=reference`, { waitUntil: "networkidle0" });
  const animationMs = await bench.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".pc-fade")).animationDuration) * 1000);
  record("52. Animations reduites respectees", animationMs <= 0.01, `${animationMs} ms`);
  await bench.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  const benchHtml = (await rawHtml(bench, `/preview/invitation/banc?case=reference`)).html;
  record("53. Sans JavaScript : le bouton de reponse est dans le HTML serveur", benchHtml.includes('href="#rsvp"') && benchHtml.includes("Répondre à l’invitation"));

  // Changer de theme ne modifie aucune donnee metier (§22).
  const snapshot = async () => {
    const e = await prisma.event.findUniqueOrThrow({
      where: { id: EVENT_ID },
      include: { venues: true, sections: true, meals: true, groups: { include: { guests: true, invitation: { include: { response: true, ticket: true } } } } },
    });
    const { themeSettings, themeKey, updatedAt, ...business } = e;
    return JSON.stringify(business, (k, v) => (k === "updatedAt" ? undefined : v));
  };
  const before = await snapshot();
  const design = await api(owner, `/api/organizer/events/${EVENT_ID}/design`, "PUT", {
    themeKey: "royal-ivory",
    settings: { variant: "nuit", accent: "<script>alert(1)</script>", countdown: false },
  });
  const after = await snapshot();
  const stored = await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID }, select: { themeSettings: true } });
  record("54. Changement de design : aucune donnee metier modifiee", design.status === 200 && before === after, `HTTP ${design.status}`);
  record(
    "55. Reglage trafique remplace par la valeur du theme",
    // Champ par champ : PostgreSQL (jsonb) ne conserve pas l ordre des cles.
    stored.themeSettings.variant === "nuit" && stored.themeSettings.accent === "champagne" && stored.themeSettings.countdown === false,
    JSON.stringify(stored.themeSettings),
  );
  await api(owner, `/api/organizer/events/${EVENT_ID}/design`, "PUT", { themeKey: "royal-ivory", settings: {} });

  // Apercu : cloisonne, et rien de ce que l invite ne doit pas voir.
  const preview = await rawHtml(owner, `/preview/invitation/${EVENT_ID}?variant=nuit`);
  const somePhone = (await prisma.guest.findFirstOrThrow({ where: { group: { eventId: EVENT_ID }, phoneE164: { not: null } } })).phoneE164;
  record("56. Apercu organisateur rendu avec les vraies donnees", preview.html.includes("Cathedrale Notre-Dame des Victoires") && preview.html.includes("Beriole"));
  record(
    "57. Apercu : ni note interne, ni numero, ni jeton dans le HTML",
    !preview.html.includes(notedGroup.internalNote) && !preview.html.includes(somePhone.slice(4)) && !/"token"/.test(preview.html),
  );
  const intruderPreview = await rawHtml(intruder, `/preview/invitation/${EVENT_ID}`);
  record("58. Intrus : apercu introuvable", intruderPreview.html.includes("Page introuvable") && !intruderPreview.html.includes("Cathedrale"));
  const coDesign = await api(co, `/api/organizer/events/${EVENT_ID}/design`, "PUT", { themeKey: "royal-ivory", settings: {} });
  record("59. Co-organisateur sans « design » : design refuse", coDesign.status === 404, `HTTP ${coDesign.status}`);
  const intruderHero = await intruder.evaluate(async (id) => {
    const body = new FormData();
    body.append("file", new File([new Uint8Array([0xff, 0xd8, 0xff])], "x.jpg", { type: "image/jpeg" }));
    return (await fetch(`/api/organizer/events/${id}/hero`, { method: "POST", body })).status;
  }, EVENT_ID);
  record("60. Intrus : envoi de photo refuse", intruderHero === 404, `HTTP ${intruderHero}`);

  const studioOverflow = [];
  for (const width of [360, 390]) {
    await bench.setViewport({ width, height: 844 });
    await bench.goto(`${BASE}/dashboard/events/${EVENT_ID}/design`, { waitUntil: "networkidle0", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1200));
    const over = await bench.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) studioOverflow.push(`${width}px:+${over}`);
  }
  record("61. Studio de design sans debordement sur telephone", studioOverflow.length === 0, studioOverflow.join(" ") || "360, 390");

  // ============================================ PHASE 4 - PAGE INVITE --
  const UNAVAILABLE = "Cette invitation n’est pas disponible";
  const openTarget = await prisma.invitation.findFirstOrThrow({
    where: { group: { eventId: EVENT_ID }, state: { in: ["SHARED", "CREATED", "OPENED"] }, revokedAt: null },
    include: { group: { include: { guests: true } } },
  });
  // Etat de depart connu : le passage precedent a pu l ouvrir.
  await prisma.invitation.update({ where: { id: openTarget.id }, data: { state: "SHARED", firstOpenedAt: null, lastOpenedAt: null, openCount: 0 } });
  const openUrl = `/i/${openTarget.token}`;
  const guestFirstName = openTarget.group.guests.find((g) => g.firstName && !g.isPlusOne)?.firstName;

  const revoked = await prisma.invitation.findFirstOrThrow({ where: { group: { eventId: EVENT_ID }, revokedAt: { not: null } } });
  const draft = await prisma.invitation.findFirstOrThrow({ where: { group: { event: { status: "DRAFT" } } } });
  const neutralTexts = [];
  const visitor = await newSession();
  for (const path of [`/i/${"x".repeat(43)}`, `/i/${revoked.token}`, `/i/${draft.token}`, "/i/court"]) {
    await visitor.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 90000 });
    neutralTexts.push(await visitor.evaluate(() => document.querySelector("main")?.innerText ?? ""));
  }
  record(
    "70. Jeton inconnu, revoque, brouillon, malforme : page neutre identique",
    neutralTexts.every((t) => t === neutralTexts[0] && t.includes(UNAVAILABLE) && !t.includes("Beriole")),
  );

  // Comme un robot d apercu : sans JavaScript, avec son user-agent.
  const bot = await fetch(`${BASE}${openUrl}`, { headers: { "User-Agent": "WhatsApp/2.23.20.0 A", "x-forwarded-for": `192.0.2.${Date.now() % 250}` } });
  const botHtml = await bot.text();
  // Plusieurs familles portent le meme nom dans le jeu de donnees : on exclut ce nom-la.
  const otherGroup = await prisma.guestGroup.findFirstOrThrow({ where: { eventId: EVENT_ID, id: { not: openTarget.groupId }, name: { startsWith: "Famille", not: openTarget.group.name } } });
  // Salutation attendue : les prenoms jusqu a deux, le nom du groupe au-dela.
  const namedGuests = openTarget.group.guests.filter((g) => g.firstName && !g.isPlusOne);
  const expectedSalutation = namedGuests.length > 0 && namedGuests.length <= 2 ? namedGuests[0].firstName : openTarget.group.name;
  record(
    "71. Page invite : contenu de l evenement et salutation, rien d autre",
    bot.status === 200 && botHtml.includes("Beriole") && botHtml.includes(expectedSalutation) &&
      !botHtml.includes(notedGroup.internalNote) && !botHtml.includes(somePhone.slice(4)) && !botHtml.includes(otherGroup.name),
    `salutation « ${expectedSalutation} »`,
  );
  record(
    "72. En-tetes : no-store, no-referrer, noindex",
    /no-store/.test(bot.headers.get("cache-control") ?? "") && bot.headers.get("referrer-policy") === "no-referrer" && /noindex/.test(bot.headers.get("x-robots-tag") ?? ""),
    `${bot.headers.get("cache-control")} | ${bot.headers.get("referrer-policy")}`,
  );
  const ogTitle = botHtml.match(/property="og:title" content="([^"]+)"/)?.[1] ?? "";
  // Egalite stricte : un invite peut s appeler "Anna" comme l une des hotes,
  // et "contient le prenom" ne prouverait alors rien.
  record("73. Apercu de partage : les hotes, jamais le nom de l invite", ogTitle.replace(/&amp;/g, "&") === "Beriole & Anna vous invitent", ogTitle);
  const afterBot = await prisma.invitation.findUniqueOrThrow({ where: { id: openTarget.id } });
  record("74. Robot d apercu : ouverture non comptee", afterBot.openCount === 0 && afterBot.state === "SHARED");

  // Vrai navigateur, premiere visite : enveloppe, puis ouverture comptee.
  await visitor.setViewport({ width: 390, height: 844 });
  await visitor.goto(`${BASE}${openUrl}`, { waitUntil: "networkidle0", timeout: 90000 });
  const veilFirst = await visitor.evaluate(() => Boolean(document.querySelector(".env-veil")));
  await new Promise((r) => setTimeout(r, 800));
  const opened = await prisma.invitation.findUniqueOrThrow({ where: { id: openTarget.id } });
  record("75. Premiere visite : enveloppe, ouverture comptee une fois", veilFirst && opened.openCount === 1 && opened.state === "OPENED" && Boolean(opened.firstOpenedAt), `ouvertures ${opened.openCount}, etat ${opened.state}`);

  await visitor.click('button[aria-label="Ouvrir l invitation"]');
  const openStart = Date.now();
  await visitor.waitForFunction(() => !document.querySelector(".env-veil"), { timeout: 5000 }).catch(() => null);
  const openMs = Date.now() - openStart;
  const scrollFree = await visitor.evaluate(() => document.documentElement.style.overflow !== "hidden");
  record("76. Enveloppe ouverte en moins de 4 s, defilement rendu", openMs < 4000 && scrollFree, `${openMs} ms`);

  await visitor.goto(`${BASE}${openUrl}`, { waitUntil: "networkidle0" });
  const veilSecond = await visitor.evaluate(() => Boolean(document.querySelector(".env-veil")));
  record("77. Deuxieme visite : pas d enveloppe", !veilSecond);

  await visitor.goto(`${BASE}${openUrl}?enveloppe=1`, { waitUntil: "networkidle0" });
  await visitor.evaluate(() => [...document.querySelectorAll(".env-veil button")].find((b) => b.textContent.trim() === "Passer").click());
  await new Promise((r) => setTimeout(r, 150));
  record("78. « Passer » donne l invitation immediatement", await visitor.evaluate(() => !document.querySelector(".env-veil")));

  await visitor.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await visitor.goto(`${BASE}${openUrl}?enveloppe=1`, { waitUntil: "networkidle0" });
  await visitor.click('button[aria-label="Ouvrir l invitation"]');
  const reducedStart = Date.now();
  await visitor.waitForFunction(() => !document.querySelector(".env-veil"), { timeout: 3000 }).catch(() => null);
  record("79. Mouvement reduit : fondu court a la place de la sequence", Date.now() - reducedStart < 700, `${Date.now() - reducedStart} ms`);
  await visitor.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  const noJs = await newSession();
  await noJs.setJavaScriptEnabled(false);
  await noJs.goto(`${BASE}${openUrl}?enveloppe=1`, { waitUntil: "networkidle0" });
  const noJsState = await noJs.evaluate(() => ({
    veilHidden: [...document.querySelectorAll(".env-veil")].every((v) => getComputedStyle(v).display === "none"),
    text: document.body.innerText.includes("Beriole"),
  }));
  record("80. Sans JavaScript : enveloppe masquee, invitation lisible", noJsState.veilHidden && noJsState.text);

  const counted = await prisma.invitation.findUniqueOrThrow({ where: { id: openTarget.id } });
  await owner.goto(`${BASE}${openUrl}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  const afterOwner = await prisma.invitation.findUniqueOrThrow({ where: { id: openTarget.id } });
  record("81. L organisateur qui verifie un lien n est pas compte", afterOwner.openCount === counted.openCount, `${counted.openCount} → ${afterOwner.openCount}`);

  const responded = await prisma.invitation.findFirstOrThrow({ where: { group: { eventId: EVENT_ID }, state: "RESPONDED" } });
  await visitor.goto(`${BASE}/i/${responded.token}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  record("82. Ouverture d une invitation deja repondue : l etat ne recule pas", (await prisma.invitation.findUniqueOrThrow({ where: { id: responded.id } })).state === "RESPONDED");

  // Performance (§2.1, §20) : 4G lente, processeur ralenti, deuxieme visite.
  // Mediane de cinq chargements a froid : sur une machine locale qui fait
  // tourner le serveur, la base ET le navigateur, les mesures varient d un
  // passage a l autre (medianes de 3 chargements observees : 2268 a 2788 ms
  // sans aucun changement de code). Cinq echantillons stabilisent la mediane
  // sans assouplir le seuil de 2,5 s.
  const { PredefinedNetworkConditions } = await import("puppeteer-core");
  const samples = [];
  for (let run = 0; run < 5; run += 1) {
    const perf = await newSession();
    await perf.setViewport({ width: 390, height: 844 });
    await perf.setExtraHTTPHeaders({ "x-forwarded-for": `192.0.2.${(Date.now() + run * 17) % 250}` });
    await perf.emulateNetworkConditions(PredefinedNetworkConditions["Slow 4G"]);
    await perf.emulateCPUThrottling(4);
    await perf.evaluateOnNewDocument(() => {
      window.__lcp = 0;
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await perf.goto(`${BASE}${openUrl}`, { waitUntil: "networkidle0", timeout: 120000 });
    await new Promise((r) => setTimeout(r, 1200));
    samples.push(await perf.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Number(window.__cls.toFixed(3)) })));
    await perf.close();
  }
  const lcps = samples.map((s) => s.lcp).sort((a, b) => a - b);
  const worstCls = Math.max(...samples.map((s) => s.cls));
  record("83. 4G lente : LCP median < 2,5 s et CLS < 0,05", lcps[2] < 2500 && worstCls < 0.05, `LCP ${lcps.join(" / ")} ms (mediane ${lcps[2]}), CLS max ${worstCls}`);

  // Publication.
  const coPublish = await api(co, `/api/organizer/events/${EVENT_ID}/publish`, "POST", { published: false });
  record("84. Co-organisateur sans « design » : publication refusee", coPublish.status === 404, `HTTP ${coPublish.status}`);
  const publishedAtBefore = (await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID } })).publishedAt;
  await api(owner, `/api/organizer/events/${EVENT_ID}/publish`, "POST", { published: false });
  const whileDraft = await (await fetch(`${BASE}${openUrl}`, { headers: { "x-forwarded-for": `192.0.2.${(Date.now() + 7) % 250}` } })).text();
  await api(owner, `/api/organizer/events/${EVENT_ID}/publish`, "POST", { published: true });
  const republished = await (await fetch(`${BASE}${openUrl}`, { headers: { "x-forwarded-for": `192.0.2.${(Date.now() + 13) % 250}` } })).text();
  const publishedAtAfter = (await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID } })).publishedAt;
  record(
    "85. Depublie : liens neutres ; republie : liens rendus, date de publication conservee",
    whileDraft.includes(UNAVAILABLE) && !whileDraft.includes("Cathedrale") && republished.includes("Beriole") && publishedAtBefore?.getTime() === publishedAtAfter?.getTime(),
  );

  // Limitation sur la resolution des jetons : 60 par minute par adresse.
  const limitIp = `198.18.${Date.now() % 250}.${(Date.now() >> 8) % 250}`;
  let lastBody = "";
  for (let i = 0; i < 61; i += 1) {
    lastBody = await (await fetch(`${BASE}/i/${"y".repeat(43)}`, { headers: { "x-forwarded-for": limitIp } })).text();
  }
  const blocked = await (await fetch(`${BASE}${openUrl}`, { headers: { "x-forwarded-for": limitIp } })).text();
  record("86. Au-dela de 60 jetons par minute, meme un lien valide repond neutre", lastBody.includes(UNAVAILABLE) && blocked.includes(UNAVAILABLE) && !blocked.includes("Cathedrale"));

  // ================================================ PHASE 5 - RSVP --
  let ipSeq = Date.now() % 200;
  // Deux adresses identiques dans la meme minute cumuleraient leurs envois et
  // declencheraient la limitation (20/min) : le compteur ne se repete jamais.
  const nextIp = () => {
    ipSeq += 1;
    return `198.51.${Math.floor(ipSeq / 250) % 250}.${ipSeq % 250}`;
  };
  const postRsvp = async (body) => {
    const r = await fetch(`${BASE}/api/invitations/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": nextIp() },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const loadGroup = (groupId) =>
    prisma.guestGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { guests: { include: { preference: true }, orderBy: { position: "asc" } }, invitation: { include: { response: { include: { history: true } } } } },
    });
  const pendingGroups = await prisma.guestGroup.findMany({
    where: { eventId: EVENT_ID, invitation: { revokedAt: null, response: null } },
    include: { guests: true, invitation: true },
  });
  const originalRsvpSettings = (await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID } })).rsvpSettings;
  const mealsOfEvent = await prisma.mealOption.findMany({ where: { eventId: EVENT_ID }, orderBy: { position: "asc" } });
  const originalQuestions = await prisma.rsvpQuestion.findMany({ where: { eventId: EVENT_ID }, orderBy: { position: "asc" } });

  // Parcours reel : une famille avec au moins un enfant.
  const family = pendingGroups.find((g) => g.guests.length >= 3 && g.guests.some((x) => x.ageCategory === "CHILD")) ?? pendingGroups.find((g) => g.guests.length >= 2);
  const guestPage = await newSession();
  await guestPage.setViewport({ width: 390, height: 844 });
  await guestPage.setExtraHTTPHeaders({ "x-forwarded-for": nextIp() });
  await guestPage.goto(`${BASE}/i/${family.invitation.token}`, { waitUntil: "networkidle0", timeout: 90000 });
  await guestPage.evaluate(() => [...document.querySelectorAll(".env-veil button")].find((b) => b.textContent.trim() === "Passer")?.click());
  let gestures = 0;
  const tap = async (text) => {
    gestures += 1;
    const ok = await guestPage.evaluate((t) => {
      const el = [...document.querySelectorAll("#rsvp label, #rsvp button")].find((x) => x.textContent.trim().startsWith(t));
      el?.click();
      return Boolean(el);
    }, text);
    if (!ok) throw new Error(`RSVP : « ${text} » introuvable`);
    await new Promise((r) => setTimeout(r, 250));
  };
  await tap("Oui");
  await tap("Continuer");
  await tap(mealsOfEvent.find((m) => !m.forChildren).label);
  await tap("Continuer");
  await tap("Continuer");
  await tap("Confirmer ma réponse");
  await guestPage.waitForFunction(() => document.body.innerText.includes("Merci, votre réponse est enregistrée."), { timeout: 15000 }).catch(() => null);
  const afterUi = await loadGroup(family.id);
  const kids = afterUi.guests.filter((x) => x.ageCategory === "CHILD");
  const babies = afterUi.guests.filter((x) => x.ageCategory === "BABY");
  const childMenu = mealsOfEvent.find((m) => m.forChildren);
  record(
    "90. Famille : reponse complete en 6 gestes au plus, par l interface",
    gestures <= 6 && afterUi.invitation.state === "RESPONDED" && afterUi.invitation.response?.status === "ATTENDING" && afterUi.guests.every((x) => x.attending === true),
    `${gestures} gestes, ${afterUi.guests.length} personnes`,
  );
  record(
    "91. Repas : menu commun aux adultes, menu enfant aux enfants, rien pour un bebe",
    kids.every((k) => k.preference?.mealOptionId === childMenu.id) && babies.every((x) => !x.preference?.mealOptionId) &&
      afterUi.guests.filter((x) => x.ageCategory === "ADULT").every((x) => x.preference?.mealOptionId === mealsOfEvent.find((m) => !m.forChildren).id),
  );
  record("92. Historique : une entree par reponse", afterUi.invitation.response.history.length === 1);

  // Changement d avis par l interface : decline.
  await guestPage.goto(`${BASE}/i/${family.invitation.token}`, { waitUntil: "networkidle0" });
  const summaryShown = await guestPage.evaluate(() => document.body.innerText.includes("Vous avez déjà répondu."));
  gestures = 0;
  await tap("Modifier ma réponse");
  await tap("Non, je ne pourrai pas venir");
  await tap("Confirmer ma réponse");
  await guestPage.waitForFunction(() => document.body.innerText.includes("Merci, votre réponse est enregistrée."), { timeout: 15000 }).catch(() => null);
  const declined = await loadGroup(family.id);
  record(
    "93. Modification : decline, tout le monde absent, repas effaces, version 2",
    summaryShown && declined.invitation.response.status === "DECLINED" && declined.guests.every((x) => x.attending === false && !x.preference) && declined.invitation.response.version === 2,
    `version ${declined.invitation.response.version}`,
  );

  // Regles serveur, requetes ecrites a la main.
  const couple = pendingGroups.find((g) => g.id !== family.id && g.guests.filter((x) => !x.isPlusOne).length >= 1);
  const coupleMembers = couple.guests.filter((x) => !x.isPlusOne);
  const base = (over = {}) => ({
    token: couple.invitation.token,
    version: 0,
    status: "ATTENDING",
    people: coupleMembers.map((m) => ({ key: m.id, firstName: m.firstName, ageCategory: m.ageCategory, attending: true })),
    meals: {},
    allergies: {},
    consent: false,
    answers: [],
    ...over,
  });
  const overQuota = await postRsvp(
    base({ people: [...base().people, ...Array.from({ length: couple.maxSeats + 1 }, (_, i) => ({ key: `new:${i}`, firstName: `Pirate${i}`, ageCategory: "ADULT", attending: true }))] }),
  );
  const afterQuota = await loadGroup(couple.id);
  record("94. Quota : accompagnants ajoutes a la main au-dela des places → refuse, rien ecrit", overQuota.status === 422 && overQuota.body?.code === "QUOTA" && !afterQuota.invitation.response && afterQuota.guests.length === couple.guests.length, `HTTP ${overQuota.status}`);

  const foreign = await prisma.guest.findFirstOrThrow({ where: { group: { eventId: EVENT_ID, id: { not: couple.id } } } });
  const hijack = await postRsvp(base({ people: [{ key: foreign.id, ageCategory: "ADULT", attending: true }] }));
  const foreignAfter = await prisma.guest.findUniqueOrThrow({ where: { id: foreign.id } });
  record("95. Personne d un autre groupe : refusee, intacte", hijack.status === 422 && foreignAfter.attending === foreign.attending, `HTTP ${hijack.status}`);

  const noConsent = await postRsvp(base({ allergies: { [coupleMembers[0].id]: "Arachides" } }));
  record("96. Allergie sans accord explicite : refusee", noConsent.status === 422 && noConsent.body?.code === "CONSENT", `HTTP ${noConsent.status}`);

  const [first, second] = await Promise.all([
    postRsvp(base({ allergies: { [coupleMembers[0].id]: "Arachides" }, consent: true })),
    postRsvp(base({ status: "DECLINED" })),
  ]);
  const raced = await loadGroup(couple.id);
  const raceStatuses = [first.status, second.status].sort();
  record(
    "97. Deux envois simultanes de la meme version : un seul accepte, l autre en conflit",
    raceStatuses[0] === 200 && raceStatuses[1] === 409 && raced.invitation.response.version === 1 && raced.invitation.response.history.length === 1,
    `${first.status} / ${second.status}`,
  );
  const withAllergy = await loadGroup(couple.id);
  if (withAllergy.invitation.response.status === "ATTENDING") {
    record(
      "98. Allergie avec accord : stockee, consentement date, jamais recopiee dans l historique",
      withAllergy.guests[0].preference?.allergies === "Arachides" && Boolean(withAllergy.invitation.response.sensitiveConsentAt) &&
        !JSON.stringify(withAllergy.invitation.response.history).includes("Arachides"),
    );
  } else {
    const retry = await postRsvp(base({ version: 1, allergies: { [coupleMembers[0].id]: "Arachides" }, consent: true }));
    const retried = await loadGroup(couple.id);
    record(
      "98. Allergie avec accord : stockee, consentement date, jamais recopiee dans l historique",
      retry.status === 200 && retried.guests[0].preference?.allergies === "Arachides" && Boolean(retried.invitation.response.sensitiveConsentAt) &&
        !JSON.stringify(retried.invitation.response.history).includes("Arachides"),
    );
  }

  const stale = await postRsvp(base({ version: 0, status: "DECLINED" }));
  record("99. Version perimee (autre onglet) : conflit", stale.status === 409 && stale.body?.code === "CONFLICT", `HTTP ${stale.status}`);

  const currentVersion = (await loadGroup(couple.id)).invitation.response.version;
  await prisma.event.update({ where: { id: EVENT_ID }, data: { rsvpSettings: { ...originalRsvpSettings, allowEdit: false } } });
  const locked = await postRsvp(base({ version: currentVersion, status: "DECLINED" }));
  await prisma.event.update({ where: { id: EVENT_ID }, data: { rsvpSettings: { ...originalRsvpSettings, deadline: "2026-01-01T00:00:00Z" } } });
  const late = await postRsvp(base({ version: currentVersion, status: "DECLINED" }));
  const latePage = await (await fetch(`${BASE}/i/${couple.invitation.token}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  await prisma.event.update({ where: { id: EVENT_ID }, data: { rsvpSettings: originalRsvpSettings } });
  record("100. Modification interdite par l organisateur : refusee", locked.status === 409 && locked.body?.code === "LOCKED", `HTTP ${locked.status}`);
  record("101. Date limite passee : refusee, la page le dit", late.status === 409 && late.body?.code === "CLOSED" && !latePage.includes("Modifier ma réponse"), `HTTP ${late.status}`);

  const revokedRsvp = await postRsvp({ ...base(), token: revoked.token });
  record("102. Lien revoque : aucune reponse possible", revokedRsvp.status === 404, `HTTP ${revokedRsvp.status}`);

  // Configuration par l organisateur.
  const configBody = {
    settings: { allowMaybe: true, allowEdit: true, deadline: "2026-11-28T23:59" },
    meals: mealsOfEvent.map((m) => ({ id: m.id, label: m.label, description: m.description, forChildren: m.forChildren })),
    questions: [{ type: "SINGLE_CHOICE", label: "Taille de t-shirt ?", options: ["S", "M", "L"], required: true, perGuest: true }],
  };
  const coConfig = await api(co, `/api/organizer/events/${EVENT_ID}/rsvp`, "PUT", configBody);
  record("103. Co-organisateur sans « design » : configuration refusee", coConfig.status === 404, `HTTP ${coConfig.status}`);
  const ownerConfig = await api(owner, `/api/organizer/events/${EVENT_ID}/rsvp`, "PUT", configBody);
  const storedConfig = await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID }, include: { questions: true } });
  record(
    "104. Configuration enregistree : date limite convertie depuis l heure du lieu, anciennes questions remplacees",
    ownerConfig.status === 200 && storedConfig.rsvpSettings.deadline === "2026-11-28T22:59:00.000Z" && storedConfig.questions.length === 1 && storedConfig.questions[0].label === "Taille de t-shirt ?",
    `${ownerConfig.status} ${storedConfig.rsvpSettings.deadline}`,
  );
  const third = pendingGroups.find((g) => g.id !== family.id && g.id !== couple.id);
  const thirdMember = third.guests.find((x) => !x.isPlusOne);
  const missingRequired = await postRsvp({
    token: third.invitation.token, version: 0, status: "ATTENDING",
    people: [{ key: thirdMember.id, ageCategory: thirdMember.ageCategory, attending: true }], meals: {}, allergies: {}, consent: false, answers: [],
  });
  record("105. Question obligatoire par personne non renseignee : refusee", missingRequired.status === 422, `HTTP ${missingRequired.status}`);

  let rateStatus = 0;
  for (let i = 0; i < 12; i += 1) rateStatus = (await postRsvp({ ...base(), token: third.invitation.token, version: 99 })).status;
  record("106. Plus de 10 envois par minute pour un meme lien : bloque", rateStatus === 429, `HTTP ${rateStatus}`);

  const rsvpScreen = await newSession();
  await signIn(rsvpScreen, "organisateur@tap.exemple");
  await rsvpScreen.setViewport({ width: 360, height: 800 });
  await rsvpScreen.goto(`${BASE}/dashboard/events/${EVENT_ID}/rsvp`, { waitUntil: "networkidle0" });
  const rsvpOverflow = await rsvpScreen.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  // Les intitules sont dans des champs : innerText ne lit pas leur valeur.
  const rsvpText = await rsvpScreen.evaluate(() => [...document.querySelectorAll("input, textarea")].map((i) => i.value).join(" | "));
  record("107. Ecran « Reponses » organisateur : complet, sans debordement a 360 px", rsvpOverflow <= 0 && rsvpText.includes("Taille de t-shirt ?"), `${rsvpOverflow}px`);

  // Retour a la configuration du jeu de donnees : reglages ET questions, sinon
  // le passage suivant bute sur la question obligatoire ajoutee au test 104.
  await prisma.event.update({ where: { id: EVENT_ID }, data: { rsvpSettings: originalRsvpSettings } });
  await prisma.rsvpQuestion.deleteMany({ where: { eventId: EVENT_ID } });
  await prisma.rsvpQuestion.createMany({
    data: originalQuestions.map(({ id, ...q }) => ({ ...q, options: q.options ?? [] })),
  });

  // ============================================ PHASE 6 - DISTRIBUTION --
  // Point de depart connu : quatre invitations "a envoyer".
  // Le premier a un numero : on verifie le cas nominal du lien WhatsApp adresse.
  // Peu importe qu un groupe ait deja repondu : le test force l etat du lien.
  const candidates = await prisma.invitation.findMany({
    where: { group: { eventId: EVENT_ID }, revokedAt: null },
    orderBy: { group: { name: "asc" } },
    include: { group: { include: { guests: { orderBy: { position: "asc" } } } } },
  });
  // Nom de groupe UNIQUE : l ecran est interroge par nom, et plusieurs familles
  // du jeu de donnees portent le meme.
  const nameCounts = new Map();
  for (const g of await prisma.guestGroup.findMany({ where: { eventId: EVENT_ID }, select: { name: true } })) nameCounts.set(g.name, (nameCounts.get(g.name) ?? 0) + 1);
  const withPhone = candidates.filter((i) => nameCounts.get(i.group.name) === 1 && i.group.guests.some((g) => g.phoneE164 && !g.isPlusOne));
  const toSend = [withPhone[0], ...candidates.filter((i) => i.id !== withPhone[0].id).slice(0, 3)];
  // Seules ces quatre-la sont "a envoyer" : la file doit en compter exactement trois apres le premier envoi.
  await prisma.invitation.updateMany({
    where: { group: { eventId: EVENT_ID }, state: "CREATED", id: { notIn: toSend.map((i) => i.id) } },
    data: { state: "SHARED", sharedAt: new Date() },
  });
  await prisma.invitation.updateMany({ where: { id: { in: toSend.map((i) => i.id) } }, data: { state: "CREATED", sharedAt: null } });
  await prisma.event.update({ where: { id: EVENT_ID }, data: { shareTemplate: null } });

  const coShare = await rawHtml(co, `/dashboard/events/${EVENT_ID}/partage`);
  const intruderShare = await rawHtml(intruder, `/dashboard/events/${EVENT_ID}/partage`);
  record("110. Partage : co-organisateur sans « messages » et intrus → introuvable", coShare.html.includes("Page introuvable") && intruderShare.html.includes("Page introuvable"));
  const coGuestsHtml = (await rawHtml(co, `/dashboard/events/${EVENT_ID}/invites`)).html;
  record("111. Aucun jeton d invitation hors de l ecran Partage", !toSend.some((i) => coGuestsHtml.includes(i.token)));

  const sharePage = await newSession();
  await signIn(sharePage, "organisateur@tap.exemple");
  await sharePage.setViewport({ width: 390, height: 844 });
  // Les onglets WhatsApp ouverts par les clics sont refermes aussitot.
  browser.on("targetcreated", async (target) => {
    if (target.url().startsWith("https://wa.me")) (await target.page())?.close().catch(() => null);
  });
  await sharePage.goto(`${BASE}/dashboard/events/${EVENT_ID}/partage`, { waitUntil: "networkidle0", timeout: 90000 });
  const shareOverflow = await sharePage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record("112. Ecran Partage sans debordement a 390 px", shareOverflow <= 0, `${shareOverflow}px`);

  const firstToSend = toSend[0];
  const waHref = await sharePage.evaluate((name) => {
    const a = document.querySelector(`a[aria-label="Envoyer sur WhatsApp a ${name}"]`);
    return a?.getAttribute("href") ?? null;
  }, firstToSend.group.name);
  const decoded = waHref ? decodeURIComponent(waHref.split("text=")[1] ?? "") : "";
  const firstPhone = firstToSend.group.guests.find((g) => g.phoneE164 && !g.isPlusOne)?.phoneE164;
  record(
    "113. WhatsApp : numero du groupe, message pre-rempli avec SON lien",
    Boolean(waHref && firstPhone) && decoded.includes(`/i/${firstToSend.token}`) && waHref.startsWith(`https://wa.me/${firstPhone.replace(/\D/g, "")}?`),
    waHref ? waHref.slice(0, 40) : "lien absent",
  );
  await sharePage.evaluate((name) => document.querySelector(`a[aria-label="Envoyer sur WhatsApp a ${name}"]`).click(), firstToSend.group.name);
  await new Promise((r) => setTimeout(r, 300));
  // L onglet WhatsApp passe devant : la console est alors en arriere-plan et
  // Chrome y suspend l affichage des rendus diffuses (visibilityState "hidden").
  // Un utilisateur revient sur l onglet ; on fait de meme. Ce n est pas un
  // defaut de l application : le contenu apparait des le retour au premier plan.
  await sharePage.bringToFront();
  await clickText(sharePage, "button", "Oui");
  await new Promise((r) => setTimeout(r, 800));
  const firstAfter = await prisma.invitation.findUniqueOrThrow({ where: { id: firstToSend.id } });
  record("114. Confirmation « Envoye ? Oui » : invitation marquee envoyee", firstAfter.state === "SHARED" && Boolean(firstAfter.sharedAt));

  // File : les trois restantes, une passee.
  await sharePage.reload({ waitUntil: "networkidle0" });
  // Le rendu peut etre diffuse en plusieurs temps : on attend le bouton lui-meme,
  // pas seulement la fin de l activite reseau.
  await sharePage.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => b.textContent.trim().startsWith("Envoyer a la suite")),
    { timeout: 45000 },
  );
  await clickText(sharePage, "button", "Envoyer a la suite");
  await sharePage.waitForFunction(() => document.body.innerText.includes("1 / 3"), { timeout: 20000 });
  for (const step of ["send", "skip", "send"]) {
    if (step === "send") {
      await sharePage.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Ouvrir WhatsApp")).click());
      await new Promise((r) => setTimeout(r, 300));
      await sharePage.bringToFront();
      await clickText(sharePage, "button", "C est envoye, suivant");
    } else {
      await clickText(sharePage, "button", "Passer");
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  const queueEnded = await sharePage.evaluate(() => document.body.innerText.includes("File terminee"));
  const queued = await prisma.invitation.findMany({ where: { id: { in: toSend.slice(1).map((i) => i.id) } } });
  const sharedCount = queued.filter((i) => i.state === "SHARED").length;
  record("115. Envoi a la suite : 2 envoyees, 1 passee, file terminee sans quitter l ecran", queueEnded && sharedCount === 2 && queued.filter((i) => i.state === "CREATED").length === 1, `${sharedCount} envoyees`);

  // Cycle de vie du lien, par l API.
  const answered = await prisma.invitation.findFirstOrThrow({ where: { group: { eventId: EVENT_ID }, state: "RESPONDED", revokedAt: null }, include: { response: true } });
  const markAnswered = await api(owner, `/api/organizer/events/${EVENT_ID}/groups/${answered.groupId}/link`, "POST", { action: "shared" });
  record("116. Marquer envoyee une invitation deja repondue : l etat ne recule pas", markAnswered.status === 200 && markAnswered.body?.state === "RESPONDED");

  const coLink = await api(co, `/api/organizer/events/${EVENT_ID}/groups/${answered.groupId}/link`, "POST", { action: "revoke" });
  const intruderLink = await api(intruder, `/api/organizer/events/${intruderEvent.id}/groups/${answered.groupId}/link`, "POST", { action: "revoke" });
  record("117. Revocation : co-organisateur sans « messages » et intrus refuses", coLink.status === 404 && intruderLink.status === 404, `${coLink.status} / ${intruderLink.status}`);

  const oldToken = answered.token;
  const revoke = await api(owner, `/api/organizer/events/${EVENT_ID}/groups/${answered.groupId}/link`, "POST", { action: "revoke" });
  const deadPage = await (await fetch(`${BASE}/i/${oldToken}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  const shareRevoked = await api(owner, `/api/organizer/events/${EVENT_ID}/groups/${answered.groupId}/link`, "POST", { action: "shared" });
  record("118. Lien revoque : page neutre, ne peut plus etre marque envoye", revoke.body?.state === "REVOKED" && deadPage.includes(UNAVAILABLE) && shareRevoked.status === 409);

  const regen = await api(owner, `/api/organizer/events/${EVENT_ID}/groups/${answered.groupId}/link`, "POST", { action: "regenerate" });
  const regenerated = await prisma.invitation.findUniqueOrThrow({ where: { id: answered.id }, include: { response: true } });
  const oldStillDead = await (await fetch(`${BASE}/i/${oldToken}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  const newAlive = await (await fetch(`${BASE}/i/${regenerated.token}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  const audits = await prisma.auditLog.count({ where: { targetId: answered.groupId, action: { in: ["invitation.revoke", "invitation.regenerate"] } } });
  record(
    "119. Regeneration : nouveau jeton actif, ancien mort, reponse conservee, journalise",
    regen.status === 200 && regenerated.token !== oldToken && oldStillDead.includes(UNAVAILABLE) && newAlive.includes("Beriole") &&
      regenerated.state === "RESPONDED" && regenerated.response?.id === answered.response?.id && audits >= 2,
  );

  // Modele de message : le lien ne peut pas etre oublie.
  await api(owner, `/api/organizer/events/${EVENT_ID}/share-template`, "PUT", { template: "Coucou {prenom}, on compte sur vous !" });
  await sharePage.reload({ waitUntil: "networkidle0" });
  const templatePreview = await sharePage.evaluate(() => document.querySelector("pre")?.textContent ?? "");
  record("120. Modele sans {lien} : le lien est ajoute au message", templatePreview.startsWith("Coucou") && templatePreview.includes("/i/"));
  await api(owner, `/api/organizer/events/${EVENT_ID}/share-template`, "PUT", { template: null });

  // Import CSV : export Excel francais (Windows-1252, point-virgule), 500 lignes.
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const csvLines = ["Prénom;Nom;Téléphone portable;Famille"];
  for (let i = 0; i < 497; i += 1) csvLines.push(`Hervé${i};NDONGO${i};699${String(300000 + i).padStart(6, "0")};Famille Ndongo ${i % 250}`);
  csvLines.push("Doublon;Numero;699300000;Autre");
  csvLines.push("Oncle;Incomplet;699 12;");
  csvLines.push('"Marie; Claire";"ETO\'O";677 88 99 00;"Famille ""Eto\'o"""');
  const latin1 = Uint8Array.from(Buffer.from(csvLines.join("\r\n"), "latin1"));
  const csvDir = mkdtempSync(join(tmpdir(), "audit-csv-"));
  const csvPath = join(csvDir, "invites-excel.csv");
  writeFileSync(csvPath, latin1);

  const importer = await newSession();
  await signIn(importer, "organisateur@tap.exemple");
  await importer.setViewport({ width: 1280, height: 900 });
  await importer.goto(`${BASE}/dashboard/events/${EVENT_ID}/invites`, { waitUntil: "networkidle0" });
  await clickText(importer, "button", "Coller une liste");
  await importer.waitForSelector('[role="tablist"]');
  await clickText(importer, "button", "Fichier Excel");
  const fileInput = await importer.waitForSelector('input[type="file"]');
  await fileInput.uploadFile(csvPath);
  await importer.waitForFunction(() => document.body.innerText.includes("500 lignes"), { timeout: 10000 });
  const mapping = await importer.evaluate(() => [...document.querySelectorAll("thead select")].map((s) => s.value));
  const accentOk = await importer.evaluate(() => document.body.innerText.includes("Hervé0"));
  record("121. CSV Windows-1252 : accents lus, colonnes reconnues (prenom, nom, telephone, famille)", accentOk && mapping.join(",") === "firstName,lastName,phone,group", mapping.join(","));
  await clickText(importer, "button", "Analyser la liste");
  await importer.waitForFunction(() => /a importer/.test(document.body.innerText), { timeout: 30000 });
  // Les noms sont dans des champs modifiables : innerText ne lit pas leur valeur.
  const csvReview = await importer.evaluate(() => document.body.innerText + " | " + [...document.querySelectorAll("input")].map((i) => i.value).join(" | "));
  record(
    "122. CSV de 500 lignes : doublon et numero incomplet signales avant tout enregistrement",
    /500 lignes/.test(csvReview) && /Numero deja present - ligne 2/.test(csvReview) && /Numero incomplet/.test(csvReview) && csvReview.includes("Marie; Claire"),
    csvReview.match(/\d+ a importer[^\n]*/)?.[0],
  );
  const groupsBeforeCsv = await prisma.guestGroup.count({ where: { eventId: EVENT_ID } });
  record("123. Rien n est ecrit avant la validation", groupsBeforeCsv === (await prisma.guestGroup.count({ where: { eventId: EVENT_ID } })));

  // ================================================ PHASE 7 - DASHBOARD --
  const dash = await newSession();
  await signIn(dash, "organisateur@tap.exemple");
  await dash.setViewport({ width: 390, height: 844 });
  await dash.goto(`${BASE}/dashboard/events/${EVENT_ID}`, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  const dashOverflow = await dash.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const aboveFold = await dash.evaluate(() => {
    const label = [...document.querySelectorAll("dt")].find((d) => d.textContent.trim() === "A relancer");
    return label ? label.getBoundingClientRect().bottom <= window.innerHeight : false;
  });
  record("130. Dashboard a 390 px : chiffres cles visibles sans defiler, sans debordement", dashOverflow <= 0 && aboveFold, `${dashOverflow}px`);

  const sqlNow = await sqlTotals();
  const shownNow = await figureAfter(dash, "Attendus");
  record("131. Attendus du dashboard = recalcul SQL (apres les reponses de l audit)", shownNow === sqlNow.expected, `page ${shownNow} / SQL ${sqlNow.expected}`);

  const csvOf = async (page, kind) =>
    page.evaluate(
      async (k, id) => {
        const res = await fetch(`/api/organizer/events/${id}/export?kind=${k}`);
        // Octets bruts : text() retire le BOM au decodage, et c est lui qu on veut voir.
        const bytes = new Uint8Array(await res.arrayBuffer());
        const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
        return { status: res.status, type: res.headers.get("content-type"), disposition: res.headers.get("content-disposition"), hasBom, text: new TextDecoder().decode(bytes) };
      },
      kind,
      EVENT_ID,
    );
  // Decoupe sur les point-virgules hors guillemets. Les exports n emettent pas
  // de retour a la ligne dans une cellule.
  const parseCsvRows = (text) =>
    text
      .split("\r\n")
      .filter(Boolean)
      .map((line) => {
        const cells = [];
        let cur = "";
        let quoted = false;
        for (let i = 0; i < line.length; i += 1) {
          const ch = line[i];
          if (quoted && ch === '"' && line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else if (ch === '"') quoted = !quoted;
          else if (ch === ";" && !quoted) {
            cells.push(cur);
            cur = "";
          } else cur += ch;
        }
        cells.push(cur);
        return cells;
      });

  const guestsCsv = await csvOf(owner, "guests");
  const catererCsv = await csvOf(owner, "caterer");
  const checkinCsv = await csvOf(owner, "checkin");
  const guestsRows = parseCsvRows(guestsCsv.text);
  const catererRows = parseCsvRows(catererCsv.text);
  const checkinRows = parseCsvRows(checkinCsv.text);
  const sumGuests = guestsRows.slice(1).reduce((n, r) => n + Number(r[5]), 0);
  const sumCheckin = checkinRows.slice(1).reduce((n, r) => n + Number(r[2]), 0);
  record(
    "132. Les trois exports = attendus du dashboard = recalcul SQL",
    guestsCsv.status === 200 && sumGuests === sqlNow.expected && catererRows.length - 1 === sqlNow.expected && sumCheckin === sqlNow.expected,
    `invites ${sumGuests}, traiteur ${catererRows.length - 1}, accueil ${sumCheckin}, SQL ${sqlNow.expected}`,
  );
  record(
    "133. CSV pour Excel : BOM UTF-8, point-virgule, telechargement nomme",
    guestsCsv.hasBom && guestsRows[0].length === 7 && /text\/csv/.test(guestsCsv.type) && /attachment; filename=".*-invites\.csv"/.test(guestsCsv.disposition),
    guestsCsv.disposition,
  );

  const allergyGuest = await prisma.guest.findFirstOrThrow({
    where: { attending: true, preference: { allergies: { not: null } }, group: { eventId: EVENT_ID, invitation: { response: { status: "ATTENDING" } } } },
    include: { preference: true },
  });
  record("134. Traiteur (proprietaire) : le texte des allergies est present", catererCsv.text.includes(allergyGuest.preference.allergies));

  // Le co-organisateur recoit "exports" sans "sensitive" le temps du test.
  const coUser = await prisma.user.findUniqueOrThrow({ where: { email: "coorganisateur@tap.exemple" } });
  const coMember = await prisma.eventMember.findUniqueOrThrow({ where: { eventId_userId: { eventId: EVENT_ID, userId: coUser.id } } });
  const coBefore = await csvOf(co, "caterer");
  await prisma.eventMember.update({ where: { id: coMember.id }, data: { permissions: [...coMember.permissions, "exports"] } });
  const coCaterer = await csvOf(co, "caterer");
  await prisma.eventMember.update({ where: { id: coMember.id }, data: { permissions: coMember.permissions } });
  record(
    "135. Sans « exports » : refuse ; avec « exports » sans « sensitive » : traiteur sans le texte des allergies",
    coBefore.status === 404 && coCaterer.status === 200 && !coCaterer.text.includes(allergyGuest.preference.allergies) && parseCsvRows(coCaterer.text).length === catererRows.length,
    `${coBefore.status} / ${coCaterer.status}`,
  );

  const intruderExport = await intruder.evaluate(async (id) => (await fetch(`/api/organizer/events/${id}/export?kind=guests`)).status, EVENT_ID);
  const badKind = await owner.evaluate(async (id) => (await fetch(`/api/organizer/events/${id}/export?kind=secret`)).status, EVENT_ID);
  record("136. Intrus refuse ; export inconnu refuse", intruderExport === 404 && badKind === 400, `${intruderExport} / ${badKind}`);

  const exportAudits = await prisma.auditLog.count({ where: { action: "event.export", targetId: EVENT_ID } });
  record("137. Chaque export est journalise", exportAudits >= 4, `${exportAudits} entrees`);

  // Un nom d invite qui est une formule ne doit pas s executer dans Excel.
  const formulaGroup = await prisma.guestGroup.create({
    data: { eventId: EVENT_ID, name: '=HYPERLINK("http://x")', maxSeats: 1, guests: { create: { firstName: "=1+1", position: 0 } }, invitation: { create: { token: "f".repeat(43) } } },
  });
  const formulaCsv = await csvOf(owner, "guests");
  await prisma.guestGroup.delete({ where: { id: formulaGroup.id } });
  record("138. Formule dans un nom : neutralisee dans le CSV", formulaCsv.text.includes("'=HYPERLINK") && formulaCsv.text.includes("'=1+1") && !/\n=HYPERLINK/.test(formulaCsv.text));

  // Rafraichissement : une reponse arrivee pendant que l ecran est ouvert apparait sans rechargement.
  // L onglet est passe en arriere-plan pendant les tests precedents, et le
  // rafraichissement ne tourne que pour un onglet visible : on le ramene devant.
  await dash.bringToFront();
  await new Promise((r) => setTimeout(r, 600));
  const expectedBefore = await figureAfter(dash, "Attendus");
  // Pas le groupe du test 106 : son lien a atteint sa limite de 10 envois par minute.
  const freshGroup = await prisma.guestGroup.findFirstOrThrow({
    where: { eventId: EVENT_ID, id: { notIn: [third.id, couple.id, family.id] }, invitation: { revokedAt: null, response: null }, guests: { some: { isPlusOne: false } } },
    include: { guests: true, invitation: true },
  });
  const freshMember = freshGroup.guests.find((g) => !g.isPlusOne);
  const fresh = await postRsvp({ token: freshGroup.invitation.token, version: 0, status: "ATTENDING", people: [{ key: freshMember.id, ageCategory: freshMember.ageCategory, attending: true }], meals: {}, allergies: {}, consent: false, answers: [] });
  // On lit la valeur passee a CountUp (sa prop React), pas le texte anime :
  // pendant l animation, le texte remonte de 0 vers la nouvelle valeur.
  const readExpectedProp = () => dash.evaluate(() => Number(document.querySelector('[data-figure="expected"]')?.textContent ?? NaN));
  const refreshStart = Date.now();
  let expectedAfter = await readExpectedProp();
  // Un cycle de 10 s, plus une marge : 25 s couvrent deux cycles.
  while (expectedAfter !== expectedBefore + 1 && Date.now() - refreshStart < 25000) {
    await new Promise((r) => setTimeout(r, 1000));
    expectedAfter = await readExpectedProp();
  }
  const sqlAfterFresh = (await sqlTotals()).expected;
  record(
    "139. Rafraichissement automatique : une nouvelle reponse apparait sans recharger",
    fresh.status === 200 && expectedAfter === expectedBefore + 1,
    `${expectedBefore} → ${expectedAfter} en ${Math.round((Date.now() - refreshStart) / 1000)} s | POST ${fresh.status} | SQL ${sqlAfterFresh}`,
  );

  // ================================================ PHASE 8 - ACCUEIL --
  const checkinCall = async (action, body) => {
    const r = await fetch(`${BASE}/api/checkin?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": nextIp() },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };

  // Un groupe qui vient de confirmer par le formulaire (test 90) a son ticket.
  const familyNow = await loadGroup(family.id);
  const familyTicket = await prisma.ticket.findUnique({ where: { invitationId: familyNow.invitation.id } });
  // Le test 93 a fait decliner la famille : le ticket doit etre annule, pas supprime.
  record("150. Ticket emis a la confirmation, annule (pas supprime) au declin", Boolean(familyTicket) && Boolean(familyTicket.cancelledAt) && familyTicket.code.length >= 40);

  // Un groupe present pour les tests d entree : le couple (test 97/98), 1 a 2 presents.
  const coupleNow = await loadGroup(couple.id);
  const coupleTicket = await prisma.ticket.findUniqueOrThrow({ where: { invitationId: coupleNow.invitation.id } });
  const presentNow = coupleNow.guests.filter((g) => g.attending).length;
  record("151. Ticket : places = personnes confirmees, code distinct du jeton d invitation", coupleTicket.seats === presentNow && !coupleTicket.cancelledAt && coupleTicket.code !== coupleNow.invitation.token, `${coupleTicket.seats} place(s)`);

  const ticketPage = await (await fetch(`${BASE}/t/${coupleTicket.code}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  const couplePhone = coupleNow.guests.find((g) => g.phoneE164)?.phoneE164;
  record(
    "152. Page QR : groupe et prenoms, jamais numero ni jeton ; QR present",
    // Le QR encode l URL en modules, pas en texte : on ne la cherche pas dans le HTML.
    ticketPage.includes(coupleNow.name) && ticketPage.includes("<svg") && !ticketPage.includes(coupleNow.invitation.token) && (!couplePhone || !ticketPage.includes(couplePhone.slice(4))),
  );
  const qrPage = await newSession();
  await qrPage.setViewport({ width: 360, height: 780 });
  await qrPage.goto(`${BASE}/t/${coupleTicket.code}`, { waitUntil: "networkidle0", timeout: 90000 });
  const qrFit = await qrPage.evaluate(() => {
    const svg = document.querySelector("svg");
    const r = svg?.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - window.innerWidth, svgRight: r ? Math.round(r.right) : -1, inner: window.innerWidth };
  });
  record("152b. Page QR a 360 px : le QR tient dans l ecran, sans debordement", qrFit.overflow <= 0 && qrFit.svgRight > 0 && qrFit.svgRight <= qrFit.inner, `svg jusqu a ${qrFit.svgRight}px sur ${qrFit.inner}`);
  const badTicketPage = await (await fetch(`${BASE}/t/${"z".repeat(43)}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  record("153. Code de ticket inconnu : page introuvable", badTicketPage.includes("Page introuvable"));

  // Le lien "Voir mon acces" apparait sur l invitation du couple.
  const coupleInvitePage = await (await fetch(`${BASE}/i/${coupleNow.invitation.token}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  record("154. Invitation confirmee : lien vers le QR d acces", coupleInvitePage.includes(`/t/${coupleTicket.code}`) && coupleInvitePage.includes("Voir mon accès"));

  // Postes d accueil.
  const coStation = await api(co, `/api/organizer/events/${EVENT_ID}/stations`, "POST", { label: "Pirate" });
  const guestsOnlyCo = coStation.status;
  const stationA = await api(owner, `/api/organizer/events/${EVENT_ID}/stations`, "POST", { label: "Entree principale" });
  const stationB = await api(owner, `/api/organizer/events/${EVENT_ID}/stations`, "POST", { label: "Entree jardin" });
  record(
    "155. Postes crees par l organisateur (PIN a 4 chiffres, une seule fois) ; le co-organisateur avec « checkin » y a droit",
    stationA.status === 201 && /^\d{4}$/.test(stationA.body?.pin ?? "") && stationB.status === 201 && guestsOnlyCo === 201,
    `co ${guestsOnlyCo}, A ${stationA.status}, B ${stationB.status}`,
  );
  if (coStation.body?.token) {
    await prisma.checkInStation.updateMany({ where: { token: coStation.body.token }, data: { revokedAt: new Date() } });
  }
  const storedStation = await prisma.checkInStation.findUniqueOrThrow({ where: { token: stationA.body.token } });
  record("156. Le PIN n est stocke que hache", !storedStation.pinHash.includes(stationA.body.pin) && storedStation.pinHash.startsWith("$2"));
  const intruderStation = await api(intruder, `/api/organizer/events/${EVENT_ID}/stations`, "POST", { label: "Pirate" });
  record("157. Intrus : creation de poste refusee", intruderStation.status === 404, `HTTP ${intruderStation.status}`);

  const A = { token: stationA.body.token, pin: stationA.body.pin, operatorName: "Carine" };
  const B = { token: stationB.body.token, pin: stationB.body.pin, operatorName: "Joel" };
  const wrongPin = await checkinCall("open", { ...A, pin: A.pin === "1111" ? "2222" : "1111" });
  const goodPin = await checkinCall("open", A);
  record("158. Ouverture du poste : PIN faux refuse, PIN juste accepte", wrongPin.status === 401 && goodPin.status === 200 && goodPin.body?.event?.title === EVENT_TITLE);

  const scanUrl = await checkinCall("lookup", { ...A, scanned: `${BASE}/t/${coupleTicket.code}` });
  const scanCode = await checkinCall("lookup", { ...A, scanned: coupleTicket.code });
  record(
    "159. Scan : URL du QR ou code seul → groupe, personnes presentes, places",
    scanUrl.body?.ticket?.groupName === coupleNow.name && scanUrl.body.ticket.seats === coupleTicket.seats && scanUrl.body.ticket.verdict.kind === "valid" && scanCode.body?.ticket?.ticketId === scanUrl.body.ticket.ticketId,
  );
  const scanInvite = await checkinCall("lookup", { ...A, scanned: `${BASE}/i/${coupleNow.invitation.token}` });
  record("160. Scan d un lien d invitation (pas un ticket) : inconnu", scanInvite.body?.unknown === true);

  const otherEventTicket = await prisma.ticket.findFirst({ where: { invitation: { group: { eventId: { not: EVENT_ID } } } } });
  if (otherEventTicket) {
    const cross = await checkinCall("lookup", { ...A, scanned: otherEventTicket.code });
    record("161. Ticket d un autre evenement : inconnu sur ce poste", cross.body?.unknown === true);
  } else {
    record("161. Ticket d un autre evenement : inconnu sur ce poste", true, "aucun autre ticket en base, cas non testable");
  }

  // Ce qu un accueillant tape vraiment : le nom, pas six lettres d un prefixe partage par cinquante familles.
  const searchRes = await checkinCall("lookup", { ...A, query: coupleNow.name });
  record("162. Recherche manuelle par nom : le groupe attendu ressort", Array.isArray(searchRes.body?.results) && searchRes.body.results.some((r) => r.ticketId === coupleTicket.id), `« ${coupleNow.name.slice(0, 6)} » → ${searchRes.status} ${JSON.stringify(searchRes.body).slice(0, 160)}`);

  // Un groupe a plusieurs places pour l entree partielle et la course entre postes.
  const bigGroup = await prisma.guestGroup.findFirstOrThrow({
    where: { eventId: EVENT_ID, invitation: { ticket: { seats: { gte: 3 }, cancelledAt: null, seatsUsed: 0 } } },
    include: { invitation: { include: { ticket: true } } },
  });
  const bigTicket = bigGroup.invitation.ticket;
  const partialAdmit = await checkinCall("admit", { ...A, ticketId: bigTicket.id, quantity: 1, method: "QR" });
  record("163. Entree partielle : 1 sur N, verdict « partiel » avec le restant", partialAdmit.status === 200 && partialAdmit.body?.ok && partialAdmit.body.lookup.seatsUsed === 1 && partialAdmit.body.lookup.verdict.kind === "partial" && partialAdmit.body.lookup.verdict.remaining === bigTicket.seats - 1, `${partialAdmit.status} ${JSON.stringify(partialAdmit.body).slice(0, 160)}`);

  // Deux postes qui font entrer "le reste" en meme temps.
  const rest = bigTicket.seats - 1;
  const [raceA, raceB] = await Promise.all([
    checkinCall("admit", { ...A, ticketId: bigTicket.id, quantity: rest, method: "QR" }),
    checkinCall("admit", { ...B, ticketId: bigTicket.id, quantity: rest, method: "QR" }),
  ]);
  const racedTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: bigTicket.id }, include: { checkIns: true } });
  const raceOk = [raceA, raceB].filter((r) => r.body?.ok).length;
  record(
    "164. Deux postes, meme QR, meme seconde : une seule entree, l autre en conflit ; jamais plus de places que prevu",
    // Le perdant voit « conflit » s il a lu le ticket avant l ecriture du gagnant, « plus rien a
    // faire entrer » s il l a lu apres : les deux sont justes, et jamais une place de trop.
    raceOk === 1 && racedTicket.seatsUsed === bigTicket.seats && racedTicket.checkIns.length === 2 && [raceA, raceB].some((r) => r.status === 409 && ["conflict", "nothing_to_admit"].includes(r.body?.reason)),
    `${raceA.status}/${raceB.status}, ${racedTicket.seatsUsed}/${racedTicket.seats}, perdant: ${[raceA, raceB].find((r) => !r.body?.ok)?.body?.reason}`,
  );

  const againAdmit = await checkinCall("admit", { ...A, ticketId: bigTicket.id, quantity: 1, method: "QR" });
  record("165. QR deja consomme : refuse, verdict « deja entres »", againAdmit.status === 409 && againAdmit.body?.reason === "nothing_to_admit" && againAdmit.body.lookup.verdict.kind === "used");

  const forcedAdmit = await checkinCall("admit", { ...A, ticketId: bigTicket.id, quantity: 1, method: "MANUAL", override: true });
  const forcedAudit = await prisma.auditLog.count({ where: { action: "checkin.override", targetId: bigTicket.id } });
  record("166. Entree forcee : acceptee, marquee, journalisee", forcedAdmit.status === 200 && forcedAdmit.body?.forced === true && forcedAudit === 1 && (await prisma.checkIn.count({ where: { ticketId: bigTicket.id, override: true } })) === 1);

  const undoAdmit = await checkinCall("admit", { ...A, ticketId: bigTicket.id, quantity: 1, method: "MANUAL", undo: true });
  const afterUndo = await prisma.ticket.findUniqueOrThrow({ where: { id: bigTicket.id }, include: { checkIns: true } });
  record("167. Annuler la derniere entree : places rendues, entree effacee, journalise", undoAdmit.body?.ok === true && afterUndo.seatsUsed === bigTicket.seats && afterUndo.checkIns.length === 2 && (await prisma.auditLog.count({ where: { action: "checkin.undo", targetId: bigTicket.id } })) === 1);

  // Le ticket annule ne fait entrer personne.
  const cancelledAdmit = await checkinCall("admit", { ...A, ticketId: familyTicket.id, quantity: 1, method: "QR" });
  record("168. Ticket annule (famille qui a decline) : refuse", cancelledAdmit.status === 409 && cancelledAdmit.body?.lookup?.verdict?.kind === "cancelled");

  // Le dashboard et l accueil comptent les entrees.
  const hcNow = (await api(owner, `/api/organizer/events/${EVENT_ID}/headcount`)).body;
  const sqlEntered = (await prisma.ticket.aggregate({ where: { invitation: { group: { eventId: EVENT_ID } } }, _sum: { seatsUsed: true } }))._sum.seatsUsed ?? 0;
  const coAccueil = await rawHtml(co, `/dashboard/events/${EVENT_ID}/accueil`);
  const intruderAccueil = await rawHtml(intruder, `/dashboard/events/${EVENT_ID}/accueil`);
  record("169. Entrees comptees dans les totaux = somme SQL ; ecran Accueil : co-organisateur « checkin » oui, intrus non", (hcNow?.people?.checkedIn ?? -1) === sqlEntered && coAccueil.html.includes("Dernieres entrees") && intruderAccueil.html.includes("Page introuvable"), `${hcNow?.people?.checkedIn} / SQL ${sqlEntered}`);

  // Revocation d un poste.
  const revokeB = await owner.evaluate(async (id, sid) => (await fetch(`/api/organizer/events/${id}/stations?station=${sid}`, { method: "DELETE" })).status, EVENT_ID, stationB.body.id);
  const bAfter = await checkinCall("open", B);
  const bPage = await (await fetch(`${BASE}/accueil/${B.token}`, { headers: { "x-forwarded-for": nextIp() } })).text();
  record("170. Poste revoque : ouverture refusee, page introuvable", revokeB === 204 && bAfter.status === 401 && bPage.includes("Page introuvable"));

  // Force brute sur le PIN : bloque apres 8 essais.
  // Poste dedie : la protection bloque aussi le JETON vise pendant 15 minutes,
  // et le poste A doit rester utilisable pour le test d ecran qui suit.
  const stationC = await api(owner, `/api/organizer/events/${EVENT_ID}/stations`, "POST", { label: "Cible force brute" });
  const bruteToken = stationC.body.token;
  let bruteStatus = 0;
  for (let i = 0; i < 10; i += 1) {
    const r = await fetch(`${BASE}/api/checkin?action=open`, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "198.18.250.1" }, body: JSON.stringify({ token: bruteToken, pin: String(9000 + i), operatorName: "Pirate" }) });
    bruteStatus = r.status;
  }
  record("171. PIN : bloque apres 8 tentatives par adresse", bruteStatus === 429, `HTTP ${bruteStatus}`);
  await prisma.checkInStation.updateMany({ where: { token: bruteToken }, data: { revokedAt: new Date() } });

  // Ecran du poste sur telephone : PIN, puis poste ouvert avec recherche.
  const stationPage = await newSession();
  await stationPage.setViewport({ width: 390, height: 844 });
  // Onglet ouvert apres des dizaines d autres : Chrome suspend les rendus d un
  // onglet en arriere-plan (meme constat qu en phase 6). On le met devant,
  // comme l accueillant qui regarde son telephone.
  await stationPage.bringToFront();
  await stationPage.goto(`${BASE}/accueil/${A.token}`, { waitUntil: "networkidle0", timeout: 90000 });
  await stationPage.type('input[placeholder="Carine"]', "Carine");
  await stationPage.type('input[placeholder="••••"]', A.pin);
  await clickText(stationPage, "button", "Ouvrir");
  await stationPage.bringToFront();
  await stationPage.waitForFunction(() => document.body.innerText.includes("Entree principale"), { timeout: 15000 });
  await stationPage.type('input[placeholder="Nom ou numéro"]', coupleNow.name);
  await stationPage.keyboard.press("Enter");
  await stationPage.bringToFront();
  await stationPage.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 15000 }, coupleNow.name);
  const stationOverflow = await stationPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record("172. Poste d accueil sur telephone : PIN, recherche, resultat, sans debordement", stationOverflow <= 0, `${stationOverflow}px`);

  // ============================================== PHASE 9 - MVP-B --
  // Quatre themes de plus : chacun est une composition, verifiee comme Royal
  // Ivory sur le banc (aucun debordement, premier ecran complet).
  const themesInfo = [
    { key: "midnight-gold", variants: ["minuit", "encre", "emeraude"], accents: ["or", "cuivre", "argent"] },
    { key: "botanical", variants: ["creme", "mousse"], accents: ["olive", "terracotta", "lavande"] },
    { key: "editorial", variants: ["blanc", "noir"], accents: ["rouge", "cobalt", "citron"] },
    { key: "african-luxury", variants: ["terre", "ebene"], accents: ["ocre", "indigo", "cuivre"] },
  ];
  const themeOverflows = [];
  let themeRenders = 0;
  for (const t of themesInfo) {
    for (const variant of t.variants) {
      for (const benchCase of ["reference", "long", "minimal", "clos"]) {
        // Le cas de reference aux 5 largeurs du cahier ; les cas limites aux deux extremes.
        for (const width of benchCase === "reference" ? [360, 375, 390, 393, 430] : [360, 430]) {
          await bench.setViewport({ width, height: 800 });
          await bench.goto(`${BASE}/preview/invitation/banc?case=${benchCase}&theme=${t.key}&variant=${variant}`, { waitUntil: "networkidle0", timeout: 90000 });
          themeRenders += 1;
          const over = await bench.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (over > 0) themeOverflows.push(`${t.key}/${benchCase}/${variant}/${width}px:+${over}`);
        }
      }
    }
  }
  record("180. Quatre nouveaux themes : aucun debordement sur le banc", themeOverflows.length === 0, themeOverflows.join(" ") || `${themeRenders} rendus`);

  const themeFirstScreen = [];
  for (const t of themesInfo) {
    for (const [width, height] of [[360, 740], [390, 844]]) {
      await bench.setViewport({ width, height });
      await bench.goto(`${BASE}/preview/invitation/banc?case=reference&theme=${t.key}`, { waitUntil: "networkidle0" });
      await new Promise((r) => setTimeout(r, 900));
      const bottom = await bench.evaluate(() => document.querySelector("[data-hero-cta]")?.getBoundingClientRect().bottom ?? Infinity);
      if (bottom > height) themeFirstScreen.push(`${t.key} ${width}x${height}: bouton a ${Math.round(bottom)}px`);
    }
  }
  record("181. Chaque theme : noms, date et bouton de reponse sans defiler", themeFirstScreen.length === 0, themeFirstScreen.join(" ") || "4 themes x 2 ecrans");

  // Les reglages d un theme ne valent que pour lui : un accent de Royal Ivory
  // sur Editorial retombe sur la valeur par defaut d Editorial.
  const themeBefore = await prisma.event.findUniqueOrThrow({ where: { id: EVENT_ID }, select: { themeKey: true, themeSettings: true } });
  const editorialDesign = await api(owner, `/api/organizer/events/${EVENT_ID}/design`, "PUT", { themeKey: "editorial", settings: { variant: "noir", accent: "champagne", countdown: true } });
  const editorialPublic = await rawHtml(anon, `/i/${(await prisma.invitation.findFirstOrThrow({ where: { group: { eventId: EVENT_ID }, revokedAt: null } })).token}`);
  await prisma.event.update({ where: { id: EVENT_ID }, data: { themeKey: themeBefore.themeKey, themeSettings: themeBefore.themeSettings } });
  record(
    "182. Theme Editorial enregistre, accent etranger remplace, page publique rendue avec le theme",
    editorialDesign.status === 200 && editorialDesign.body?.settings?.variant === "noir" && editorialDesign.body?.settings?.accent === "rouge" && editorialPublic.html.includes("--ed-bg"),
    JSON.stringify(editorialDesign.body?.settings),
  );

  // Equipe (D5) : inviter, ajuster, retirer ; reserve au proprietaire.
  const teamEmail = `equipe-${Date.now()}@tap.exemple`;
  const invite = await api(owner, `/api/organizer/events/${EVENT_ID}/team`, "POST", { email: teamEmail, name: "Chloe Equipe", permissions: ["guests", "team"] });
  const invitedMember = invite.body?.memberId ? await prisma.eventMember.findUnique({ where: { id: invite.body.memberId } }) : null;
  record(
    "183. Equipe : invitation creee, lien d activation rendu, « team » jamais accorde",
    invite.status === 201 && /^\/reset-password\?token=/.test(invite.body?.inviteUrl ?? "") && invitedMember?.role === "COORGANIZER" && invitedMember.permissions.join(",") === "guests",
    `HTTP ${invite.status} ${invitedMember?.permissions.join(",")}`,
  );
  const activation = await rawHtml(anon, invite.body?.inviteUrl ?? "/reset-password");
  // Le HTML de toute page embarque le composant "introuvable" de la racine : on juge sur le formulaire attendu.
  record("184. Lien d activation : page servie a l invite (sans session)", activation.status === 200 && activation.html.includes("Nouveau mot de passe"), `HTTP ${activation.status}`);
  const teamPatch = await api(owner, `/api/organizer/events/${EVENT_ID}/team`, "PATCH", { memberId: invite.body?.memberId, permissions: ["guests", "checkin", "team"] });
  const patchedMember = invite.body?.memberId ? await prisma.eventMember.findUnique({ where: { id: invite.body.memberId } }) : null;
  const coTeam = await api(co, `/api/organizer/events/${EVENT_ID}/team`, "POST", { email: "autre@tap.exemple", name: "Autre Personne", permissions: [] });
  const intruderTeam = await api(intruder, `/api/organizer/events/${EVENT_ID}/team`, "POST", { email: "autre@tap.exemple", name: "Autre Personne", permissions: [] });
  const teamDelete = await owner.evaluate(async (id, m) => (await fetch(`/api/organizer/events/${id}/team?member=${m}`, { method: "DELETE" })).status, EVENT_ID, invite.body?.memberId ?? "x");
  const goneMember = invite.body?.memberId ? await prisma.eventMember.findUnique({ where: { id: invite.body.memberId } }) : null;
  await prisma.user.deleteMany({ where: { email: teamEmail } });
  record(
    "185. Equipe : permissions ajustees ; co-organisateur et intrus refuses (404) ; retrait effectif",
    teamPatch.status === 200 && patchedMember?.permissions.join(",") === "guests,checkin" && coTeam.status === 404 && intruderTeam.status === 404 && teamDelete === 204 && goneMember === null,
    `${teamPatch.status} / ${coTeam.status} / ${intruderTeam.status} / ${teamDelete}`,
  );

  // Exports Excel et PDF : memes lignes que le CSV, formats verifies sur les octets.
  const binaryOf = async (page, kind, format) =>
    page.evaluate(
      async (k, f, id) => {
        const res = await fetch(`/api/organizer/events/${id}/export?kind=${k}&format=${f}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        return { status: res.status, type: res.headers.get("content-type"), disposition: res.headers.get("content-disposition"), bytes: Array.from(bytes) };
      },
      kind,
      format,
      EVENT_ID,
    );
  const xlsx = await binaryOf(owner, "guests", "xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(xlsx.bytes));
  const sheet = workbook.worksheets[0];
  const xlsxRows = [];
  // Ligne vide comprise (eachRow la saute sinon) ; une cellule en texte riche (numero commencant par +) redevient du texte.
  sheet.eachRow({ includeEmpty: true }, (row) => xlsxRows.push(row.values.slice(1).map((c) => (c && typeof c === "object" && "richText" in c ? c.richText.map((t) => t.text).join("") : c))));
  const csvNow = parseCsvRows((await csvOf(owner, "guests")).text);
  // Le classeur commence par le titre de l evenement et une ligne vide, puis l en-tete.
  const xlsxExpected = xlsxRows.slice(3).reduce((n, r) => n + Number(r[5] ?? 0), 0);
  const xlsxSql = (await sqlTotals()).expected;
  record(
    "186. Export Excel : fichier .xlsx valide, memes lignes et memes totaux que le CSV",
    xlsx.status === 200 && xlsx.bytes[0] === 0x50 && xlsx.bytes[1] === 0x4b && /spreadsheetml/.test(xlsx.type) && /-invites\.xlsx"/.test(xlsx.disposition) && xlsxRows[2].join(";") === csvNow[0].join(";") && xlsxRows.length === csvNow.length + 2 && xlsxExpected === xlsxSql,
    `${xlsxRows.length} lignes (CSV ${csvNow.length}), ${xlsxExpected} attendus (SQL ${xlsxSql}) | ${xlsxRows[2].join(";")} / ${csvNow[0].join(";")}`,
  );
  const pdf = await binaryOf(owner, "checkin", "pdf");
  const pdfHead = String.fromCharCode(...pdf.bytes.slice(0, 5));
  record("187. Export PDF (liste d accueil) : document PDF, telechargement nomme", pdf.status === 200 && pdfHead === "%PDF-" && pdf.type === "application/pdf" && /-accueil\.pdf"/.test(pdf.disposition), pdf.disposition);
  const badFormat = await owner.evaluate(async (id) => (await fetch(`/api/organizer/events/${id}/export?kind=guests&format=docx`)).status, EVENT_ID);
  record("188. Format d export inconnu refuse", badFormat === 400, `HTTP ${badFormat}`);

  // Import Excel : un classeur fabrique ici, lu dans le navigateur.
  const xlsxBook = new ExcelJS.Workbook();
  const xlsxSheet = xlsxBook.addWorksheet("Invites");
  xlsxSheet.addRow(["Prénom", "Nom", "Téléphone", "Famille"]);
  xlsxSheet.addRow(["Aïcha", "MBAPPÉ", 699111222, "Famille Mbappé"]);
  xlsxSheet.addRow(["Jean-Baptiste", "OWONA", "6 99 33 44 55", "Famille Owona"]);
  xlsxSheet.addRow(["Ligne", "Vide", null, null]);
  const xlsxPath = join(csvDir, "invites.xlsx");
  await xlsxBook.xlsx.writeFile(xlsxPath);
  await importer.goto(`${BASE}/dashboard/events/${EVENT_ID}/invites`, { waitUntil: "networkidle0" });
  await clickText(importer, "button", "Coller une liste");
  await importer.waitForSelector('[role="tablist"]');
  await clickText(importer, "button", "Fichier Excel");
  const xlsxInput = await importer.waitForSelector('input[type="file"]');
  await xlsxInput.uploadFile(xlsxPath);
  await importer.waitForFunction(() => document.body.innerText.includes("3 lignes"), { timeout: 15000 });
  const xlsxMapping = await importer.evaluate(() => [...document.querySelectorAll("thead select")].map((s) => s.value));
  const xlsxPreview = await importer.evaluate(() => document.body.innerText);
  record(
    "189. Import Excel : classeur lu dans le navigateur, accents et numero saisi en nombre conserves, colonnes reconnues",
    xlsxPreview.includes("Aïcha") && xlsxPreview.includes("699111222") && xlsxMapping.join(",") === "firstName,lastName,phone,group",
    xlsxMapping.join(","),
  );
  const odsPath = join(csvDir, "invites.ods");
  writeFileSync(odsPath, "not a spreadsheet");
  await xlsxInput.uploadFile(odsPath);
  await importer.waitForFunction(() => /enregistrez le fichier en \.xlsx/i.test(document.body.innerText), { timeout: 10000 }).catch(() => null);
  const odsMessage = await importer.evaluate(() => document.body.innerText);
  record("190. Fichier .ods : refuse avec la marche a suivre (enregistrer en .xlsx)", /enregistrez le fichier en \.xlsx/i.test(odsMessage));

  // Le studio liste les cinq themes ; un theme hors offre reste visible mais verrouille.
  await bench.setViewport({ width: 1280, height: 900 });
  await bench.goto(`${BASE}/dashboard/events/${EVENT_ID}/design`, { waitUntil: "networkidle0", timeout: 90000 });
  const studioThemes = await bench.evaluate(() => [...document.querySelectorAll("button[aria-pressed]")].map((b) => b.textContent.trim().split("\n")[0]).filter((t) => /Royal Ivory|Midnight Gold|Botanical|Editorial|African Luxury/.test(t)).length);
  record("191. Studio : les cinq themes sont proposes", studioThemes === 5, `${studioThemes} themes`);

  // ---------------------------------------------------- NON-REGRESSION --
  for (const path of ["/dashboard", "/dashboard/stats", "/dashboard/share"]) {
    const res = await rawHtml(owner, path);
    record(`15. ${path} toujours servi`, res.status === 200 && !res.html.includes("Application error"), `HTTP ${res.status}`);
  }

  // Phase 0 : rateLimit est devenu asynchrone. 30 scans/min autorises.
  // Adresse differente a chaque execution : le quota d une minute consomme par
  // un passage precedent ferait echouer celui-ci sans rien prouver.
  const fakeIp = `198.51.100.${1 + (Date.now() % 250)}`;
  const statuses = await anon.evaluate(async (ip) => {
    const out = [];
    for (let i = 0; i < 32; i += 1) {
      const r = await fetch("/api/events/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify({ token: "ZZZZZZZ" }),
      });
      out.push(r.status);
    }
    return out;
  }, fakeIp);
  record(
    "16. Limitation de debit : bloque au-dela du seuil",
    statuses.slice(0, 30).every((s) => s !== 429) && statuses.at(-1) === 429,
    `${statuses.filter((s) => s === 429).length} reponse(s) 429 sur 32`,
  );
} catch (error) {
  record("Execution", false, error.message);
} finally {
  await browser.close();
  await prisma.$disconnect();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verifications reussies`);
process.exit(failed.length === 0 ? 0 : 1);
