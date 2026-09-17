import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveThemeSettings } from "@/config/invitation-themes";
import { buildInvitationView, daysUntil, splitHosts, type RawInvitationEvent } from "./invitation-view";

const base: RawInvitationEvent = {
  type: "WEDDING",
  title: "Mariage de Beriole & Anna",
  hosts: "Beriole & Anna",
  startsAt: new Date("2026-12-12T13:00:00Z"),
  endsAt: null,
  timezone: "Africa/Douala",
  heroImageUrl: null,
  contentUpdatedAt: null,
  publishedAt: new Date("2026-09-10T09:00:00Z"),
  themeKey: "royal-ivory",
  themeSettings: {},
  rsvpSettings: { deadline: "2026-11-28T22:59:00Z" },
  venues: [
    { label: "Ceremonie", name: "Cathedrale", address: "Avenue Kennedy, Yaounde", landmark: null, lat: null, lng: null, startsAt: new Date("2026-12-12T13:00:00Z") },
  ],
  sections: [
    { id: "s1", kind: "program", title: "Programme", isVisible: true, data: { items: [{ time: "14:00", label: "Ceremonie" }] } },
    { id: "s2", kind: "faq", title: "FAQ", isVisible: false, data: { items: [{ q: "Q", a: "R" }] } },
    { id: "s3", kind: "menu", title: "Menu", isVisible: true, data: { courses: "corrompu" } },
  ],
};

test("dates formatees dans le fuseau du lieu, en francais", () => {
  const view = buildInvitationView(base, null, { preview: true, now: new Date("2026-09-17T10:00:00Z") });
  assert.equal(view.event.starts.long, "samedi 12 décembre 2026");
  assert.equal(view.event.starts.time, "14 h 00");
  assert.equal(view.venues[0]!.time, "14 h 00");
  assert.equal(view.rsvp.deadline?.day, "28");
  assert.equal(view.rsvp.closed, false);
});

test("sections masquees ou invalides n arrivent jamais au theme", () => {
  const view = buildInvitationView(base, null, { preview: true });
  assert.deepEqual(view.sections.map((s) => s.id), ["s1"]);
});

test("invite : seuls prenoms, nom de groupe et places - jamais les +1 anonymes", () => {
  const view = buildInvitationView(
    base,
    { groupName: "Famille Ngono", maxSeats: 4, guests: [{ firstName: "paul", isPlusOne: false }, { firstName: null, isPlusOne: true }, { firstName: "Brigitte", isPlusOne: false }] },
    { preview: false },
  );
  assert.deepEqual(view.guest, { groupName: "Famille Ngono", seats: 4, firstNames: ["Paul", "Brigitte"] });
  assert.ok(!JSON.stringify(view).includes("internalNote"));
});

test("bandeau de mise a jour : seulement apres la publication", () => {
  const before = buildInvitationView({ ...base, contentUpdatedAt: new Date("2026-09-01T00:00:00Z") }, null, { preview: true });
  const after = buildInvitationView({ ...base, contentUpdatedAt: new Date("2026-10-03T08:00:00Z") }, null, { preview: true });
  assert.equal(before.event.updatedNote, null);
  assert.equal(after.event.updatedNote, "Mis à jour le 3 octobre");
});

test("date limite depassee : RSVP ferme", () => {
  const view = buildInvitationView(base, null, { preview: false, now: new Date("2026-12-01T00:00:00Z") });
  assert.equal(view.rsvp.closed, true);
});

test("hotes decoupes pour la composition, sinon laisses entiers", () => {
  assert.deepEqual(splitHosts("Beriole & Anna"), ["Beriole", "Anna"]);
  assert.deepEqual(splitHosts("Marie-Claire et Jean-Paul"), ["Marie-Claire", "Jean-Paul"]);
  assert.deepEqual(splitHosts("Maeva"), ["Maeva"]);
  assert.deepEqual(splitHosts("Paul & Anna & Rose"), ["Paul & Anna & Rose"]);
});

test("compte a rebours en jours calendaires du lieu", () => {
  // 23 h 30 a Douala le 11 = deja le 11 ; l evenement est le 12 → 1 jour.
  assert.equal(daysUntil(new Date("2026-12-12T13:00:00Z"), new Date("2026-12-11T22:30:00Z"), "Africa/Douala"), 1);
  assert.equal(daysUntil(new Date("2026-12-12T13:00:00Z"), new Date("2026-12-12T20:00:00Z"), "Africa/Douala"), 0);
  assert.equal(daysUntil(new Date("2026-12-12T13:00:00Z"), new Date("2026-12-14T00:00:00Z"), "Africa/Douala"), null);
});

test("reglages : valeur trafiquee ou inconnue → valeur du theme, le reste est garde", () => {
  assert.deepEqual(resolveThemeSettings("royal-ivory", { variant: "nuit", accent: "<script>", countdown: "oui" }), {
    variant: "nuit",
    accent: "champagne",
    countdown: true,
  });
  assert.deepEqual(resolveThemeSettings("theme-inexistant", null), { variant: "ivoire", accent: "champagne", countdown: true });
});

test("apercu d un autre reglage sans toucher a l evenement", () => {
  const view = buildInvitationView(base, null, { preview: true, themeOverride: { settings: { variant: "nuit" } } });
  assert.equal(view.theme.settings.variant, "nuit");
  assert.deepEqual(base.themeSettings, {});
});
