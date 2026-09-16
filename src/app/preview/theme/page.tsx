import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { previewProfile } from "@/server/card-resolution";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { ACCENT_PALETTE, getThemeDefinition } from "@/config/themes";
import { getEngine, isPremiumEngine } from "@/config/premium-themes";
import type { ThemeKey } from "@/types/profile";

export const metadata = { robots: { index: false, follow: false } };

type Params = {
  searchParams: Promise<{
    key?: string;
    accent?: string;
    mode?: string;
    button?: string;
    variant?: string;
    shape?: string;
    photo?: string;
  }>;
};

/**
 * Rendu isole d un theme, charge dans une iframe par le studio de design.
 *
 * Pourquoi une iframe plutot qu un rendu direct : les themes sont des
 * composants serveur, et le profil public doit le rester (performance). Les
 * basculer cote client pour un apercu penaliserait la page qui compte
 * vraiment. L iframe montre le rendu REEL, a la vraie largeur d un telephone,
 * avec les donnees REELLES du client - "moi avec Obsidian", pas un inconnu.
 *
 * Rien n est enregistre ici : c est un essayage, pas une publication. Chaque
 * parametre est filtre contre le catalogue ; une valeur inconnue retombe sur
 * celle du design.
 */
export default async function ThemePreviewPage({ searchParams }: Params) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const owned = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!owned) notFound();

  const q = await searchParams;
  const definition = getThemeDefinition(q.key ?? "") ?? getThemeDefinition("signature")!;
  const base = await previewProfile(owned.id);

  if (isPremiumEngine(definition.key)) {
    const engine = getEngine(definition.key)!;
    const variant = engine.variants.find((v) => v.key === q.variant) ?? engine.variants[0];
    const accent = q.accent && engine.palette.includes(q.accent.toUpperCase()) ? q.accent.toUpperCase() : null;

    return (
      <ThemeRenderer
        preview
        profile={{
          ...base,
          theme: {
            ...base.theme,
            key: definition.key,
            variant: variant.key,
            accentColor: accent ?? variant.tokens.accent,
            mode: variant.tokens.scheme === "dark" ? "DARK" : "LIGHT",
            customConfig: {
              ...(accent ? { accent } : {}),
              ...(q.shape === "soft" || q.shape === "pill" || q.shape === "sharp" ? { shape: q.shape } : {}),
              ...(q.photo === "top" || q.photo === "center" || q.photo === "bottom" ? { photo: q.photo } : {}),
            },
          },
        }}
      />
    );
  }

  const safeAccent =
    q.accent && (ACCENT_PALETTE as readonly string[]).includes(q.accent)
      ? q.accent
      : definition.defaultAccent;

  return (
    <ThemeRenderer
      preview
      profile={{
        ...base,
        theme: {
          ...base.theme,
          key: definition.key as ThemeKey,
          accentColor: safeAccent,
          mode:
            q.mode === "DARK" || q.mode === "LIGHT" || q.mode === "AUTO" ? q.mode : definition.defaultMode,
          buttonStyle:
            q.button === "OUTLINE" || q.button === "PILL" || q.button === "ICON_TEXT" || q.button === "SOLID"
              ? q.button
              : base.theme.buttonStyle,
        },
      }}
    />
  );
}
