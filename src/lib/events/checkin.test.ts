import { test } from "node:test";
import assert from "node:assert/strict";
import { admissionQuantity, extractTicketCode, generatePin, isAcceptablePin, ticketVerdict } from "./checkin";

const code = "a".repeat(43);
const t = (seats: number, used: number, over: Partial<Parameters<typeof ticketVerdict>[0]> = {}) => ({
  seats,
  seatsUsed: used,
  cancelledAt: null,
  eventStatus: "PUBLISHED" as const,
  ...over,
});

test("code extrait d une URL de ticket, ou accepte seul ; tout le reste refuse", () => {
  assert.equal(extractTicketCode(`https://tap.cm/t/${code}`), code);
  assert.equal(extractTicketCode(`https://tap.cm/t/${code}?src=qr`), code);
  assert.equal(extractTicketCode(code), code);
  assert.equal(extractTicketCode("https://tap.cm/i/" + code), null, "un lien d invitation n est pas un ticket");
  assert.equal(extractTicketCode("bonjour"), null);
});

test("verdicts : valide, partiel, deja entres, annule, evenement non ouvert", () => {
  assert.deepEqual(ticketVerdict(t(4, 0)), { kind: "valid", remaining: 4 });
  assert.deepEqual(ticketVerdict(t(4, 1)), { kind: "partial", remaining: 3 });
  assert.deepEqual(ticketVerdict(t(4, 4)), { kind: "used" });
  assert.deepEqual(ticketVerdict(t(4, 0, { cancelledAt: new Date() })), { kind: "cancelled" });
  assert.deepEqual(ticketVerdict(t(4, 0, { eventStatus: "DRAFT" })), { kind: "not_open" });
  assert.deepEqual(ticketVerdict(t(4, 0, { eventStatus: "CLOSED" })), { kind: "valid", remaining: 4 }, "clos = plus de RSVP, mais on accueille");
});

test("quantite admise : jamais au-dela du restant sans entree forcee", () => {
  assert.deepEqual(admissionQuantity(t(5, 0), 5), { quantity: 5, forced: false });
  assert.deepEqual(admissionQuantity(t(5, 3), 5), { quantity: 2, forced: false });
  assert.deepEqual(admissionQuantity(t(5, 5), 1), { quantity: 0, forced: false });
  assert.deepEqual(admissionQuantity(t(5, 0, { cancelledAt: new Date() }), 1), { quantity: 0, forced: false });
  assert.deepEqual(admissionQuantity(t(5, 0), -3), { quantity: 0, forced: false });
});

test("entree forcee : possible, mais signalee comme forcee", () => {
  assert.deepEqual(admissionQuantity(t(5, 5), 1, true), { quantity: 1, forced: true });
  assert.deepEqual(admissionQuantity(t(5, 3), 2, true), { quantity: 2, forced: false }, "dans le restant : rien de force");
  assert.deepEqual(admissionQuantity(t(5, 3), 4, true), { quantity: 4, forced: true });
});

test("PIN : quatre chiffres, ni repetition ni suite", () => {
  assert.equal(isAcceptablePin("7391"), true);
  assert.equal(isAcceptablePin("0000"), false);
  assert.equal(isAcceptablePin("1234"), false);
  assert.equal(isAcceptablePin("4321"), false);
  assert.equal(isAcceptablePin("12a4"), false);
  assert.equal(isAcceptablePin("12345"), false);
  const pin = generatePin(() => 0.1234);
  assert.equal(isAcceptablePin(pin), true);
});
