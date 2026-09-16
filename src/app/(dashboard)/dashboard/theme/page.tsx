import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { DesignStudio } from "@/components/dashboard/design-studio";
import { EmptyState, PageBody, PageHeader } from "@/components/app/ui";
import {
  PREMIUM_ENGINES,
  isPremiumEngine,
  resolveEngineSettings,
  type PremiumEngine,
} from "@/config/premium-themes";

export const metadata: Metadata = { title: "Design" };

/**
 * §6.2 - Choix du design et personnalisation encadree.
 *
 * Seuls les douze moteurs premium sont proposes. Un profil encore habille par
 * un theme de l ancienne collection continue de s afficher tel quel au scan ;
 * le studio l invite simplement a choisir l un des douze.
 */
export default async function ThemePage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    include: { theme: { include: { theme: true } } },
  });

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow="Espace client"
          title="Choisissez votre design"
          description="Créez d’abord votre profil : les aperçus s’affichent avec vos propres informations."
        />
        <PageBody>
          <EmptyState
            title="Aucun profil"
            body="Renseignez votre nom, votre fonction et votre photo, puis revenez choisir votre design."
            actionHref="/dashboard/profile"
            actionLabel="Créer mon profil"
          />
        </PageBody>
      </>
    );
  }

  const key = profile.theme?.theme.key ?? "";
  const isLegacy = !isPremiumEngine(key);
  const engineKey: PremiumEngine = isLegacy ? PREMIUM_ENGINES[0].key : (key as PremiumEngine);
  const settings = resolveEngineSettings(engineKey, {
    variant: profile.theme?.variant,
    customConfig: (profile.theme?.customConfig ?? {}) as Record<string, unknown>,
  });
  const config = (profile.theme?.customConfig ?? {}) as Record<string, unknown>;

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Choisissez votre design"
        description="Douze directions, montrées avec vos propres informations. Touchez un design pour le voir en plein écran, puis ajustez-le : vos contenus restent les mêmes, seule la mise en scène change."
      />
      <PageBody>
        <DesignStudio
          isLegacy={isLegacy}
          hasPhoto={Boolean(profile.avatarUrl || profile.coverUrl)}
          current={{
            engine: engineKey,
            variant: settings.variant.key,
            accent: typeof config.accent === "string" ? config.accent.toUpperCase() : null,
            shape: settings.shape,
            photo: settings.focus,
          }}
        />
      </PageBody>
    </>
  );
}
