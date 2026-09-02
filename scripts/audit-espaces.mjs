/**
 * Verification des deux espaces - administrateur et client.
 *
 * On n accepte pas un HTTP 200 comme preuve : chaque ecran doit AFFICHER ce
 * qu il annonce. Une page qui repond 200 en rendant un cadre vide est un echec
 * du point de vue de la personne qui l utilise.
 *
 * Les comparaisons de texte sont insensibles a la casse : plusieurs en-tetes
 * sont mis en capitales par la CSS, et innerText renvoie le texte transforme.
 *
 * Usage :
 *   node scripts/audit-espaces.mjs <admin@…> <motdepasse> <client@…> <motdepasse>
 *
 * Lecture seule : ce script ne cree ni ne modifie aucune donnee. Il peut donc
 * etre lance contre une production en service, contrairement a audit-parcours.
 */
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [, , ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_EMAIL, CLIENT_PASSWORD] = process.argv;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !CLIENT_EMAIL || !CLIENT_PASSWORD) {
  console.error("Usage : node scripts/audit-espaces.mjs <admin> <mdp> <client> <mdp>");
  process.exit(2);
}

let pass = 0, fail = 0;
const ok = (n, v, d = "") => { v ? pass++ : fail++; console.log(`${v ? "  OK  " : " ECHEC"} ${n}${d ? ` — ${d}` : ""}`); };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });

async function signIn(email, password) {
  const page = await (await browser.createBrowserContext()).newPage();
  page.setDefaultNavigationTimeout(180000);
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Deux redirections s enchainent (/post-login puis la destination).
  await new Promise((r) => setTimeout(r, 7000));
  return page;
}

async function screen(page, path, must) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  ok(`${path} repond`, res.status() === 200, `HTTP ${res.status()}`);
  for (const m of must) ok(`${path} affiche "${m}"`, text.includes(m.toLowerCase()));
}

console.log("--- Espace administrateur ---");
const admin = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
ok("Un administrateur arrive dans le back-office", new URL(admin.url()).pathname.startsWith("/admin"), new URL(admin.url()).pathname);
await screen(admin, "/admin", ["Dashboard", "Clients", "Cartes actives", "Scans"]);
await screen(admin, "/admin/cards", ["Cartes NFC", "URL a encoder", "SEEDA23", "Creer un lot", "Generer"]);
await screen(admin, "/admin/clients", [CLIENT_EMAIL, ADMIN_EMAIL]);
await screen(admin, "/admin/analytics", ["Analytics"]);
await screen(admin, "/admin/themes", ["Themes", "Executive", "Signal"]);
await screen(admin, "/admin/settings", ["Parametres", "Domaine canonique", "Journal d audit"]);

console.log("\n--- Espace client ---");
const client = await signIn(CLIENT_EMAIL, CLIENT_PASSWORD);
ok("Un client arrive dans l espace client", new URL(client.url()).pathname.startsWith("/dashboard"), new URL(client.url()).pathname);
await screen(client, "/dashboard", ["Awa"]);
{
  await client.goto(`${BASE}/dashboard/profile`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  // Les valeurs d un formulaire vivent dans input.value : innerText ne les voit
  // pas. Chercher le texte a l ecran ferait donc echouer un editeur pourtant
  // parfaitement rempli.
  const values = await client.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("input,textarea")].map((e) => [e.name, e.value]),
    ),
  );
  const filled = Object.entries(values).filter(([k, v]) => k && !k.startsWith("$") && v).length;
  ok("/dashboard/profile est prerempli", filled >= 20, `${filled} champs renseignes`);
  for (const [k, v] of [
    ["displayName", "Awa Ndiaye"],
    ["company", "Studio Meridien"],
    ["city", "Douala"],
  ]) {
    ok(`/dashboard/profile champ ${k}`, values[k] === v, values[k] ?? "vide");
  }
}
await screen(client, "/dashboard/links", ["WhatsApp", "LinkedIn", "Reserver un echange"]);
await screen(client, "/dashboard/theme", ["Executive"]);
await screen(client, "/dashboard/stats", ["Statistiques", "30 jours", "Clics par action", "Liens les plus utilises"]);
await screen(client, "/dashboard/preview", ["Awa"]);
await screen(client, "/dashboard/security", ["mot de passe"]);

console.log("\n--- Profils publics ---");
const pub = await (await browser.createBrowserContext()).newPage();
pub.setDefaultNavigationTimeout(180000);
for (const [token, name, links] of [["SEEDA23", "Awa Ndiaye", 11], ["SEEDM47", "Serge Mbala", 6]]) {
  const res = await pub.goto(`${BASE}/c/${token}`, { waitUntil: "networkidle0" });
  const info = await pub.evaluate(() => ({
    text: document.body.innerText,
    imgs: [...document.images].filter((i) => i.naturalWidth > 0).length,
    links: [...document.querySelectorAll("a[href]")].filter((a) => !a.getAttribute("href").startsWith("#")).length,
  }));
  ok(`/c/${token} repond`, res.status() === 200, `HTTP ${res.status()}`);
  ok(`/c/${token} affiche ${name}`, info.text.includes(name));
  ok(`/c/${token} charge ses images`, info.imgs >= 1, `${info.imgs} image(s) rendue(s)`);
  ok(`/c/${token} presente au moins ${links} liens`, info.links >= links, `${info.links} liens`);
}

console.log("\n--- Cloisonnement ---");
await client.goto(`${BASE}/admin`, { waitUntil: "networkidle0" });
ok("Un client ne peut pas entrer dans /admin", !new URL(client.url()).pathname.startsWith("/admin"), new URL(client.url()).pathname);
ok("Aucun lien vers l administration chez un client", (await client.$('a[href="/admin"]')) === null);
ok("Passerelle vers l espace client chez un administrateur", (await admin.$('a[href="/dashboard"]')) !== null);

console.log(`\n${pass}/${pass + fail} verifications reussies`);
await browser.close();
process.exit(fail ? 1 : 0);
