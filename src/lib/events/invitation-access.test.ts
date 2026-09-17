import { test } from "node:test";
import assert from "node:assert/strict";
import { canReadInvitation, isInvitationToken, stateAfterOpen } from "./invitation-access";

const now = new Date("2026-10-01T12:00:00Z");

test("format de jeton : 43 caracteres base64url acceptes, le reste refuse sans requete", () => {
  assert.equal(isInvitationToken("aB3_-".repeat(8) + "xyz"), true);
  assert.equal(isInvitationToken("court"), false);
  assert.equal(isInvitationToken("' OR 1=1 --".padEnd(43, "a")), false);
  assert.equal(isInvitationToken("a".repeat(65)), false);
});

test("lisible : publie ou clos, ni revoque ni expire", () => {
  assert.equal(canReadInvitation({ revokedAt: null, expiresAt: null, eventStatus: "PUBLISHED" }, now), true);
  assert.equal(canReadInvitation({ revokedAt: null, expiresAt: null, eventStatus: "CLOSED" }, now), true);
});

test("illisible : brouillon, archive, revoque, expire", () => {
  assert.equal(canReadInvitation({ revokedAt: null, expiresAt: null, eventStatus: "DRAFT" }, now), false);
  assert.equal(canReadInvitation({ revokedAt: null, expiresAt: null, eventStatus: "ARCHIVED" }, now), false);
  assert.equal(canReadInvitation({ revokedAt: now, expiresAt: null, eventStatus: "PUBLISHED" }, now), false);
  assert.equal(canReadInvitation({ revokedAt: null, expiresAt: now, eventStatus: "PUBLISHED" }, now), false);
});

test("ouverture : avance l etat sans jamais le faire reculer", () => {
  assert.equal(stateAfterOpen("CREATED"), "OPENED");
  assert.equal(stateAfterOpen("SHARED"), "OPENED");
  assert.equal(stateAfterOpen("OPENED"), "OPENED");
  assert.equal(stateAfterOpen("RESPONDED"), "RESPONDED");
  assert.equal(stateAfterOpen("REVOKED"), "REVOKED");
});
