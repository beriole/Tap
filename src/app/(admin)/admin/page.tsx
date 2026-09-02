import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getPlatformStats } from "@/server/stats";

export const metadata: Metadata = { title: "Administration" };

/** §16 - Dashboard : clients, cartes actives/non attribuees, scans, nouveaux comptes. */
export default async function AdminDashboard() {
  await requireAdmin();
  const stats = await getPlatformStats();

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Clients" value={stats.clients} />
        <Stat label="Cartes actives" value={stats.activeCards} />
        <Stat label="Cartes non attribuees" value={stats.unassignedCards} />
        <Stat label="Scans (30 j)" value={stats.scans30d} />
        <Stat label="Nouveaux comptes (30 j)" value={stats.newAccounts30d} />
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
