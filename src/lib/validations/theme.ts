import { z } from "zod";
import { ACCENT_PALETTE, FONT_PAIRS, THEME_KEYS } from "@/config/themes";
import { getEngine, isPremiumEngine } from "@/config/premium-themes";

/**
 * §6.2 / Regle UX - "Le client personnalise son identite, mais ne doit pas
 * pouvoir casser le design." La personnalisation est donc encadree par des
 * enumerations fermees, revalidees ici quel que soit ce qu envoie le navigateur.
 *
 * Deux regimes :
 *  - moteurs premium (Signature, Obsidian, Immersive) : variante du moteur,
 *    accent dans SA palette, forme et cadrage dans customConfig ;
 *  - collection historique : palette commune, comme avant.
 */
const HEX = /^#[0-9A-Fa-f]{6}$/;

export const profileThemeSchema = z
  .object({
    themeKey: z.enum(THEME_KEYS as [string, ...string[]]),
    accentColor: z.string().regex(HEX, "Couleur invalide."),
    mode: z.enum(["LIGHT", "DARK", "AUTO"]).default("LIGHT"),
    variant: z.string().max(40).optional().nullable(),
    fontPair: z
      .enum(FONT_PAIRS.map((f) => f.key) as [string, ...string[]])
      .optional()
      .nullable(),
    buttonStyle: z.enum(["SOLID", "OUTLINE", "PILL", "ICON_TEXT"]).default("SOLID"),
    customConfig: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .default({}),
  })
  .superRefine((data, ctx) => {
    const upper = data.accentColor.toUpperCase();

    if (!isPremiumEngine(data.themeKey)) {
      if (!(ACCENT_PALETTE as readonly string[]).includes(data.accentColor)) {
        ctx.addIssue({ code: "custom", path: ["accentColor"], message: "Couleur hors palette." });
      }
      return;
    }

    const engine = getEngine(data.themeKey)!;
    const variant = engine.variants.find((v) => v.key === data.variant);
    if (!variant) {
      ctx.addIssue({ code: "custom", path: ["variant"], message: "Variante inconnue pour ce design." });
      return;
    }

    const allowedAccents = new Set([...engine.palette, ...engine.variants.map((v) => v.tokens.accent)]);
    if (!allowedAccents.has(upper)) {
      ctx.addIssue({ code: "custom", path: ["accentColor"], message: "Couleur hors palette du design." });
    }

    const { accent, shape, photo, ...rest } = data.customConfig;
    if (Object.keys(rest).length > 0) {
      ctx.addIssue({ code: "custom", path: ["customConfig"], message: "Reglage non reconnu." });
    }
    if (accent !== undefined && !(typeof accent === "string" && engine.palette.includes(accent.toUpperCase()))) {
      ctx.addIssue({ code: "custom", path: ["customConfig", "accent"], message: "Couleur hors palette du design." });
    }
    if (shape !== undefined && !["soft", "pill", "sharp"].includes(String(shape))) {
      ctx.addIssue({ code: "custom", path: ["customConfig", "shape"], message: "Forme inconnue." });
    }
    if (photo !== undefined && !["top", "center", "bottom"].includes(String(photo))) {
      ctx.addIssue({ code: "custom", path: ["customConfig", "photo"], message: "Cadrage inconnu." });
    }
  });

export type ProfileThemeInput = z.infer<typeof profileThemeSchema>;
