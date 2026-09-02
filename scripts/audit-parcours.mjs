/**
 * Parcours commercial complet, de la carte vierge au contact enregistre.
 *
 * C est le scenario reel du cahier des charges (§4) : l administrateur cree une
 * carte, cree le client, associe les deux ; le client active son compte,
 * complete son profil et publie ; un visiteur scanne et enregistre le contact.
 *
 * Chaque etape est jouee dans un vrai navigateur, avec deux sessions
 * distinctes - l administrateur et le client ne partagent pas de cookies.
 */
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [, , ADMIN_EMAIL, ADMIN_PASSWORD] = process.argv;

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

const api = (page, path, init) =>
  page.evaluate(
    async (p, i) => {
      const r = await fetch(p, i ? { ...i, headers: { "Content-Type": "application/json" } } : undefined);
      let body = null;
      try {
        body = await r.json();
      } catch {
        /* corps vide */
      }
      return { status: r.status, body };
    },
    path,
    init ?? null,
  );

async function signIn(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
  ]);
  return page.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
}

try {
  const stamp = Date.now().toString().slice(-8);
  const clientEmail = `parcours-${stamp}@exemple.test`;
  const clientPassword = "Parcours!2026Ok";

  // ---------------------------------------------------------------- ADMIN --
  const admin = await newSession();
  const adminSession = await signIn(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  record("1. Administrateur connecte", Boolean(adminSession?.user), adminSession?.user?.role);

  const lot = await api(admin, "/api/admin/cards", {
    method: "POST",
    body: JSON.stringify({ quantity: 1, batch: `PARCOURS-${stamp}` }),
  });
  const card = lot.body?.cards?.[0];
  record("2. Carte physique creee", Boolean(card), card?.publicToken);

  const created = await api(admin, "/api/admin/clients", {
    method: "POST",
    body: JSON.stringify({ email: clientEmail, name: "Client Parcours", displayName: "Kofi Mensah" }),
  });
  const inviteUrl = created.body?.inviteUrl;
  record("3. Compte client cree (invite)", created.status === 201, created.body?.user?.status);

  // ---------------------------------------------- ACTIVATION PAR LE CLIENT --
  const client = await newSession();
  await client.goto(BASE + inviteUrl, { waitUntil: "networkidle0", timeout: 60000 });
  await client.type('input[name="password"]', clientPassword);
  await client.type('input[name="confirmPassword"]', clientPassword);
  await client.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));
  const activated = await client.evaluate(() => document.body.innerText.includes("Mot de passe enregistre"));
  record("4. Activation via le lien recu", activated);

  const clientSession = await signIn(client, clientEmail, clientPassword);
  record("5. Client connecte avec son mot de passe", Boolean(clientSession?.user), clientSession?.user?.status);

  // -------------------------------------------------- PROFIL PAR LE CLIENT --
  const saved = await api(client, "/api/profile", {
    method: "PUT",
    body: JSON.stringify({
      displayName: "Kofi Mensah",
      firstName: "Kofi",
      lastName: "Mensah",
      title: "Architecte",
      company: "Atelier Sahel",
      phone: "+237699887766",
      emailPublic: "kofi@atelier-sahel.test",
      website: "atelier-sahel.test",
      city: "Yaounde",
      country: "Cameroun",
      fieldVisibility: {},
      seoIndexable: true,
      isPublished: true,
    }),
  });
  record("6. Profil complete et publie", saved.status === 200, saved.body?.profile?.displayName);

  const link = await api(client, "/api/profile/links", {
    method: "POST",
    body: JSON.stringify({
      type: "WHATSAPP",
      label: "WhatsApp",
      description: "Reponse rapide",
      value: "+237699887766",
      isVisible: true,
    }),
  });
  record("7. Lien ajoute", link.status === 201, link.body?.link?.label);

  const profileId = saved.body?.profile?.id;

  // ------------------------------------------------------ ASSOCIATION ADMIN --
  const assign = await api(admin, "/api/admin/cards/assign", {
    method: "POST",
    body: JSON.stringify({ cardId: card.id, profileId }),
  });
  record("8. Carte associee au profil", assign.status === 200 && assign.body?.card?.status === "ACTIVE", assign.body?.card?.status);

  // Le client ne doit pas pouvoir s attribuer une carte lui-meme (§11).
  const stolen = await api(client, "/api/admin/cards/assign", {
    method: "POST",
    body: JSON.stringify({ cardId: card.id, profileId }),
  });
  record("9. Le client ne peut pas reaffecter une carte", stolen.status === 403, `HTTP ${stolen.status}`);

  // ------------------------------------------------------------- VISITEUR --
  const visitor = await newSession();
  const scan = await visitor.goto(`${BASE}/c/${card.publicToken}`, { waitUntil: "networkidle0", timeout: 60000 });
  const shown = await visitor.evaluate(() => document.body.innerText);
  record("10. Le scan ouvre le bon profil", scan?.status() === 200 && shown.includes("Kofi Mensah"), `HTTP ${scan?.status()}`);
  record("11. Le lien du client est visible", shown.includes("WhatsApp"));

  const vcard = await visitor.evaluate(async (t) => {
    const r = await fetch(`/api/vcard/${t}`);
    return { status: r.status, text: await r.text() };
  }, card.publicToken);
  record(
    "12. vCard exploitable",
    vcard.status === 200 && vcard.text.includes("FN:Kofi Mensah") && vcard.text.includes("TEL"),
    `${vcard.text.split("\\r\\n").length} lignes`,
  );

  // --------------------------------------------------------- CARTE PERDUE --
  await api(admin, "/api/admin/cards", {
    method: "PATCH",
    body: JSON.stringify({ cardId: card.id, status: "SUSPENDED" }),
  });
  const after = await visitor.goto(`${BASE}/c/${card.publicToken}`, { waitUntil: "networkidle0" });
  const leaked = await visitor.evaluate(() => document.body.innerText);
  record(
    "13. Carte suspendue : profil inaccessible",
    !leaked.includes("Kofi Mensah") && !leaked.includes("699887766"),
    after?.url().includes("card-unavailable") ? "page neutre" : after?.url() ?? "",
  );

  const vcardAfter = await visitor.evaluate(
    async (t) => (await fetch(`/api/vcard/${t}`)).status,
    card.publicToken,
  );
  record("14. vCard refusee sur carte suspendue", vcardAfter === 404, `HTTP ${vcardAfter}`);
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} etapes reussies`);
  if (failed.length) console.log(`A CORRIGER : ${failed.map((f) => f.name).join(", ")}`);
  await browser.close();
}
