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
