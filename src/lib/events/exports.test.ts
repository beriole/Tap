import { test } from "node:test";
import assert from "node:assert/strict";
import { computeHeadcount } from "./headcount";
import { buildExportRows, exportFileName, exportMatchesHeadcount, exportTotals, toCsv, type ExportGroup } from "./exports";

const guest = (name: string, over: Partial<ExportGroup["guests"][number]> = {}): ExportGroup["guests"][number] => ({
  name,
  ageCategory: "ADULT",
  attending: null,
  isPlusOne: false,
  mealOptionId: null,
  mealLabel: null,
  hasAllergies: false,
  allergies: null,
  ...over,
});

const group = (name: string, status: ExportGroup["responseStatus"], guests: ExportGroup["guests"], maxSeats = guests.length): ExportGroup => ({
  name,
  category: null,
  primaryPhone: "+237699000000",
  responseStatus: status,
  maxSeats,
  invitation: { state: status === "PENDING" ? "SHARED" : "RESPONDED", status, seatsUsed: 0 },
  guests,
});

const sample: ExportGroup[] = [
  group("Famille Ngono", "ATTENDING", [
    guest("Paul Ngono", { attending: true, mealOptionId: "m1", mealLabel: "Poulet DG", hasAllergies: true, allergies: "Arachides" }),
    guest("Brigitte Ngono", { attending: false }),
    guest("Noah Ngono", { attending: true, ageCategory: "CHILD", mealOptionId: "m2", mealLabel: "Menu enfant" }),
    guest("Bebe", { attending: true, ageCategory: "BABY" }),
    guest("Rose", { attending: true, isPlusOne: true, mealOptionId: "m1", mealLabel: "Poulet DG" }),
  ], 5),
  // Groupe confirme mais personnes marquees presentes... puis groupe qui a decline :
  // le statut du groupe fait foi, ces "attending: true" ne comptent pas.
  group("Famille Fotso", "DECLINED", [guest("Samuel Fotso", { attending: true }), guest("Anna Fotso", { attending: true })]),
  group("Oncle Jean", "MAYBE", [guest("Jean Mbarga")]),
  group("Tante Rose", "PENDING", [guest("Rose Kamga")]),
  group("Retire", "ATTENDING", [guest("Herve", { attending: true }), guest("", { attending: false, isPlusOne: true })], 2),
];

test("exports = totaux du dashboard, pour les trois exports", () => {
  const expected = computeHeadcount(sample).people.expected;
  assert.equal(expected, 5);
  for (const kind of ["guests", "caterer", "checkin"] as const) {
    assert.equal(exportTotals(kind, buildExportRows(kind, sample)).people, expected, kind);
    assert.equal(exportMatchesHeadcount(kind, sample), true, kind);
  }
});

test("traiteur : presents seulement, bebe sans menu, allergie dans sa colonne", () => {
  const rows = buildExportRows("caterer", sample);
  assert.equal(rows.length, 6);
  assert.deepEqual(rows[1], ["Famille Ngono", "Paul Ngono", "Adulte", "Poulet DG", "Arachides"]);
  assert.deepEqual(rows[3], ["Famille Ngono", "Bebe", "Bebe", "Aucun (bebe)", ""]);
  assert.ok(!rows.some((r) => r[1] === "Brigitte Ngono" || r[1] === "Samuel Fotso"));
});

test("traiteur sans droit aux allergies : colonne vide, jamais le texte", () => {
  const masked = sample.map((g) => ({ ...g, guests: g.guests.map((x) => ({ ...x, allergies: null })) }));
  const rows = buildExportRows("caterer", masked);
  assert.ok(!JSON.stringify(rows).includes("Arachides"));
});

test("accueil : groupes attendus, tries, +1 retire absent de la liste", () => {
  const rows = buildExportRows("checkin", sample);
  assert.deepEqual(rows.slice(1).map((r) => r[0]), ["Famille Ngono", "Retire"]);
  assert.equal(rows[2]![1], "Herve");
});

test("tous les invites : un groupe par ligne, presents comptes selon le statut du groupe", () => {
  const rows = buildExportRows("guests", sample);
  assert.equal(rows.length, 6);
  assert.equal(rows[2]![4], "Absent");
  assert.equal(rows[2]![5], "0");
});

test("CSV Excel francais : BOM, point-virgule, guillemets, formule neutralisee", () => {
  const csv = toCsv([["Nom", "Note"], ['Ngono; "Paul"', "=HYPERLINK(\"x\")"], ["Anna", "ligne\nsuivante"]]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes('"Ngono; ""Paul""";"\'=HYPERLINK(""x"")"'));
  assert.ok(csv.includes('"ligne\nsuivante"'));
  assert.ok(csv.endsWith("\r\n"));
});

test("nom de fichier propre", () => {
  assert.equal(exportFileName("caterer", "Mariage de Béríole & Anna"), "mariage-de-beriole-anna-traiteur.csv");
  assert.equal(exportFileName("guests", "!!!"), "evenement-invites.csv");
});
