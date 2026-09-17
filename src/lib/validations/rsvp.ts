import { z } from "zod";

/**
 * Reponse d un invite (cahier §7). Forme brute envoyee par le formulaire ;
 * les regles metier (quota, date limite, questions obligatoires...) sont
 * dans lib/events/rsvp.ts.
 *
 * `key` designe une personne : l identifiant d un invite existant du groupe,
 * ou "new:N" pour un accompagnant ajoute par l invite.
 */

const personKey = z.string().regex(/^(new:\d{1,2}|[a-z0-9]{20,32})$/);
const name = z
  .string()
  .trim()
  .max(60)
  .nullish()
  .transform((v) => (v ? v : null));

export const rsvpSubmissionSchema = z.object({
  token: z.string().min(32).max(64),
  /** Version lue par le formulaire : 0 si aucune reponse n existait */
  version: z.number().int().min(0),
  status: z.enum(["ATTENDING", "DECLINED", "MAYBE"]),
  people: z
    .array(
      z.object({
        key: personKey,
        firstName: name,
        lastName: name,
        ageCategory: z.enum(["ADULT", "CHILD", "BABY"]).default("ADULT"),
        attending: z.boolean(),
      }),
    )
    .max(40),
  meals: z.record(personKey, z.string().max(40).nullable()).default({}),
  allergies: z.record(personKey, z.string().trim().max(300)).default({}),
  consent: z.boolean().default(false),
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(40), key: personKey.nullish(), value: z.unknown() }))
    .max(200)
    .default([]),
  message: z.string().trim().max(500).nullish(),
});

export type RsvpSubmission = z.infer<typeof rsvpSubmissionSchema>;

/** Reglages RSVP de l evenement, edites par l organisateur. */
export const rsvpSettingsSchema = z.object({
  allowMaybe: z.boolean(),
  allowEdit: z.boolean(),
  /** ISO UTC ; null = pas de date limite */
  deadline: z.string().datetime({ offset: true }).nullable(),
});

export type RsvpSettings = z.infer<typeof rsvpSettingsSchema>;

export const mealInputSchema = z.object({
  id: z.string().max(40).optional(),
  label: z.string().trim().min(1, "Nom du menu requis.").max(60),
  description: z
    .string()
    .trim()
    .max(160)
    .nullish()
    .transform((v) => (v ? v : null)),
  forChildren: z.boolean().default(false),
});

export const questionInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    type: z.enum(["TEXT", "SINGLE_CHOICE", "MULTI_CHOICE", "NUMBER", "BOOLEAN"]),
    label: z.string().trim().min(1, "Intitule requis.").max(160),
    options: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
    required: z.boolean().default(false),
    perGuest: z.boolean().default(false),
  })
  .refine((q) => !["SINGLE_CHOICE", "MULTI_CHOICE"].includes(q.type) || q.options.length >= 2, {
    path: ["options"],
    message: "Proposez au moins deux choix.",
  });

export const rsvpConfigSchema = z.object({
  settings: z.object({
    allowMaybe: z.boolean(),
    allowEdit: z.boolean(),
    /** Heure murale dans le fuseau de l evenement, ou null */
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
      .nullable(),
  }),
  meals: z.array(mealInputSchema).max(12),
  questions: z.array(questionInputSchema).max(15),
});
