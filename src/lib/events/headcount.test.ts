import { test } from "node:test";
import assert from "node:assert/strict";
import { computeHeadcount, type HeadcountGroup, type HeadcountGuest } from "./headcount";

const guest = (over: Partial<HeadcountGuest> = {}): HeadcountGuest => ({
  ageCategory: "ADULT",
  attending: null,
  isPlusOne: false,
  mealOptionId: null,
  hasAllergies: false,
  ...over,
});

const group = (
  status: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE",
  guests: HeadcountGuest[],
  over: Partial<HeadcountGroup> = {},
  state: NonNullable<HeadcountGroup["invitation"]>["state"] = status === "PENDING" ? "SHARED" : "RESPONDED",
): HeadcountGroup => ({
  maxSeats: guests.length,
  invitation: { state, status, seatsUsed: 0 },
  guests,
  ...over,
});

test("liste vide : tout a zero, pas de division par zero", () => {
  const h = computeHeadcount([]);
  assert.equal(h.people.expected, 0);
  assert.equal(h.responseRate, 0);
  assert.equal(h.capacity.remaining, null);
});

test("famille partiellement presente : seuls les presents sont attendus", () => {
  const h = computeHeadcount([
    group("ATTENDING", [
      guest({ attending: true }),
      guest({ attending: true, ageCategory: "CHILD" }),
      guest({ attending: false }),
      guest({ attending: true, ageCategory: "BABY" }),
    ]),
  ]);
  assert.equal(h.people.expected, 3);
  assert.equal(h.people.adults, 1);
  assert.equal(h.people.children, 1);
  assert.equal(h.people.babies, 1);
  assert.equal(h.people.declined, 1);
  assert.equal(h.people.noResponse, 0);
});

test("attending=true dans un groupe DECLINED ne compte jamais comme attendu", () => {
  // Cas reel : la famille avait confirme, puis a decline. Les lignes Guest
  // gardent leur ancienne valeur ; le statut du groupe fait foi.
  const h = computeHeadcount([group("DECLINED", [guest({ attending: true }), guest({ attending: true })])]);
  assert.equal(h.people.expected, 0);
  assert.equal(h.people.declined, 2);
  assert.equal(h.groups.declined, 1);
});

test("peut-etre : hors attendus, mais dans la fourchette haute de capacite (D3)", () => {
  const h = computeHeadcount(
    [group("ATTENDING", [guest({ attending: true })]), group("MAYBE", [guest(), guest()])],
    10,
  );
  assert.equal(h.people.expected, 1);
  assert.equal(h.people.maybe, 2);
  assert.equal(h.capacity.upperBound, 3);
  assert.equal(h.capacity.remaining, 9);
  assert.equal(h.capacity.exceeded, false);
});

test("plus-un : compte quand il vient, disparait de la liste quand il est retire", () => {
  const h = computeHeadcount([
    group("ATTENDING", [guest({ attending: true }), guest({ attending: true, isPlusOne: true })], { maxSeats: 2 }),
    group("ATTENDING", [guest({ attending: true }), guest({ attending: false, isPlusOne: true })], { maxSeats: 2 }),
  ]);
  assert.equal(h.people.expected, 3);
  assert.equal(h.people.plusOnes, 1);
  assert.equal(h.people.listed, 3);
  // Un +1 retire n est pas un invite absent.
  assert.equal(h.people.declined, 0);
});

test("depassement de quota detecte, jamais masque", () => {
  const h = computeHeadcount([
    group("ATTENDING", [guest({ attending: true }), guest({ attending: true }), guest({ attending: true })], {
      maxSeats: 2,
    }),
  ]);
  assert.equal(h.groups.overQuota, 1);
  assert.equal(h.people.expected, 3);
});

test("capacite depassee", () => {
  const h = computeHeadcount([group("ATTENDING", [guest({ attending: true }), guest({ attending: true })])], 1);
  assert.equal(h.capacity.exceeded, true);
  assert.equal(h.capacity.remaining, -1);
});

test("repas : par option, sans choix, bebes exclus, allergies", () => {
  const h = computeHeadcount([
    group("ATTENDING", [
      guest({ attending: true, mealOptionId: "poulet" }),
      guest({ attending: true, mealOptionId: "poulet", hasAllergies: true }),
      guest({ attending: true, mealOptionId: "poisson" }),
      guest({ attending: true }),
      guest({ attending: true, ageCategory: "BABY" }),
      guest({ attending: false, mealOptionId: "poisson", hasAllergies: true }),
    ]),
  ]);
  assert.deepEqual(h.meals.byOption, { poulet: 2, poisson: 1 });
  assert.equal(h.meals.unassigned, 1);
  assert.equal(h.meals.withAllergies, 1);
});

test("taux de reponse : les invitations revoquees sortent du denominateur", () => {
  const h = computeHeadcount([
    group("ATTENDING", [guest({ attending: true })]),
    group("PENDING", [guest()]),
    group("PENDING", [guest()], {}, "REVOKED"),
    { maxSeats: 1, invitation: null, guests: [guest()] },
  ]);
  assert.equal(h.responseRate, 1 / 2);
  assert.equal(h.groups.withInvitation, 3);
  assert.equal(h.groups.pending, 3);
  assert.equal(h.people.noResponse, 3);
});

test("etats d envoi : partage et ouverture cumulatifs", () => {
  const h = computeHeadcount([
    group("PENDING", [guest()], {}, "CREATED"),
    group("PENDING", [guest()], {}, "SHARED"),
    group("PENDING", [guest()], {}, "OPENED"),
    group("ATTENDING", [guest({ attending: true })], {}, "RESPONDED"),
  ]);
  assert.equal(h.groups.shared, 3);
  assert.equal(h.groups.opened, 2);
});

test("entrees : somme des places consommees", () => {
  const g = group("ATTENDING", [guest({ attending: true }), guest({ attending: true })]);
  g.invitation!.seatsUsed = 2;
  const h = computeHeadcount([g, group("ATTENDING", [guest({ attending: true })])]);
  assert.equal(h.people.checkedIn, 2);
});

test("invariant : attendus + absents + peut-etre + sans reponse couvrent chaque invite liste", () => {
  const groups = [
    group("ATTENDING", [guest({ attending: true }), guest({ attending: false })]),
    // Personne ajoutee apres la reponse du groupe : ni presente ni absente
    group("ATTENDING", [guest({ attending: true }), guest({ attending: null })]),
    group("ATTENDING", [guest({ attending: true }), guest({ attending: false, isPlusOne: true })]),
    group("DECLINED", [guest(), guest({ attending: true })]),
    group("MAYBE", [guest(), guest({ attending: false })]),
    group("PENDING", [guest(), guest(), guest()]),
  ];
  const h = computeHeadcount(groups);
  const covered = h.people.expected + h.people.declined + h.people.maybe + h.people.noResponse;
  assert.equal(covered, h.people.listed);
  assert.equal(h.people.noResponse, 4);
  assert.equal(h.people.maybe, 2);
});
