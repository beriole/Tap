import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview, getPlatformStats } from "@/server/stats";
import { cardUrl } from "@/config/site";
import { DailyBars } from "@/components/app/figures";
import {
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  SectionTitle,
  StatusBadge,
  Surface,
  Td,
  Th,
  Token,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Analytics" };

/** §16 - Analytics : vue globale et par carte/profil. */
export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const [stats, overview] = await Promise.all([getPlatformStats(), getAdminOverview()]);

  const topCards = await prisma.nfcCard.findMany({
    orderBy: { scans: { _count: "desc" } },
    take: 15,
    include: {
      assignedProfile: { select: { displayName: true } },
      _count: { select: { scans: true } },
    },
  });

  const scanned = topCards.filter((c) => c._count.scans > 0);
  const best = scanned[0]?._count.scans ?? 1;

  const daily = overview.trend.map((scans, i) => ({
    date: new Date(Date.now() - (overview.trend.length - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10),
    scans,
    clicks: 0,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Analytics"
        description="Ce que produisent les cartes en circulation. Aucune adresse IP ni identifiant de visiteur n'est conserve (§15)."
        stats={[
          { label: "Scans · 30 j", value: stats.scans30d, trend: overview.trend },
          { label: "Cartes actives", value: stats.activeCards, tone: "plain" },
          { label: "Cartes en stock", value: stats.unassignedCards, tone: "plain" },
          { label: "Clients", value: stats.clients, tone: "plain" },
        ]}
      />

      <PageBody className="space-y-6">
        <Surface>
          <SectionTitle hint="30 derniers jours">Scans par jour, toutes cartes</SectionTitle>
          <DailyBars data={daily} />
        </Surface>

        <section>
          <SectionTitle hint="Depuis le debut">Classement des cartes</SectionTitle>
          {scanned.length === 0 ? (
            <EmptyState
              title="Aucun scan enregistre"
              body="Le classement se remplira des la mise en circulation du premier lot."
              actionHref="/admin/cards"
              actionLabel="Voir les cartes"
            />
          ) : (
            <DataTable
              caption="Cartes classees par nombre de scans"
              head={
                <>
                  <Th>Carte</Th>
                  <Th>Profil</Th>
                  <Th>Etat</Th>
                  <Th className="w-[38%]">Scans</Th>
                  <Th className="text-right">Profil public</Th>
                </>
              }
            >
              {scanned.map((card) => (
                <tr key={card.id} className="transition-colors hover:bg-[var(--console-paper)]">
                  <Td>
                    <Token>{card.publicToken}</Token>
                  </Td>
                  <Td className="max-w-[14rem] truncate">
                    {card.assignedProfile?.displayName ?? (
                      <span className="text-[var(--muted)]">Non attribuee</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={card.status} />
                  </Td>
                  <Td>
                    {/* La barre donne le rapport entre cartes avant meme qu on
                        ait lu les nombres ; le chiffre reste pour la precision. */}
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--console-paper)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-copper)]"
                          style={{
                            width: `${Math.max((card._count.scans / best) * 100, 3)}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right font-[family-name:var(--font-mono)] text-[0.8rem] tabular-nums">
                        {card._count.scans}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={cardUrl(card.publicToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.8rem] text-[var(--muted)] transition-colors hover:text-[var(--brand-copper-deep)]"
                    >
                      Ouvrir
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      </PageBody>
    </>
  );
}
