import { z } from "zod";
import { SHARE_FIELDS } from "@/server/share-links";

/**
 * Validation d un lien de partage restreint.
 *
 * Le point sensible : `fields`. C est la liste de ce qui SORT. On la contraint
 * a des cles connues plutot que d accepter un objet libre - sinon une cle mal
 * orthographiee cote client masquerait silencieusement un champ que le client
 * croyait avoir coche.
 */
const FIELD_KEYS = SHARE_FIELDS.map((f) => f.key) as [string, ...string[]];

const themeMode = z.enum(["LIGHT", "DARK", "AUTO"]);
const buttonStyle = z.enum(["SOLID", "OUTLINE", "PILL", "ICON_TEXT"]);

const base = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Donnez un nom a ce lien.")
    .max(60, "60 caracteres maximum."),
  note: z.string().trim().max(280).nullish(),
  fields: z.array(z.enum(FIELD_KEYS)).max(FIELD_KEYS.length),
  linkIds: z.array(z.string().cuid()).max(50),
  themeKey: z.string().trim().min(1).nullish(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadecimale attendue.")
    .nullish(),
  mode: themeMode.nullish(),
  buttonStyle: buttonStyle.nullish(),
  isActive: z.boolean().default(true),
  /** Date ISO ; vide = pas d expiration. */
  expiresAt: z.string().datetime().nullish(),
});

export const shareLinkCreateSchema = base;
export const shareLinkUpdateSchema = base.partial().extend({ id: z.string().cuid() });

export type ShareLinkInput = z.infer<typeof base>;
