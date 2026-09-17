import { z } from "zod";
import { isSupportedTimezone } from "@/lib/events/time";

/**
 * Validation d un evenement, de ses lieux et de ses sections.
 *
 * Les heures arrivent en heure "murale" (2026-12-12T14:00) : c est le serveur
 * qui les convertit avec le fuseau de l evenement (lib/events/time.ts).
 */

const wallTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date et heure attendues.");
const text = (max: number) => z.string().trim().max(max, `${max} caracteres maximum.`);

export const EVENT_TYPES = ["WEDDING", "BIRTHDAY", "CORPORATE", "MEMORIAL", "OTHER"] as const;

export const venueSchema = z.object({
  label: text(40).min(1, "Nommez ce moment (Ceremonie, Reception...)."),
  name: text(120).min(2, "Nom du lieu requis."),
  address: text(200).min(2, "Adresse requise."),
  landmark: text(160).nullish(),
  startsAt: wallTime.nullish(),
});

const eventInfo = z.object({
  type: z.enum(EVENT_TYPES),
  title: text(120).min(3, "Donnez un titre a l evenement."),
  hosts: text(120).min(2, "Qui invite ?"),
  startsAt: wallTime,
  endsAt: wallTime.nullish(),
  timezone: z.string().refine(isSupportedTimezone, "Fuseau horaire inconnu."),
  capacity: z.number().int().min(1).max(100_000).nullish(),
});

const checkEnd = <T extends { startsAt?: string; endsAt?: string | null }>(v: T) =>
  !v.startsAt || !v.endsAt || v.endsAt > v.startsAt;

export const eventCreateSchema = eventInfo
  .extend({ venues: z.array(venueSchema).max(6, "6 lieux maximum.").default([]) })
  .refine(checkEnd, { path: ["endsAt"], message: "La fin doit suivre le debut." });

export const eventUpdateSchema = eventInfo
  .partial()
  .refine(checkEnd, { path: ["endsAt"], message: "La fin doit suivre le debut." });

export const venuesSchema = z.object({ venues: z.array(venueSchema).max(6, "6 lieux maximum.") });

// ------------------------------------------------------------- sections --

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadecimale attendue.");

export const SECTION_KINDS = ["program", "dresscode", "menu", "faq", "custom"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

const sectionBase = { title: text(60).nullish(), isVisible: z.boolean().default(true) };

export const sectionSchema = z.discriminatedUnion("kind", [
  z.object({
    ...sectionBase,
    kind: z.literal("program"),
    data: z.object({
      items: z
        .array(
          z.object({
            time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure au format 14:30."),
            label: text(120).min(1),
            venueLabel: text(40).nullish(),
          }),
        )
        .max(30),
    }),
  }),
  z.object({
    ...sectionBase,
    kind: z.literal("dresscode"),
    data: z.object({ text: text(600), palette: z.array(hex).max(6).default([]) }),
  }),
  z.object({
    ...sectionBase,
    kind: z.literal("menu"),
    data: z.object({
      courses: z.array(z.object({ label: text(40).min(1), items: z.array(text(120).min(1)).max(12) })).max(8),
    }),
  }),
  z.object({
    ...sectionBase,
    kind: z.literal("faq"),
    data: z.object({ items: z.array(z.object({ q: text(160).min(1), a: text(800).min(1) })).max(20) }),
  }),
  z.object({
    ...sectionBase,
    kind: z.literal("custom"),
    data: z.object({ text: text(2000) }),
  }),
]);

export type SectionInput = z.infer<typeof sectionSchema>;

export const sectionsSchema = z.object({ sections: z.array(sectionSchema).max(20) });
