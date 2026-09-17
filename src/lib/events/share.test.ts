import { test } from "node:test";
import assert from "node:assert/strict";
import { greetingName, renderShareMessage, stateAfterRegenerate, stateAfterShare, whatsappShareUrl } from "./share";
import { csvToEntries, decodeCsvBytes, detectDelimiter, guessColumnRoles, looksLikeHeader, parseCsv } from "./csv";
import { annotateEntries } from "./paste-import";

const vars = { prenom: "Paul", hotes: "Beriole & Anna", titre: "Mariage de Beriole & Anna", date: "samedi 12 décembre 2026", lien: "https://tap.cm/i/abc" };

// ------------------------------------------------------------- message --

test("message : variables remplacees, inconnues laissees visibles", () => {
  assert.equal(renderShareMessage("Bonjour {prenom}, {inconnue} : {lien}", vars), "Bonjour Paul, {inconnue} : https://tap.cm/i/abc");
});

test("message : le lien est ajoute s il a ete oublie dans le modele", () => {
  assert.equal(renderShareMessage("Bonjour {prenom}", vars), "Bonjour Paul\n\nhttps://tap.cm/i/abc");
});

test("message : modele vide → modele par defaut", () => {
  assert.ok(renderShareMessage("   ", vars).includes("Beriole & Anna ont le plaisir"));
});

test("salutation : un ou deux prenoms, sinon le groupe", () => {
  assert.equal(greetingName("Famille Ngono", ["Paul"]), "Paul");
  assert.equal(greetingName("Famille Ngono", ["Paul", "Brigitte"]), "Paul et Brigitte");
  assert.equal(greetingName("Famille Ngono", ["Paul", "Brigitte", "Rose"]), "Famille Ngono");
});

test("WhatsApp : numero en chiffres, texte encode ; sans numero, choix du destinataire", () => {
  assert.equal(whatsappShareUrl("+237699123456", "Bonjour & bienvenue"), "https://wa.me/237699123456?text=Bonjour%20%26%20bienvenue");
  assert.equal(whatsappShareUrl(null, "x"), "https://wa.me/?text=x");
});

test("etats : partager ne fait jamais reculer, regenerer garde la reponse", () => {
  assert.equal(stateAfterShare("CREATED"), "SHARED");
  assert.equal(stateAfterShare("OPENED"), "OPENED");
  assert.equal(stateAfterShare("RESPONDED"), "RESPONDED");
  assert.equal(stateAfterRegenerate(true), "RESPONDED");
  assert.equal(stateAfterRegenerate(false), "CREATED");
});

// ----------------------------------------------------------------- CSV --

test("CSV : export Excel francais en Windows-1252 decode sans losanges", () => {
  // "Hervé;Yaoundé" en Windows-1252 : é = 0xE9, invalide en UTF-8.
  const bytes = new Uint8Array([0x48, 0x65, 0x72, 0x76, 0xe9, 0x3b, 0x59, 0x61, 0x6f, 0x75, 0x6e, 0x64, 0xe9]);
  assert.equal(decodeCsvBytes(bytes), "Hervé;Yaoundé");
});

test("CSV : UTF-8 avec BOM", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("Nom;Téléphone")]);
  assert.equal(decodeCsvBytes(bytes), "Nom;Téléphone");
});

test("CSV : separateur detecte hors guillemets", () => {
  assert.equal(detectDelimiter('Nom;Tel\n"Ngono, Paul";699123456'), ";");
  assert.equal(detectDelimiter("Nom,Tel\nPaul,699"), ",");
});

test("CSV : guillemets, guillemets echappes, retour a la ligne dans un champ, lignes vides", () => {
  const rows = parseCsv('Nom;Note\r\n"Ngono; Paul";"Il a dit ""oui""\nhier"\r\n;\r\n\r\nAnna;ok\r\n');
  assert.deepEqual(rows, [
    ["Nom", "Note"],
    ["Ngono; Paul", 'Il a dit "oui"\nhier'],
    ["Anna", "ok"],
  ]);
});

test("CSV : roles devines depuis l en-tete, Nom devient nom de famille a cote de Prenom", () => {
  assert.deepEqual(guessColumnRoles(["Prénom", "Nom", "Téléphone portable", "Famille", "Remarque"]), ["firstName", "lastName", "phone", "group", "ignore"]);
  assert.deepEqual(guessColumnRoles(["Nom", "Numéro WhatsApp"]), ["fullName", "phone"]);
  assert.equal(looksLikeHeader(["Nom", "Téléphone"]), true);
  assert.equal(looksLikeHeader(["Paul Ngono", "699 12 34 56"]), false);
});

test("CSV : lignes converties, prenom et nom recolles, lignes sans nom ni numero ignorees", () => {
  const rows = [["Prénom", "Nom", "Tel", "Famille"], ["Paul", "NGONO", "699123456", "Famille Ngono"], ["", "", "", ""], ["Anna", "", "", ""]];
  const entries = csvToEntries(rows, ["firstName", "lastName", "phone", "group"], true);
  assert.deepEqual(entries, [
    { fullName: "Paul NGONO", phone: "699123456", group: "Famille Ngono", line: 2 },
    { fullName: "Anna", phone: null, group: null, line: 4 },
  ]);
});

test("CSV et collage : memes controles (doublon, numero incomplet)", () => {
  const rows = annotateEntries([
    { line: 2, source: "", fullName: "Paul NGONO", phone: "699123456", group: "Famille Ngono" },
    { line: 3, source: "", fullName: "Rose Mbarga", phone: "+237 699 12 34 56", group: null },
    { line: 4, source: "", fullName: "Oncle Jean", phone: "699 12", group: null },
  ]);
  assert.ok(rows[1]!.issues.includes("duplicate_phone"));
  assert.ok(rows[2]!.issues.includes("incomplete"));
  assert.equal(rows[2]!.groupName, "Oncle Jean");
});
