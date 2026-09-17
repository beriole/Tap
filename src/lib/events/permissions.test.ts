import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessEvent } from "./permissions";

test("sans appartenance : aucun acces, meme en lecture", () => {
  assert.equal(canAccessEvent(null, "view"), false);
  assert.equal(canAccessEvent(undefined, "guests"), false);
});

test("proprietaire : tout", () => {
  const owner = { role: "OWNER" as const, permissions: [] };
  for (const need of ["view", "design", "guests", "sensitive", "exports", "team"] as const) {
    assert.equal(canAccessEvent(owner, need), true, need);
  }
});

test("co-organisateur : seulement ce qui est accorde", () => {
  const co = { role: "COORGANIZER" as const, permissions: ["guests", "checkin"] };
  assert.equal(canAccessEvent(co, "view"), true);
  assert.equal(canAccessEvent(co, "guests"), true);
  assert.equal(canAccessEvent(co, "checkin"), true);
  assert.equal(canAccessEvent(co, "sensitive"), false);
  assert.equal(canAccessEvent(co, "exports"), false);
});

test("co-organisateur : l equipe reste au proprietaire, meme si la liste la contient", () => {
  const co = { role: "COORGANIZER" as const, permissions: ["team"] };
  assert.equal(canAccessEvent(co, "team"), false);
});
