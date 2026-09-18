import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEnvelope, frames, parseDsn } from "./monitoring-envelope";

test("DSN Sentry : point d envoi et cle publique", () => {
  assert.deepEqual(parseDsn("https://abc123@o1.ingest.sentry.io/456"), { endpoint: "https://o1.ingest.sentry.io/api/456/envelope/", key: "abc123" });
  assert.equal(parseDsn("pas-une-url"), null);
  assert.equal(parseDsn("https://o1.ingest.sentry.io/456"), null);
});

test("enveloppe : trois lignes, erreur, requete sans corps ni cookie", () => {
  const error = new TypeError("boom");
  error.stack = "TypeError: boom\n    at handler (/app/route.ts:10:5)\n    at run (/app/server.js:1:1)";
  const envelope = buildEnvelope(
    error,
    { url: "/i/secret", method: "GET", route: "/i/[token]", source: "render" },
    { eventId: "e".repeat(32), timestamp: "2026-09-18T00:00:00.000Z", environment: "test" },
  );
  const [header, item, event] = envelope.split("\n").map((l) => JSON.parse(l));
  assert.equal(header.event_id, "e".repeat(32));
  assert.equal(item.type, "event");
  assert.equal(event.exception.values[0].type, "TypeError");
  assert.equal(event.exception.values[0].value, "boom");
  // Sentry attend la pile du plus ancien au plus recent.
  assert.deepEqual(event.exception.values[0].stacktrace.frames.map((f: { function: string }) => f.function), ["run", "handler"]);
  assert.equal(event.request.url, "/i/secret");
  assert.equal(event.tags.route, "/i/[token]");
  assert.ok(!("cookies" in event.request) && !("data" in event.request));
});

test("une valeur qui n est pas une Error est enveloppee", () => {
  const event = JSON.parse(buildEnvelope("texte", {}, { eventId: "a", timestamp: "t", environment: "test" }).split("\n")[2]!);
  assert.equal(event.exception.values[0].value, "texte");
  assert.equal(frames(undefined), undefined);
});
