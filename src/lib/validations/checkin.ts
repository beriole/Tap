import { z } from "zod";
import { isTicketCode } from "@/lib/events/checkin";

const token = z.string().refine(isTicketCode, "Jeton invalide.");

/** Ouverture d un poste : jeton du lien + PIN + nom de l operateur (journalise, §10). */
export const stationOpenSchema = z.object({
  token,
  pin: z.string().regex(/^\d{4}$/, "Le code PIN a quatre chiffres."),
  operatorName: z.string().trim().min(2, "Votre prenom, pour l historique des entrees.").max(60),
});

/** Verification d un QR ou recherche manuelle. */
export const stationLookupSchema = z.object({
  token,
  pin: z.string().regex(/^\d{4}$/),
  scanned: z.string().max(400).optional(),
  query: z.string().max(80).optional(),
});

/** Enregistrement d une entree. */
export const stationAdmitSchema = z.object({
  token,
  pin: z.string().regex(/^\d{4}$/),
  operatorName: z.string().trim().min(2).max(60),
  ticketId: z.string().cuid(),
  quantity: z.number().int().min(1).max(50),
  method: z.enum(["QR", "MANUAL"]),
  override: z.boolean().default(false),
  undo: z.boolean().default(false),
});

export const stationCreateSchema = z.object({
  label: z.string().trim().min(2, "Nommez ce poste (Entree principale...).").max(60),
});
