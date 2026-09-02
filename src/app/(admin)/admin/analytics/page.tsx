import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getPlatformStats } from "@/server/stats";

export const metadata: Metadata = { title: "Analytics" };

/** §16 - Analytics : vue globale et par carte/profil. */
export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const stats = await getPlatformStats();

  const topCards = await prisma.nfcCard.findMany({
    orderBy: { scans: { _count: "desc" } },
    take: 15,
    include: {
      assignedProfile: { select: { displayName: true } },
      _count: { select: { scans: true } },
    },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Scans (30 j)" value={stats.scans30d} />
        <Stat label="Cartes actives" value={stats.activeCards} />
        <Stat label="Cartes libres" value={stats.unassignedCards} />
        <Stat label="Clients" value={stats.clients} />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Carte</th>
              <th className="px-4 py-3">Profil</th>
              <th className="px-4 py-3">Scans</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {topCards.map((card) => (
              <tr key={card.id}>
                <td className="px-4 py-3 font-mono">{card.publicToken}</td>
                <td className="px-4 py-3">{card.assignedProfile?.displayName ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums">{card._count.scans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
