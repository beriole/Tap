import assert from "node:assert/strict";
import { test } from "node:test";
import { RETENTION_DAYS, cutoff, eventEnd, isDue } from "./retention";

const now = new Date("2026-09-18T03:00:00Z");
const day = 86_400_000;

test("la fin de l evenement est endsAt, sinon startsAt", () => {
  const start = new Date("2026-09-01T12:00:00Z");
  assert.equal(eventEnd({ startsAt: start, endsAt: null }), start);
  assert.equal(eventEnd({ startsAt: start, endsAt: new Date("2026-09-02T02:00:00Z") }).toISOString(), "2026-09-02T02:00:00.000Z");
});

test("allergies a J+30 : la veille non, le jour meme oui", () => {
  const ends = (d: number) => ({ startsAt: new Date(now.getTime() - d * day), endsAt: null });
  assert.equal(isDue(ends(29.9), now, RETENTION_DAYS.allergies), false);
  assert.equal(isDue(ends(30), now, RETENTION_DAYS.allergies), true);
  assert.equal(isDue(ends(400), now, RETENTION_DAYS.allergies), true);
});

test("un evenement a venir ou en cours n est jamais du", () => {
  const future = { startsAt: new Date(now.getTime() + day), endsAt: null };
  assert.equal(isDue(future, now, RETENTION_DAYS.stations), false);
  assert.equal(isDue(future, now, RETENTION_DAYS.archive), false);
});

test("le seuil est une date de fin, pas une date de debut", () => {
  // Commence il y a 100 jours mais finit demain : pas archive.
  const long = { startsAt: new Date(now.getTime() - 100 * day), endsAt: new Date(now.getTime() + day) };
  assert.equal(isDue(long, now, RETENTION_DAYS.archive), false);
  assert.equal(cutoff(now, 90).toISOString(), "2026-06-20T03:00:00.000Z");
});
