import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { THEMES } from "@/config/themes";
import { SHARE_FIELDS } from "@/server/share-links";
import { ShareManager, type ShareRow } from "@/components/dashboard/share-manager";
import { EmptyState, PageBody, PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Partages" };

/**
 * Liens de partage restreints.
 *
 * La carte donne tout, une fois pour toutes. Ces liens donnent une part, a la
 * demande - sans jamais dupliquer la moindre donnee : ils ne portent qu un
 * masque et un habillage.
 */
export default async function SharePage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      links: {
        where: { isVisible: true },
        orderBy: { position: "asc" },
        select: { id: true, label: true, type: true },
      },
      shareLinks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow="Espace client"
          title="Partages"
          description="Creez d abord votre profil : un lien restreint en montre une partie choisie."
        />
        <PageBody>
          <EmptyState
            title="Aucun profil"
            body="Les liens de partage exposent une selection de votre profil. Il faut donc en avoir un."
            actionHref="/dashboard/profile"
            actionLabel="Creer mon profil"
          />
        </PageBody>
      </>
    );
  }

  const shares: ShareRow[] = profile.shareLinks.map((s) => ({
    ...s,
    // La carte de visibilite est stockee en JSON : on la remet a plat pour le
    // navigateur, qui n a pas a connaitre la forme de la colonne.
    fields: Object.entries((s.fieldVisibility ?? {}) as Record<string, boolean>)
      .filter(([, v]) => v === true)
      .map(([k]) => k),
  }));

  const views = shares.reduce((n, s) => n + s.views, 0);
  const active = shares.filter((s) => s.isActive).length;

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Liens restreints"
        description="Votre carte donne tout. Un lien restreint ne donne que ce que vous cochez — pratique quand la situation n appelle pas votre profil entier. Vos donnees ne sont jamais dupliquees : corriger votre numero le corrige partout."
        stats={[
          { label: "Liens", value: shares.length, tone: "plain" },
          { label: "Actifs", value: active, tone: "plain" },
          { label: "Ouvertures", value: views },
        ]}
      />

      <PageBody>
        <ShareManager
          shares={shares}
          links={profile.links}
          fields={[...SHARE_FIELDS]}
          themes={THEMES.map((t) => ({ key: t.key, name: t.name }))}
          baseUrl={siteConfig.url}
        />
      </PageBody>
    </>
  );
}
