import { z } from "zod";

/**
 * Validation des groupes d invites.
 *
 * Le numero arrive BRUT : c est le serveur qui le normalise. Un E.164 envoye
 * par le navigateur n est jamais cru - il suffirait de modifier la requete
 * pour glisser un numero "valide" que personne n a verifie.
 */

const text = (max: number) => z.string().trim().max(max, `${max} caracteres maximum.`);
const optionalText = (max: number) =>
  text(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const AGE_CATEGORIES = ["ADULT", "CHILD", "BABY"] as const;

export const guestInputSchema = z.object({
  /** Present pour une personne existante, absent pour une nouvelle */
  id: z.string().cuid().optional(),
  firstName: optionalText(60),
  lastName: optionalText(60),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .email("E-mail invalide.")
    .max(160)
    .nullish()
    .or(z.literal("").transform(() => null)),
  ageCategory: z.enum(AGE_CATEGORIES).default("ADULT"),
});

const groupFields = {
  name: text(120).min(1, "Nom du groupe requis."),
  maxSeats: z.number().int().min(1, "Au moins une place.").max(30, "30 places maximum par groupe."),
  category: optionalText(60),
  tags: z.array(text(30).min(1)).max(10).default([]),
  internalNote: optionalText(500),
  guests: z.array(guestInputSchema).min(1, "Au moins une personne.").max(30),
};

const guestsFitSeats = (g: { guests: unknown[]; maxSeats: number }) => g.guests.length <= g.maxSeats;
const someoneNamed = (g: { guests: { firstName: string | null; lastName: string | null }[] }) =>
  g.guests.some((p) => p.firstName || p.lastName);

export const groupCreateSchema = z
  .object(groupFields)
  .refine(guestsFitSeats, { path: ["maxSeats"], message: "Plus de personnes que de places." })
  .refine(someoneNamed, { path: ["guests"], message: "Nommez au moins une personne." });

export const groupUpdateSchema = groupCreateSchema;

export type GroupInput = z.infer<typeof groupCreateSchema>;

/** Collage texte a analyser (ecran de validation). */
export const importPreviewSchema = z.object({ text: z.string().max(200_000, "Collage trop long.") });

/** Groupes valides par l organisateur apres relecture. */
export const importCommitSchema = z.object({
  groups: z.array(groupCreateSchema).min(1, "Rien a importer.").max(2000),
});
