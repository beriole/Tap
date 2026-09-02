import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cardUrl } from "@/config/site";
import { CardBatchForm } from "@/components/admin/card-batch-form";
import { CardRowActions } from "@/components/admin/card-actions";
import { PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Cartes NFC" };

/** §16 - Cartes NFC : creer lot, token, statut, association, remplacement, historique. */
export default async function AdminCardsPage() {
  await requireAdmin();

  // Liste des profils proposables a l association (§11 : geste admin only).
  const profiles = await prisma.profile.findMany({
    orderBy: { displayName: "asc" },
    take: 500,
    select: { id: true, displayName: true, user: { select: { email: true } } },
  });
  const profileOptions = profiles.map((p) => ({
    id: p.id,
    label: `${p.displayName} (${p.user.email})`,
  }));

  const cards = await prisma.nfcCard.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      assignedProfile: { select: { displayName: true } },
      _count: { select: { scans: true } },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Cartes NFC"
        description="Chaque carte porte un token public aleatoire. L URL generee est ecrite une seule fois en NDEF dans la puce NTAG213, puis relue pour verification."
      />

      <CardBatchForm />

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">URL a encoder</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Profil associe</th>
              <th className="px-4 py-3">Scans</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Association / etat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {cards.map((card) => (
              <tr key={card.id}>
                <td className="px-4 py-3 font-mono">{card.publicToken}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                  {cardUrl(card.publicToken)}
                </td>
                <td className="px-4 py-3">{card.status}</td>
                <td className="px-4 py-3">{card.assignedProfile?.displayName ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums">{card._count.scans}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{card.batch ?? "-"}</td>
                <td className="px-4 py-3">
                  <CardRowActions
                    cardId={card.id}
                    status={card.status}
                    assignedProfileId={card.assignedProfileId}
                    profiles={profileOptions}
                  />
                </td>
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--muted)]">
                  Aucune carte enregistree.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
