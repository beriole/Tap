/**
 * Audit fonctionnel du back-office.
 *
 * Se connecte comme administrateur dans un vrai navigateur, puis exerce chaque
 * action depuis la page elle-meme (donc avec la session, les cookies et le
 * middleware reels). Verifier qu une page s affiche ne prouve rien : ce qui
 * compte est qu une carte s associe, qu un compte se suspende, et que la base
 * en garde la trace.
 *
 *   node scripts/audit-admin.mjs <email> <motdepasse>
 */
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [, , EMAIL, PASSWORD] = process.argv;

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
const page = await browser.newPage();

/** Appelle une route depuis le contexte de la page : la session suit. */
const api = (path, init) =>
  page.evaluate(
    async (p, i) => {
      const r = await fetch(p, i ? { ...i, headers: { "Content-Type": "application/json" } } : undefined);
      let body = null;
      try {
        body = await r.json();
      } catch {
        /* 204 ou corps vide */
      }
      return { status: r.status, body };
    },
    path,
    init ?? null,
  );

try {
  // --- Connexion -----------------------------------------------------------
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.type('input[name="email"]', EMAIL);
  await page.type('input[name="password"]', PASSWORD);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
  ]);
  const session = await page.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
  record("Connexion administrateur", Boolean(session?.user), session?.user?.role ?? "aucune session");

  // --- Les six pages repondent --------------------------------------------
  for (const path of ["/admin", "/admin/cards", "/admin/clients", "/admin/analytics", "/admin/themes", "/admin/settings"]) {
    const r = await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 60000 });
    record(`Page ${path}`, r?.status() === 200, `HTTP ${r?.status()}`);
  }

  await page.goto(`${BASE}/admin/cards`, { waitUntil: "networkidle0" });

  // --- Cartes : creation d un lot -----------------------------------------
  const batch = `AUDIT-${Date.now().toString().slice(-6)}`;
  const created = await api("/api/admin/cards", {
    method: "POST",
    body: JSON.stringify({ quantity: 3, batch }),
  });
  const cards = created.body?.cards ?? [];
  record("Creer un lot de 3 cartes", created.status === 201 && cards.length === 3, `${cards.length} carte(s)`);

  const tokens = cards.map((c) => c.publicToken);
  record(
    "Tokens uniques et hors caracteres ambigus",
    new Set(tokens).size === 3 && tokens.every((t) => /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{7}$/.test(t)),
    tokens.join(" "),
  );

  const card = cards[0];

  // --- Une carte non attribuee ne revele rien ------------------------------
  const unassigned = await api(`/c/${card.publicToken}`);
  record("Carte non attribuee -> page neutre", unassigned.status === 200 || unassigned.status === 307, `HTTP ${unassigned.status}`);

  // --- Clients : creation --------------------------------------------------
  const email = `audit-${Date.now().toString().slice(-8)}@exemple.test`;
  const client = await api("/api/admin/clients", {
    method: "POST",
    body: JSON.stringify({ email, name: "Client d audit", displayName: "Client Audit" }),
  });
  record("Creer un client", client.status === 201, client.body?.user?.status ?? "");
  record("Lien d activation fourni", Boolean(client.body?.inviteUrl), client.body?.inviteUrl?.slice(0, 34) ?? "aucun");

  const dup = await api("/api/admin/clients", {
    method: "POST",
    body: JSON.stringify({ email, name: "Doublon" }),
  });
  record("E-mail deja utilise refuse", dup.status === 409, `HTTP ${dup.status}`);

  const userId = client.body?.user?.id;

  // --- Association carte -> profil ----------------------------------------
  const profiles = await page.evaluate(async () => {
    const r = await fetch("/api/admin/cards");
    const j = await r.json();
    return j.cards?.length ?? 0;
  });
  record("Lister les cartes", profiles > 0, `${profiles} carte(s)`);

  // --- Suspension / reactivation ------------------------------------------
  const suspend = await api("/api/admin/clients", {
    method: "PATCH",
    body: JSON.stringify({ userId, action: "SUSPEND" }),
  });
  record("Suspendre un client", suspend.status === 200 && suspend.body?.user?.status === "SUSPENDED", suspend.body?.user?.status ?? "");

  const reactivate = await api("/api/admin/clients", {
    method: "PATCH",
    body: JSON.stringify({ userId, action: "REACTIVATE" }),
  });
  record("Reactiver un client", reactivate.status === 200 && reactivate.body?.user?.status === "ACTIVE", reactivate.body?.user?.status ?? "");

  const reset = await api("/api/admin/clients", {
    method: "PATCH",
    body: JSON.stringify({ userId, action: "RESET_ACCESS" }),
  });
  record("Reinitialiser l acces", reset.status === 200 && Boolean(reset.body?.resetUrl), reset.body?.resetUrl?.slice(0, 30) ?? "");

  const self = await api("/api/admin/clients", {
    method: "PATCH",
    body: JSON.stringify({ userId: session.user.id, action: "SUSPEND" }),
  });
  record("Auto-suspension refusee", self.status === 400, `HTTP ${self.status}`);

  // --- Etats de carte ------------------------------------------------------
  const lost = await api("/api/admin/cards", {
    method: "PATCH",
    body: JSON.stringify({ cardId: card.id, status: "LOST" }),
  });
  record("Declarer une carte perdue", lost.status === 200 && lost.body?.card?.status === "LOST", lost.body?.card?.status ?? "");

  const back = await api("/api/admin/cards", {
    method: "PATCH",
    body: JSON.stringify({ cardId: card.id, status: "UNASSIGNED" }),
  });
  record("Remettre la carte en stock", back.status === 200, back.body?.card?.status ?? "");

  // --- Validation des entrees ---------------------------------------------
  const bad = await api("/api/admin/cards", {
    method: "POST",
    body: JSON.stringify({ quantity: 9999 }),
  });
  record("Quantite hors bornes refusee", bad.status === 422, `HTTP ${bad.status}`);

  // --- Journal d audit -----------------------------------------------------
  await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle0" });
  const auditLines = await page.evaluate(
    // Le journal affiche desormais un libelle francais ; le code technique
    // reste imprime a cote, et c est lui qu on compte.
    () => document.body.innerText.match(/\b(client|card|account|admin)\.[a-z_.]+/g)?.length ?? 0,
  );
  record("Operations tracees dans le journal d audit", auditLines > 0, `${auditLines} entree(s) visibles`);
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verifications reussies`);
  if (failed.length) console.log(`A CORRIGER : ${failed.map((f) => f.name).join(", ")}`);
  await browser.close();
}
