import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { previewProfile } from "@/server/card-resolution";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { ACCENT_PALETTE, getThemeDefinition } from "@/config/themes";
import type { ThemeKey } from "@/types/profile";

export const metadata = { robots: { index: false, follow: false } };

type Params = {
  searchParams: Promise<{
    key?: string;
    accent?: string;
    mode?: string;
    button?: string;
  }>;
};

/**
 * Rendu isole d un theme, destine a etre charge dans une iframe par le
 * selecteur de theme.
 *
 * Pourquoi une iframe plutot qu un rendu direct : les themes sont des
 * composants serveur, et le profil public doit le rester (performance, SEO).
 * Les basculer cote client pour un simple apercu penaliserait la page qui
 * compte vraiment. L iframe permet de montrer le rendu REEL, sans dupliquer la
 * moindre ligne de mise en page.
 *
 * Rien n est enregistre ici : c est un essayage, pas une publication.
 */
export default async function ThemePreviewPage({ searchParams }: Params) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const owned = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!owned) notFound();

  const { key, accent, mode, button } = await searchParams;
  const definition = getThemeDefinition(key ?? "") ?? getThemeDefinition("minimal")!;
  const base = await previewProfile(owned.id);

  const safeAccent =
    accent && (ACCENT_PALETTE as readonly string[]).includes(accent)
      ? accent
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
          mode: mode === "DARK" || mode === "LIGHT" || mode === "AUTO" ? mode : definition.defaultMode,
          buttonStyle:
            button === "OUTLINE" || button === "PILL" || button === "ICON_TEXT" || button === "SOLID"
              ? button
              : base.theme.buttonStyle,
        },
      }}
    />
  );
}
