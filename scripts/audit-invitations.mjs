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

  // ---------------------------------------------------- NON-REGRESSION --
  for (const path of ["/dashboard", "/dashboard/stats", "/dashboard/share"]) {
    const res = await rawHtml(owner, path);
    record(`15. ${path} toujours servi`, res.status === 200 && !res.html.includes("Application error"), `HTTP ${res.status}`);
  }

  // Phase 0 : rateLimit est devenu asynchrone. 30 scans/min autorises.
  const statuses = await anon.evaluate(async () => {
    const out = [];
    for (let i = 0; i < 32; i += 1) {
      const r = await fetch("/api/events/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.77" },
        body: JSON.stringify({ token: "ZZZZZZZ" }),
      });
      out.push(r.status);
    }
    return out;
  });
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
