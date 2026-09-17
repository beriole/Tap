import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRsvp, parseRsvpSettings, type RsvpContext } from "./rsvp";
import type { RsvpSubmission } from "@/lib/validations/rsvp";

const PAUL = "clpaulaaaaaaaaaaaaaaaaaaa";
const ANNA = "clannaaaaaaaaaaaaaaaaaaaa";
const PLUS = "clplusaaaaaaaaaaaaaaaaaaa";

const ctx = (over: Partial<RsvpContext> = {}): RsvpContext => ({
  now: new Date("2026-10-01T12:00:00Z"),
  settings: { allowMaybe: false, allowEdit: true, deadline: "2026-11-28T22:59:00.000Z" },
  eventStatus: "PUBLISHED",
  maxSeats: 3,
  currentStatus: "PENDING",
  currentVersion: 0,
  members: [
    { id: PAUL, isPlusOne: false },
    { id: ANNA, isPlusOne: false },
  ],
  mealIds: ["poulet", "poisson"],
  questions: [],
  ...over,
});

const sub = (over: Partial<RsvpSubmission> = {}): RsvpSubmission => ({
  token: "t".repeat(43),
  version: 0,
  status: "ATTENDING",
  people: [
    { key: PAUL, firstName: "Paul", lastName: null, ageCategory: "ADULT", attending: true },
    { key: ANNA, firstName: "Anna", lastName: null, ageCategory: "ADULT", attending: true },
  ],
  meals: {},
  allergies: {},
  consent: false,
  answers: [],
  message: null,
  ...over,
});

const code = (r: ReturnType<typeof checkRsvp>) => (r.ok ? "OK" : r.code);

test("reglages : peut-etre desactive et modification autorisee par defaut", () => {
  assert.deepEqual(parseRsvpSettings({}), { allowMaybe: false, allowEdit: true, deadline: null });
  assert.equal(parseRsvpSettings({ deadline: "2026-11-28T23:59:00+01:00" }).deadline, "2026-11-28T22:59:00.000Z");
});

test("reponse simple acceptee", () => {
  const r = checkRsvp(sub(), ctx());
  assert.equal(code(r), "OK");
});

test("quota : impossible a depasser, meme en ajoutant des accompagnants a la main", () => {
  const people = [
    ...sub().people,
    { key: "new:0", firstName: "Rose", lastName: null, ageCategory: "ADULT" as const, attending: true },
    { key: "new:1", firstName: "Jean", lastName: null, ageCategory: "ADULT" as const, attending: true },
  ];
  assert.equal(code(checkRsvp(sub({ people }), ctx())), "QUOTA");
  assert.equal(code(checkRsvp(sub({ people: people.slice(0, 3) }), ctx())), "OK");
});

test("personne d un autre groupe refusee", () => {
  const people = [{ key: "clautreaaaaaaaaaaaaaaaaaa", firstName: null, lastName: null, ageCategory: "ADULT" as const, attending: true }];
  assert.equal(code(checkRsvp(sub({ people }), ctx())), "INVALID");
});

test("present sans personne presente : refuse", () => {
  const people = sub().people.map((p) => ({ ...p, attending: false }));
  assert.equal(code(checkRsvp(sub({ people }), ctx())), "INVALID");
});

test("date limite passee, evenement non publie : clos", () => {
  assert.equal(code(checkRsvp(sub(), ctx({ now: new Date("2026-12-01T00:00:00Z") }))), "CLOSED");
  assert.equal(code(checkRsvp(sub(), ctx({ eventStatus: "DRAFT" }))), "CLOSED");
});

test("modification interdite apres une premiere reponse si l organisateur l a decide", () => {
  assert.equal(code(checkRsvp(sub({ version: 1 }), ctx({ currentStatus: "ATTENDING", currentVersion: 1, settings: { allowMaybe: false, allowEdit: false, deadline: null } }))), "LOCKED");
});

test("deux onglets : la version perimee est refusee", () => {
  assert.equal(code(checkRsvp(sub({ version: 1 }), ctx({ currentStatus: "ATTENDING", currentVersion: 2 }))), "CONFLICT");
});

test("peut-etre refuse tant qu il n est pas active ; accepte sinon, sans presence tranchee", () => {
  assert.equal(code(checkRsvp(sub({ status: "MAYBE" }), ctx())), "INVALID");
  const r = checkRsvp(sub({ status: "MAYBE" }), ctx({ settings: { allowMaybe: true, allowEdit: true, deadline: null } }));
  assert.ok(r.ok);
  assert.ok(r.ok && r.plan.members.every((m) => m.attending === null));
});

test("declin : tout le monde absent, accompagnants retires, repas ignores", () => {
  const r = checkRsvp(
    sub({ status: "DECLINED", version: 1, meals: { [PAUL]: "poulet" } }),
    ctx({ members: [{ id: PAUL, isPlusOne: false }, { id: ANNA, isPlusOne: false }, { id: PLUS, isPlusOne: true }], currentStatus: "ATTENDING", currentVersion: 1 }),
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.ok(r.plan.members.every((m) => m.attending === false));
  assert.deepEqual(r.plan.removedPlusOneIds, [PLUS]);
  assert.deepEqual(r.plan.meals, {});
});

test("accompagnant annonce mais absent : jamais cree", () => {
  const people = [...sub().people, { key: "new:0", firstName: "Rose", lastName: null, ageCategory: "ADULT" as const, attending: false }];
  const r = checkRsvp(sub({ people }), ctx());
  assert.ok(r.ok && r.plan.newPlusOnes.length === 0);
});

test("invite du groupe oublie par la requete : compte absent, pas present", () => {
  const r = checkRsvp(sub({ people: [sub().people[0]!] }), ctx());
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.plan.members.find((m) => m.existingId === ANNA)?.attending, false);
});

test("repas : menu inconnu refuse, repas d un absent ignore", () => {
  assert.equal(code(checkRsvp(sub({ meals: { [PAUL]: "homard" } }), ctx())), "INVALID");
  const people = [sub().people[0]!, { ...sub().people[1]!, attending: false }];
  const r = checkRsvp(sub({ people, meals: { [PAUL]: "poulet", [ANNA]: "poisson" } }), ctx());
  assert.ok(r.ok && r.plan.meals[ANNA] === undefined && r.plan.meals[PAUL] === "poulet");
});

test("allergie sans accord explicite : refusee (donnee de sante, D12)", () => {
  assert.equal(code(checkRsvp(sub({ allergies: { [PAUL]: "Arachides" } }), ctx())), "CONSENT");
  assert.equal(code(checkRsvp(sub({ allergies: { [PAUL]: "Arachides" }, consent: true }), ctx())), "OK");
  // Champ vide : pas de donnee, pas d accord requis.
  assert.equal(code(checkRsvp(sub({ allergies: { [PAUL]: "" } }), ctx())), "OK");
});

test("questions : types controles, obligatoires exigees, par personne pour chaque present", () => {
  const questions = [
    { id: "q1", type: "SINGLE_CHOICE" as const, options: ["Oui", "Non"], required: true, perGuest: false },
    { id: "q2", type: "TEXT" as const, options: [], required: true, perGuest: true },
    { id: "q3", type: "NUMBER" as const, options: [], required: false, perGuest: false },
  ];
  const c = ctx({ questions });
  const complete = [
    { questionId: "q1", key: null, value: "Oui" },
    { questionId: "q2", key: PAUL, value: "L" },
    { questionId: "q2", key: ANNA, value: "M" },
  ];
  assert.equal(code(checkRsvp(sub({ answers: complete }), c)), "OK");
  assert.equal(code(checkRsvp(sub({ answers: complete.slice(0, 2) }), c)), "INVALID", "q2 manquante pour Anna");
  assert.equal(code(checkRsvp(sub({ answers: [{ questionId: "q1", key: null, value: "Peut-etre" }, ...complete.slice(1)] }), c)), "INVALID", "choix hors liste");
  assert.equal(code(checkRsvp(sub({ answers: [...complete, { questionId: "q3", key: null, value: -4 }] }), c)), "INVALID", "nombre negatif");
  assert.equal(code(checkRsvp(sub({ answers: [...complete, { questionId: "q9", key: null, value: 1 }] }), c)), "INVALID", "question inconnue");
  // Un invite qui decline n a pas a repondre aux questions obligatoires.
  assert.equal(code(checkRsvp(sub({ status: "DECLINED", answers: [] }), c)), "OK");
});
