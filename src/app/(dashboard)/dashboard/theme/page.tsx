import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { PageBody, PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Theme" };

/** §6.2 - Choix du theme et personnalisation encadree. */
export default async function ThemePage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    include: { theme: { include: { theme: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Theme"
        description="Quinze directions artistiques pour le meme contenu. Changer de theme ne perd ni une information ni un lien."
      />
      <PageBody>
        <ThemePicker
          currentKey={profile?.theme?.theme.key ?? "minimal"}
          accentColor={profile?.theme?.accentColor ?? "#111827"}
          mode={profile?.theme?.mode ?? "LIGHT"}
          buttonStyle={profile?.theme?.buttonStyle ?? "SOLID"}
          media={{
            avatar: Boolean(profile?.avatarUrl),
            cover: Boolean(profile?.coverUrl),
            logo: Boolean(profile?.logoUrl),
          }}
        />
      </PageBody>
    </>
  );
}
