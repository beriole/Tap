/**
 * Audit de la page d accueil : liens, structure, accessibilite, responsive.
 *
 * On verifie ce qu un visiteur - ou un robot d indexation - rencontre
 * reellement, pas seulement que la page repond 200.
 */
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

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
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

try {
  await page.setViewport({ width: 1440, height: 900 });
  const response = await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  record("La page repond", response?.status() === 200, `HTTP ${response?.status()}`);

  // --- Metadonnees -----------------------------------------------------------
  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    lang: document.documentElement.lang,
    viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
  }));
  record("Titre renseigne", meta.title.length > 10, meta.title);
  record("Description renseignee", meta.description.length > 40, `${meta.description.length} caracteres`);
  record("Langue declaree", meta.lang === "fr", meta.lang);
  record("Viewport mobile", meta.viewport.includes("width=device-width"));

  // --- Structure -------------------------------------------------------------
  const structure = await page.evaluate(() => {
    const h1 = [...document.querySelectorAll("h1")];
    const imgs = [...document.querySelectorAll("img")];
    return {
      h1Count: h1.length,
      h1Text: h1[0]?.innerText.replace(/\s+/g, " ").trim() ?? "",
      h2Count: document.querySelectorAll("h2").length,
      imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
      totalImages: imgs.length,
    };
  });
  record("Un seul h1", structure.h1Count === 1, structure.h1Text.slice(0, 48));
  record("Sections titrees", structure.h2Count >= 3, `${structure.h2Count} h2`);
  record("Toutes les images ont un alt", structure.imagesWithoutAlt === 0, `${structure.totalImages} image(s)`);

  // --- Liens -----------------------------------------------------------------
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
  );
  const internal = [...new Set(hrefs.filter((h) => h?.startsWith("/")))];
  const anchors = [...new Set(hrefs.filter((h) => h?.startsWith("#")))];

  for (const href of internal) {
    const r = await page.evaluate(async (h) => (await fetch(h, { redirect: "manual" })).status, href);
    record(`Lien ${href}`, r === 200 || r === 307 || r === 308, `HTTP ${r}`);
  }

  for (const a of anchors) {
    const exists = await page.evaluate((id) => Boolean(document.querySelector(id)), a);
    record(`Ancre ${a}`, exists);
  }

  // --- Responsive ------------------------------------------------------------
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await new Promise((r) => setTimeout(r, 400));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    record(`Aucun debordement lateral a ${width} px`, overflow <= 1, `${overflow} px`);
  }

  // --- Focus clavier ---------------------------------------------------------
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    return { tag: el.tagName, outline: s.outlineStyle, text: el.textContent?.slice(0, 24) ?? "" };
  });
  record("Le premier Tab atteint un element", Boolean(focused), focused ? `${focused.tag} "${focused.text}"` : "aucun");

  record("Aucune erreur console", consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? "");
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verifications reussies`);
  if (failed.length) console.log(`A CORRIGER : ${failed.map((f) => f.name).join(", ")}`);
  await browser.close();
}
