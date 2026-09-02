import { z } from "zod";
import type { LinkType } from "@prisma/client";
import { LINK_TYPES } from "@/config/link-types";
import { sanitizeHref, type UrlCheck } from "@/lib/url-safety";

const linkTypeEnum = z.enum(Object.keys(LINK_TYPES) as [string, ...string[]]);

/**
 * Valide la valeur d un lien APRES l avoir transformee en href.
 *
 * La saisie du client n est presque jamais une URL : un telephone s ecrit
 * "+237 6 99 88 77 66", un compte Instagram "@pseudo". C est `toHref` qui en
 * fait "tel:..." ou "https://instagram.com/pseudo". Verifier la valeur brute
 * revenait a refuser tous les types qui ne sont pas deja des liens - donc la
 * majorite d entre eux.
 */
export function checkLinkValue(type: string, value: string): UrlCheck {
  const definition = LINK_TYPES[type as LinkType];
  return sanitizeHref(definition ? definition.toHref(value) : value);
}

const linkFields = z.object({
  type: linkTypeEnum,
  label: z.string().trim().min(1, "Titre requis.").max(60),
  value: z.string().trim().min(1, "Valeur requise.").max(500),
  description: z.string().trim().max(80).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadecimale attendue.")
    .optional()
    .nullable(),
  style: z.enum(["SOLID", "OUTLINE", "PILL", "ICON_TEXT"]).optional().nullable(),
  isVisible: z.boolean().default(true),
});

/** §5.3 - Chaque lien est un objet configurable, pas une colonne figee. */
export const linkSchema = linkFields.superRefine((data, ctx) => {
  const checked = checkLinkValue(data.type, data.value);
  if (!checked.ok) {
    ctx.addIssue({ code: "custom", path: ["value"], message: checked.reason });
  }
});

/**
 * A la modification, le type peut ne pas etre renvoye (on ne change que le
 * libelle, par exemple). La verification de la valeur se fait alors dans la
 * route, avec le type deja enregistre.
 */
export const linkUpdateSchema = linkFields.partial().extend({ id: z.string().cuid() });

/** Reordonnancement par glisser-deposer (§6.2). */
export const reorderSchema = z.object({
  order: z.array(z.string().cuid()).min(1).max(200),
});

export type LinkInput = z.infer<typeof linkSchema>;
