import { z } from "zod";

/** §16 - Back-office : creation de lots, association, remplacement. */
export const createCardsSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(500),
  batch: z.string().trim().max(40).optional(),
  label: z.string().trim().max(60).optional(),
});

export const assignCardSchema = z.object({
  cardId: z.string().cuid(),
  profileId: z.string().cuid().nullable(),
});

export const cardStatusSchema = z.object({
  cardId: z.string().cuid(),
  status: z.enum(["UNASSIGNED", "ACTIVE", "SUSPENDED", "LOST", "REPLACED"]),
  /** Carte de remplacement lors d un SAV (§5.6). */
  replacedByCardId: z.string().cuid().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export type CreateCardsInput = z.infer<typeof createCardsSchema>;
