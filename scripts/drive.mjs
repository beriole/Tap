/**
 * Pilote de verification : ouvre le vrai Chrome, agit comme un visiteur.
 *
 * Sert a deux choses que curl ne peut pas faire : verifier qu un parcours
 * fonctionne reellement (soumission de formulaire, redirection, session), et
 * capturer les ecrans au bon viewport - `--window-size` de Chrome headless ne
 * gouverne pas la mise en page, il ne fait que recadrer l image.
 *
 *   node scripts/drive.mjs shot <url> <fichier> [largeur] [hauteur] [pleine-page]
 *   node scripts/drive.mjs login <email> <motdepasse>
 */
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const [, , command, ...args] = process.argv;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`);
});

try {
  if (command === "shot") {
    const [url, file, w = "390", h = "844", full = "true", reduced = "false"] = args;
    await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 2 });
    // Verifie le rendu des personnes qui ont reduit les animations : c est le
    // chemin ou une erreur d hydratation vide la page entiere.
    if (reduced === "true") {
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
    }
    await page.goto(url.startsWith("http") ? url : BASE + url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    // Laisse la sequence d arrivee se terminer, puis parcourt la page pour
    // declencher les apparitions au defilement avant de capturer.
    await new Promise((r) => setTimeout(r, 1400));
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: file, fullPage: full === "true" });
    console.log(`OK ${file}`);
  }

  // Se connecte puis capture une page protegee : c est le seul moyen de voir
  // reellement les espaces client et administrateur.
  if (command === "auth-shot") {
    const [email, password, url, file, w = "1440", h = "940", full = "false"] = args;
    await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 2 });

    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
    ]);

    await page.goto(url.startsWith("http") ? url : BASE + url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: file, fullPage: full === "true" });
    console.log(`OK ${file} (${page.url()})`);
  }

  // Clique chaque onglet et rapporte ou l on atterrit reellement.
  if (command === "nav") {
    const [email, password, ...paths] = args;
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
    ]);

    for (const path of paths) {
      errors.length = 0;
      const before = page.url();
      const link = await page.$(`a[href="${path}"]`);
      if (!link) {
        console.log(`${path.padEnd(26)} LIEN INTROUVABLE`);
        continue;
      }
      const clickedAt = Date.now();
      await link.click();
      // Attendre le changement d URL plutot qu une duree fixe : en dev, la
      // premiere compilation d une route peut prendre plus de dix secondes.
      await page
        .waitForFunction((p) => location.pathname === p, { timeout: 25000 }, path)
        .catch(() => null);
      const elapsed = Date.now() - clickedAt;
      const after = page.url();
      const status = after.endsWith(path) ? "OK" : "N A PAS NAVIGUE";
      const err = errors.length ? ` | ${errors[0].slice(0, 160)}` : "";
      console.log(
        `${path.padEnd(26)} ${status.padEnd(16)} ${String(elapsed).padStart(6)} ms  ${before} -> ${after}${err}`,
      );
    }
    errors.length = 0;
  }

  // Capture l ecran JUSTE APRES un clic, pour voir l etat d attente.
  if (command === "pending-shot") {
    const [email, password, path, file, delay = "350"] = args;
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
    ]);

    const link = await page.$(`a[href="${path}"]`);
    if (!link) throw new Error(`lien introuvable: ${path}`);
    await link.click();
    await new Promise((r) => setTimeout(r, Number(delay)));
    await page.screenshot({ path: file });
    console.log(`OK ${file}`);
  }

  // Connexion, navigation, clic sur un element contenant un texte, capture.
  if (command === "click-shot") {
    const [email, password, url, text, file, w = "1440", h = "1000", wait = "2500"] = args;
    await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 2 });
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
    ]);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    const clicked = await page.evaluate((t) => {
      const el = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.includes(t),
      );
      if (!el) return false;
      el.click();
      return true;
    }, text);

    if (!clicked) throw new Error(`bouton introuvable: ${text}`);
    await new Promise((r) => setTimeout(r, Number(wait)));
    await page.screenshot({ path: file });
    console.log(`OK ${file}`);
  }

  if (command === "login") {
    const [email, password, file] = args;
    await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0", timeout: 60000 });

    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => null),
    ]);
    await new Promise((r) => setTimeout(r, 1500));

    const session = await page.evaluate(async () => {
      const r = await fetch("/api/auth/session");
      return r.json();
    });

    console.log(`url apres soumission : ${page.url()}`);
    console.log(`session : ${JSON.stringify(session)}`);
    console.log(session?.user ? "RESULTAT: CONNEXION OK" : "RESULTAT: CONNEXION ECHOUEE");
    if (file) {
      await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({ path: file });
      console.log(`capture ${file}`);
    }
  }
} finally {
  if (errors.length) console.log("--- erreurs navigateur ---\n" + errors.join("\n"));
  await browser.close();
}
