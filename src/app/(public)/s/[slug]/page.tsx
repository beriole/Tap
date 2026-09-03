import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { ThemeRenderer } from "@/components/themes/theme-renderer";
import { resolveShareLink } from "@/server/share-links";

type Props = { params: Promise<{ slug: string }> };

/**
 * Vue restreinte d un profil.
 *
 * Meme rendu que /c/[token], mais derriere un masque : seuls les champs et les
 * liens choisis par le client sortent. La page n est jamais indexee - elle a
 * ete creee pour etre donnee a quelqu un, pas pour etre trouvee.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveShareLink(slug);

  if (!result.ok) {
    return { title: "Lien indisponible", robots: { index: false, follow: false } };
  }

  const { identity } = result.profile;
  return {
    title: [identity.displayName, identity.title].filter(Boolean).join(" - "),
    description: identity.tagline ?? `Coordonnees de ${identity.displayName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const result = await resolveShareLink(slug);

  if (!result.ok) {
    if (result.reason === "NOT_FOUND") notFound();
    redirect(`/card-unavailable?reason=${result.reason.toLowerCase()}`);
  }

  // Le comptage se fait APRES la reponse : il ne retarde pas l affichage.
  // Un increment atomique, pour ne pas ecraser un partage consulte par
  // plusieurs personnes en meme temps.
  const shareId = result.shareId;
  after(async () => {
    await prisma.shareLink
      .update({ where: { id: shareId }, data: { views: { increment: 1 } } })
      .catch(() => {
        /* un compteur rate ne doit jamais casser une page deja servie */
      });
  });

  return <ThemeRenderer profile={result.profile} />;
}
