import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { previewProfile } from "@/server/card-resolution";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { EmptyState, PageBody, PageHeader } from "@/components/app/ui";
import { PhoneFrame } from "@/components/marketing/phone";

export const metadata: Metadata = { title: "Apercu" };

/** §6.2 - "Apercu en temps reel avant publication." Le tracking y est desactive. */
export default async function PreviewPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow="Espace client"
          title="Apercu"
          description="L apercu affichera exactement ce que verra un visiteur apres un scan."
        />
        <PageBody>
          <EmptyState
            title="Rien a previsualiser"
            body="Creez d abord votre profil : l apercu affichera exactement ce que verra un visiteur apres un scan."
            actionHref="/dashboard/profile"
            actionLabel="Creer mon profil"
          />
        </PageBody>
      </>
    );
  }

  const data = await previewProfile(profile.id);

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Apercu"
        description="La page reelle, rendue par les memes composants que apres un scan. Le suivi statistique est desactive ici."
      />
      <PageBody>
        {/* Sur cet ecran, le telephone n illustre pas le propos : il EST le
            propos. Il occupe donc toute la zone de travail, centre. */}
        <div className="flex justify-center">
          <PhoneFrame width={352} height={720}>
            <ThemeRenderer profile={data} preview />
          </PhoneFrame>
        </div>
      </PageBody>
    </>
  );
}
