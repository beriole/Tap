/**
 * Audit des liens de partage restreints.
 *
 * Usage : node scripts/audit-partages.mjs
 * (BASE_URL et DEMO_PASSWORD sont lus dans l environnement.)
 *
 * ECRIT dans la base visee : il cree un lien de verification puis le supprime.
 * A ne pas lancer contre une production deja en service.
 *
 * Le lien restreint doit tenir sa promesse : ce qui n est pas coche ne doit
 * apparaitre NULLE PART - ni sur la page, ni dans la vCard.
 */
import puppeteer from "puppeteer-core";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (n, v, d = "") => { v ? pass++ : fail++; console.log(`${v ? "  OK  " : " ECHEC"} ${n}${d ? ` — ${d}` : ""}`); };

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const p = await b.newPage();
p.setDefaultNavigationTimeout(300000);
await p.setViewport({ width: 1440, height: 1200 });
await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await p.type('input[name="email"]', "demo@tap.exemple");
await p.type('input[name="password"]', process.env.DEMO_PASSWORD);
await p.click('button[type="submit"]');
// Le serveur de developpement compile a la demande : on attend la session
// plutot qu un delai fixe.
let session = null;
for (let i = 0; i < 20 && !session; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  session = await p.evaluate(() => fetch("/api/auth/session").then((r) => r.json()).then((s) => s?.user?.email ?? null).catch(() => null)).catch(() => null);
}
ok("Session client ouverte", Boolean(session), session ?? "aucune");

// --- Creation d un lien qui n expose QUE le nom, la photo et le telephone ---
const created = await p.evaluate(async () => {
  const links = await fetch("/api/profile").then((r) => r.json()).catch(() => null);
  const res = await fetch("/api/profile/share-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      label: "Ceremonie (verification)",
      fields: ["avatar", "phone"],
      linkIds: [],
      isActive: true,
    }),
  });
  return { status: res.status, body: await res.json().catch(() => null), links: Boolean(links) };
});
ok("Creation du lien restreint", created.status === 201, `HTTP ${created.status}`);
if (created.status !== 201) { console.log(JSON.stringify(created.body)); await b.close(); process.exit(1); }

const slug = created.body.share.slug;
ok("Jeton en minuscules, distinct d une carte", /^[a-z2-9]{10}$/.test(slug), slug);

// --- La page restreinte ------------------------------------------------------
const pub = await (await b.createBrowserContext()).newPage();
pub.setDefaultNavigationTimeout(300000);
const res = await pub.goto(`${BASE}/s/${slug}`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 4000));
const text = await pub.evaluate(() => document.body.innerText);
ok(`/s/${slug} repond`, res.status() === 200, `HTTP ${res.status()}`);
ok("Le nom est present", text.includes("Awa Ndiaye"));
ok("Le telephone coche est present", text.includes("237699112233") || text.includes("+237 699"));
ok("L e-mail NON coche est absent", !text.includes("awa@studio-meridien.com"));
ok("L entreprise NON cochee est absente", !text.includes("Studio Meridien"));
ok("La biographie NON cochee est absente", !text.includes("Douze ans aupres"));
ok("Aucun lien non coche", !text.includes("Reserver un echange") && !text.includes("LinkedIn"));

// --- La vCard doit respecter le meme masque ---------------------------------
const vcf = await pub.evaluate((s) => fetch(`/api/vcard/${s}`).then((r) => r.text()), slug);
ok("vCard servie", vcf.startsWith("BEGIN:VCARD"), vcf.slice(0, 24));
ok("vCard : le nom y est", vcf.includes("Awa Ndiaye"));
ok("vCard : le telephone coche y est", vcf.includes("237699112233"));
ok("vCard : l e-mail non coche est absent", !vcf.includes("awa@studio-meridien.com"));
ok("vCard : l entreprise non cochee est absente", !vcf.includes("Studio Meridien"));

// --- Le profil complet reste intact -----------------------------------------
await pub.goto(`${BASE}/c/SEEDA23`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 3000));
const full = await pub.evaluate(() => document.body.innerText);
ok("La carte complete montre toujours tout", full.includes("Studio Meridien") && full.includes("awa@studio-meridien.com"));

// --- Menage ------------------------------------------------------------------
const del = await p.evaluate((id) => fetch(`/api/profile/share-links?id=${id}`, { method: "DELETE" }).then((r) => r.status), created.body.share.id);
ok("Suppression du lien de verification", del === 204, `HTTP ${del}`);

console.log(`\n${pass}/${pass + fail} verifications reussies`);
await b.close();
process.exit(fail ? 1 : 0);
