import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cardUrl } from "@/config/site";
import { CardBatchForm } from "@/components/admin/card-batch-form";
import { CardRowActions } from "@/components/admin/card-actions";
import {
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  Token,
} from "@/components/app/ui";

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

  const counts = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Cartes NFC"
        description="Chaque carte porte un token public aleatoire. L URL generee est ecrite une seule fois en NDEF dans la puce NTAG213, puis relue pour verification."
        stats={[
          { label: "Cartes", value: cards.length, tone: "plain" },
          { label: "Actives", value: counts.ACTIVE ?? 0 },
          { label: "En stock", value: counts.UNASSIGNED ?? 0, tone: "plain" },
          { label: "Suspendues", value: counts.SUSPENDED ?? 0, tone: "plain" },
          { label: "Perdues", value: counts.LOST ?? 0, tone: "plain" },
        ]}
      />
      <PageBody className="space-y-6">
        <CardBatchForm />

        {cards.length === 0 ? (
          <EmptyState
            title="Aucune carte enregistree"
            body="Generez un premier lot ci-dessus : chaque carte recevra un token aleatoire et son URL a encoder."
          />
        ) : (
          <DataTable
            caption="Cartes NFC enregistrees"
            head={
              <>
                <Th>Token</Th>
                <Th>Etat</Th>
                <Th>Profil associe</Th>
                <Th className="text-right">Scans</Th>
                <Th>Lot</Th>
                <Th>Association / etat</Th>
              </>
            }
          >
            {cards.map((card) => (
              <tr key={card.id} className="transition-colors hover:bg-[var(--console-paper)]">
                <Td>
                  {/* L URL complete etait repetee en toutes lettres sur chaque
                      ligne : douze fois le meme prefixe, pour une seule partie
                      qui change. On montre le token, l URL passe en second. */}
                  <Token>{card.publicToken}</Token>
                  <span className="mt-1 block font-[family-name:var(--font-mono)] text-[0.68rem] text-[var(--muted)]">
                    {cardUrl(card.publicToken).replace(/^https?:\/\//, "")}
                  </span>
                </Td>
                <Td>
                  <StatusBadge status={card.status} />
                </Td>
                <Td className="max-w-[13rem] truncate">
                  {card.assignedProfile?.displayName ?? (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </Td>
                <Td className="text-right font-[family-name:var(--font-mono)] text-[0.82rem] tabular-nums">
                  {card._count.scans}
                </Td>
                <Td className="text-[0.78rem] text-[var(--muted)]">{card.batch ?? "—"}</Td>
                <Td>
                  <CardRowActions
                    cardId={card.id}
                    status={card.status}
                    assignedProfileId={card.assignedProfileId}
                    profiles={profileOptions}
                  />
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </PageBody>
    </>
  );
}
