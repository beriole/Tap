import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildInvitationView } from "@/lib/events/invitation-view";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";
import { BENCH_CASES } from "./fixtures";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Banc d essai des themes d invitation : /preview/invitation/banc?case=long&variant=nuit
 *
 * Rendu des cas limites avec des donnees fabriquees. Joue par
 * scripts/audit-invitations.mjs aux cinq largeurs du cahier (360 a 430 px),
 * pour chaque variante : aucun debordement horizontal toléré.
 *
 * Reserve aux comptes connectes : rien de sensible ici, mais une page de test
 * n a pas a etre publique.
 */
export default async function InvitationBenchPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string; variant?: string; accent?: string; theme?: string; enveloppe?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const q = await searchParams;
  const bench = BENCH_CASES[q.case ?? "reference"];
  if (!bench) notFound();

  const view = buildInvitationView(bench.event, bench.guest, {
    preview: true,
    // Date figee : le compte a rebours et la cloture ne changent pas d un jour a l autre.
    now: new Date("2026-09-17T10:00:00Z"),
    envelope: q.enveloppe === "1",
    themeOverride: { key: q.theme, settings: { variant: q.variant, accent: q.accent } },
  });
  return <InvitationRenderer view={view} />;
}
