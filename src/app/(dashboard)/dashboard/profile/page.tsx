import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { PageBody, PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Editeur de profil" };

/** §5.2 - Editeur : identite, contact, adresse, presentation, visibilite. */
export default async function ProfileEditorPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({ where: { userId: user.id } });

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Profil"
        description="Identite, coordonnees, adresse et visibilite. Les modifications sont visibles immediatement apres publication."
      />
      <PageBody>
        <ProfileEditor profile={profile} />
      </PageBody>
    </>
  );
}
