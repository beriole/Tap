import assert from "node:assert/strict";
import { test } from "node:test";
import { sniffImageType } from "./image-type";

const bytes = (...parts: (string | number[])[]) =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
const pad = (b: Uint8Array) => Uint8Array.from([...b, ...new Array(Math.max(0, 16 - b.length)).fill(0)]);

test("reconnait JPEG, PNG, WebP et AVIF a leurs premiers octets", () => {
  assert.equal(sniffImageType(pad(bytes([0xff, 0xd8, 0xff, 0xe0]))), "image/jpeg");
  assert.equal(sniffImageType(pad(bytes([0x89], "PNG\r\n\x1a\n"))), "image/png");
  assert.equal(sniffImageType(pad(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))), "image/webp");
  assert.equal(sniffImageType(pad(bytes([0, 0, 0, 0x1c], "ftypavif"))), "image/avif");
});

test("refuse ce qui n est pas une image, quel que soit le nom annonce", () => {
  assert.equal(sniffImageType(bytes("<!doctype html><script>")), null);
  assert.equal(sniffImageType(bytes("GIF89a", [0, 0, 0, 0, 0, 0])), null);
  assert.equal(sniffImageType(bytes("RIFF", [0, 0, 0, 0], "WAVEfmt ")), null);
  assert.equal(sniffImageType(new Uint8Array(3)), null);
});
