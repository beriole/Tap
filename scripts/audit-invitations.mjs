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
  record("73. Apercu de partage : les hotes, jamais le nom de l invite", ogTitle.includes("vous invitent") && !ogTitle.includes(expectedSalutation) && (!guestFirstName || !ogTitle.includes(guestFirstName)), ogTitle);
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
  const { PredefinedNetworkConditions } = await import("puppeteer-core");
  const perf = await newSession();
  await perf.setViewport({ width: 390, height: 844 });
  await perf.emulateNetworkConditions(PredefinedNetworkConditions["Slow 4G"]);
  await perf.emulateCPUThrottling(4);
  await perf.evaluateOnNewDocument(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await perf.goto(`${BASE}${openUrl}`, { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  const vitals = await perf.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Number(window.__cls.toFixed(3)) }));
  record("83. 4G lente : LCP < 2,5 s et CLS < 0,05", vitals.lcp < 2500 && vitals.cls < 0.05, `LCP ${vitals.lcp} ms, CLS ${vitals.cls}`);

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
