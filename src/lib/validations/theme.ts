import { z } from "zod";
import { ACCENT_PALETTE, FONT_PAIRS, THEME_KEYS } from "@/config/themes";

/**
 * §6.2 / Regle UX - "Le client personnalise son identite, mais ne doit pas
 * pouvoir casser le design." La personnalisation est donc encadree par une
 * enumeration fermee de themes, palettes, polices et styles de boutons.
 */
export const profileThemeSchema = z.object({
  themeKey: z.enum(THEME_KEYS as [string, ...string[]]),
  accentColor: z.enum(ACCENT_PALETTE as unknown as [string, ...string[]]),
  mode: z.enum(["LIGHT", "DARK", "AUTO"]).default("LIGHT"),
  variant: z.string().max(40).optional().nullable(),
  fontPair: z
    .enum(FONT_PAIRS.map((f) => f.key) as [string, ...string[]])
    .optional()
    .nullable(),
  buttonStyle: z.enum(["SOLID", "OUTLINE", "PILL", "ICON_TEXT"]).default("SOLID"),
  /** Options libres MAIS validees ensuite contre Theme.configSchema (§17). */
  customConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export type ProfileThemeInput = z.infer<typeof profileThemeSchema>;
