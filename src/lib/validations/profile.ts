import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** §5.2 - Editeur de profil : identite, contact, adresse, presentation, visibilite. */
export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Nom affiche requis.").max(80),
  firstName: optionalText(60),
  lastName: optionalText(60),
  title: optionalText(80),
  company: optionalText(80),
  tagline: optionalText(120),
  bio: optionalText(600),

  phone: optionalText(32),
  whatsapp: optionalText(32),
  emailPublic: z.string().email().optional().or(z.literal("")),
  website: optionalText(200),

  address: optionalText(200),
  city: optionalText(80),
  country: optionalText(80),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  mapUrl: optionalText(500),

  introText: optionalText(400),
  availability: optionalText(80),
  ctaLabel: optionalText(40),
  ctaUrl: optionalText(500),

  /** Un booleen par champ ou bloc masquable (§5.2 "Visibilite"). */
  fieldVisibility: z.record(z.string(), z.boolean()).default({}),
  seoIndexable: z.boolean().default(true),
  isPublished: z.boolean().default(false),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const VISIBILITY_FIELDS = [
  "avatar", "cover", "logo", "title", "company", "tagline", "bio",
  "phone", "whatsapp", "email", "website",
  "address", "map", "availability", "cta", "qr",
] as const;
