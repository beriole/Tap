import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkEventAccess } from "@/server/events/access-control";
import { loadPreviewInvitation } from "@/server/events/invitation-view";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Apercu d une invitation, charge en iframe par le studio de design.
 *
 * Iframe plutot que rendu direct : le theme s y affiche a la vraie largeur
 * d un telephone, avec ses propres media queries et sa propre hauteur
 * d ecran - un apercu reduit par CSS mentirait sur le premier ecran.
 *
 * Les reglages passes en parametres sont ESSAYES, pas enregistres, et filtres
 * contre le catalogue (resolveThemeSettings) : une valeur inconnue retombe
 * sur celle du theme.
 */
export default async function InvitationPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ variant?: string; accent?: string; countdown?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { eventId } = await params;
  if (!(await checkEventAccess(eventId, "view"))) notFound();

  const q = await searchParams;
  const tried = Object.fromEntries(
    Object.entries({
      variant: q.variant,
      accent: q.accent,
      countdown: q.countdown === undefined ? undefined : q.countdown === "1",
    }).filter(([, v]) => v !== undefined),
  );

  const saved = await loadPreviewInvitation(eventId);
  const view = Object.keys(tried).length
    ? await loadPreviewInvitation(eventId, { settings: { ...saved.theme.settings, ...tried } })
    : saved;

  return <InvitationRenderer view={view} />;
}
