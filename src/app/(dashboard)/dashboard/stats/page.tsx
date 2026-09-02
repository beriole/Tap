import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getProfileStats } from "@/server/stats";
import { EmptyState, PageHeader, SectionTitle, StatTile, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Statistiques" };

/** §15 - metriques simples : scans, clics par action, liens les plus utilises. */
export default async function StatsPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <EmptyState
        title="Aucune statistique"
        body="Les scans et les clics apparaitront ici des que votre carte sera en circulation."
        actionHref="/dashboard/profile"
        actionLabel="Creer mon profil"
      />
    );
  }

  const stats = await getProfileStats(profile.id, 30);
  const peak = Math.max(1, ...stats.daily.map((d) => d.scans));

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Statistiques"
        description="Donnees agregees sur 30 jours. Ni adresse IP, ni identifiant de visiteur ne sont conserves."
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile label="Total" value={stats.totalScans} />
        <StatTile label="7 jours" value={stats.scans7d} tone="accent" />
        <StatTile label="30 jours" value={stats.scans30d} />
      </div>

      <Surface className="mb-5">
        <SectionTitle>Evolution quotidienne</SectionTitle>
        <div className="mt-4 flex h-32 items-end gap-[3px]" role="img" aria-label="Scans par jour">
          {stats.daily.map((day) => (
            <div
              key={day.date}
              title={`${day.date} : ${day.scans} scans`}
              style={{ height: `${(day.scans / peak) * 100}%` }}
              className="min-h-[3px] flex-1 rounded-sm bg-[var(--brand-copper)]"
            />
          ))}
        </div>
      </Surface>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Clics par action">
          {stats.clicksByAction.length === 0 ? (
            <Empty />
          ) : (
            stats.clicksByAction.map((row) => (
              <Row key={row.action} label={row.action} value={row.count} />
            ))
          )}
        </Panel>

        <Panel title="Liens les plus utilises">
          {stats.topLinks.length === 0 ? (
            <Empty />
          ) : (
            stats.topLinks.map((row) => (
              <Row key={row.linkId} label={row.label} value={row.count} />
            ))
          )}
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Surface>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2">{children}</ul>
    </Surface>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-4 text-sm">
      <span className="truncate text-[var(--muted)]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </li>
  );
}

function Empty() {
  return <li className="text-sm text-[var(--muted)]">Aucune donnee sur la periode.</li>;
}
