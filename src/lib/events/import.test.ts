import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "./phone";
import { nameKey, splitName } from "./names";
import { groupRows, parsePastedGuests } from "./paste-import";
import { utcToWallTime, wallTimeToUtc } from "./time";

// ------------------------------------------------------------- numeros --

test("numeros camerounais : toutes les ecritures courantes donnent le meme E.164", () => {
  for (const raw of ["699 12 34 56", "+237 699 12 34 56", "00237699123456", "(+237) 699-12-34-56", "699.12.34.56"]) {
    assert.equal(normalizePhone(raw).e164, "+237699123456", raw);
  }
});

test("numero etranger avec indicatif : conserve", () => {
  assert.equal(normalizePhone("+33 6 12 34 56 78").e164, "+33612345678");
});

test("numero incomplet : jamais complete", () => {
  const r = normalizePhone("699 12 34");
  assert.equal(r.e164, null);
  assert.equal(r.issue, "incomplete");
});

test("lettre O a la place d un zero : signale, pas corrige", () => {
  const r = normalizePhone("69O 12 34 56");
  assert.equal(r.e164, null);
  assert.equal(r.issue, "ambiguous");
});

test("numero de bonne longueur mais invalide", () => {
  assert.equal(normalizePhone("111 11 11 11").issue, "invalid");
});

// ---------------------------------------------------------------- noms --

test("nom en capitales reconnu comme nom de famille, quelle que soit sa place", () => {
  assert.deepEqual(splitName("NGONO Paul"), { firstName: "Paul", lastName: "Ngono", separable: true });
  assert.deepEqual(splitName("Paul NGONO"), { firstName: "Paul", lastName: "Ngono", separable: true });
  assert.deepEqual(splitName("Marie-Claire ETO'O"), { firstName: "Marie-Claire", lastName: "Eto'O", separable: true });
});

test("sans indice de casse : premier mot = prenom", () => {
  assert.deepEqual(splitName("Paul Ngono Essomba"), { firstName: "Paul", lastName: "Ngono Essomba", separable: true });
});

test("un seul mot : non separable", () => {
  assert.equal(splitName("Tantine").separable, false);
});

test("cle de nom : insensible a l ordre, la casse et les accents", () => {
  assert.equal(nameKey("Hervé", "NGONO"), nameKey("ngono herve"));
});

// ---------------------------------------------------------- copier-coller --

test("separateurs varies et colonnes dans le desordre", () => {
  const rows = parsePastedGuests(
    [
      "Nom - Telephone - Groupe",
      "Paul NGONO - 699 12 34 56 - Famille Ngono",
      "Brigitte Ngono;677 88 99 00;Famille Ngono",
      "Famille Fotso\tSamuel Fotso\t+237 655 44 33 22",
      "Clarisse Mbarga 690112233",
    ].join("\n"),
  );
  assert.equal(rows.length, 4, "l en-tete est ignore");
  assert.equal(rows[0]!.phoneE164, "+237699123456");
  assert.equal(rows[0]!.groupName, "Famille Ngono");
  assert.equal(rows[1]!.lastName, "Ngono");
  // Colonne groupe AVANT le nom : le premier texte est pris pour la personne.
  // On le documente plutot que de deviner : l ecran de validation permet de corriger.
  assert.equal(rows[2]!.fullName, "Famille Fotso");
  assert.equal(rows[3]!.phoneE164, "+237690112233");
  assert.equal(rows[3]!.groupName, "Clarisse Mbarga", "sans groupe, la personne est son propre groupe");
});

test("numero manquant ou incomplet : ligne gardee, probleme nomme", () => {
  const rows = parsePastedGuests("Tante Rose\nOncle Jean - 699 12");
  assert.deepEqual(rows[0]!.issues, ["no_phone"]);
  assert.ok(rows[1]!.issues.includes("incomplete"));
  assert.equal(rows[1]!.phoneE164, null);
});

test("doublons : numero certain, nom probable, dans le collage et contre la base", () => {
  const rows = parsePastedGuests(
    ["Paul NGONO - 699123456", "Paul Ngono - 677889900", "Samuel Fotso - +237 699 12 34 56", "Anna Kamga - 655443322"].join("\n"),
    { existing: [{ firstName: "Anna", lastName: "Kamga", phoneE164: null, groupName: "Famille Kamga" }] },
  );
  assert.deepEqual(rows[0]!.issues, []);
  assert.ok(rows[1]!.issues.includes("probable_duplicate"));
  assert.equal(rows[1]!.duplicateOf, "ligne 1");
  assert.ok(rows[2]!.issues.includes("duplicate_phone"));
  assert.ok(rows[3]!.issues.includes("probable_duplicate"));
  assert.equal(rows[3]!.duplicateOf, "deja invite (Famille Kamga)");
});

test("regroupement par groupe, insensible a la casse", () => {
  const rows = parsePastedGuests("Paul Ngono - 699123456 - Famille Ngono\nBrigitte Ngono - 677889900 - famille NGONO\nSeul Invite - 655443322");
  const groups = groupRows(rows);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]!.members.length, 2);
});

// ---------------------------------------------------------------- dates --

test("heure murale de Yaounde → UTC, et retour", () => {
  const utc = wallTimeToUtc("2026-12-12T14:00", "Africa/Douala");
  assert.equal(utc.toISOString(), "2026-12-12T13:00:00.000Z");
  assert.equal(utcToWallTime(utc, "Africa/Douala"), "2026-12-12T14:00");
});

test("changement d heure a Paris gere (hiver et ete)", () => {
  assert.equal(wallTimeToUtc("2026-01-10T18:00", "Europe/Paris").toISOString(), "2026-01-10T17:00:00.000Z");
  assert.equal(wallTimeToUtc("2026-07-10T18:00", "Europe/Paris").toISOString(), "2026-07-10T16:00:00.000Z");
});
