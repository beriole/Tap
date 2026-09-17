import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isInvitationToken } from "@/lib/events/invitation-access";
import { resolveGuestInvitation } from "@/server/events/guest-invitation";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";
import { OpenBeacon } from "@/components/invitations/open-beacon";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ enveloppe?: string }>;
};

/**
 * Invitation personnelle d un groupe (cahier §6).
 *
 * - Aucun compte : le jeton EST l acces. Il ne sort jamais de cette page :
 *   referrer "no-referrer", pas d indexation, pas de cache partage.
 * - Echec, quelle qu en soit la raison : la meme page neutre (notFound).
 * - Metadonnees d apercu (WhatsApp, SMS) : les hotes et la date, jamais le
 *   nom de l invite - le lien peut etre transfere.
 */

const NEUTRAL: Metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitation = await resolveGuestInvitation(token);
  if (!invitation) return NEUTRAL;

  const { event } = invitation.view;
  const title = `${event.hosts} vous invitent`;
  const description = `${event.title} · ${event.starts.long}`;
  return {
    ...NEUTRAL,
    title,
    description,
    openGraph: { type: "website", title, description, images: event.heroImageUrl ? [{ url: event.heroImageUrl }] : undefined },
    twitter: { card: event.heroImageUrl ? "summary_large_image" : "summary", title, description },
  };
}

export default async function GuestInvitationPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { enveloppe } = await searchParams;

  // Un format invalide ne coute rien et ne consomme pas le quota.
  if (!isInvitationToken(token)) notFound();

  // §19 - limitation sur la resolution des jetons : essayer des jetons au
  // hasard devient impraticable, un invite qui recharge sa page n est pas gene.
  const limit = await rateLimit(`invitation-page:${clientIp(await headers())}`, 60, 60_000);
  if (!limit.allowed) notFound();

  const invitation = await resolveGuestInvitation(token, { replayEnvelope: enveloppe === "1" });
  if (!invitation) notFound();

  return (
    <>
      <InvitationRenderer view={invitation.view} rsvpForm={invitation.rsvpForm} />
      <OpenBeacon token={token} />
    </>
  );
}
