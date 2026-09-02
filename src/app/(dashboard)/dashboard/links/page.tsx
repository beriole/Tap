import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LinkManager } from "@/components/dashboard/link-manager";
import { PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Liens" };

/** §5.3 - Gestion dynamique des liens + ordre + visibilite. */
export default async function LinksPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    include: { links: { orderBy: { position: "asc" } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Liens"
        description="Ajoutez, reordonnez et masquez vos liens. Un lien masque reste enregistre, il n apparait simplement plus sur le profil."
      />
      <LinkManager links={profile?.links ?? []} />
    </>
  );
}
