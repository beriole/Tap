import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getProfileStats } from "@/server/stats";
import { DailyBars } from "@/components/app/figures";
import {
  EmptyState,
  PageBody,
  PageHeader,
  SectionTitle,
  Surface,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Statistiques" };

/**
 * §15 - metriques simples : scans, clics par action, liens les plus utilises.
 *
 * Les actions etaient affichees telles qu elles sont stockees - WHATSAPP,
 * VCARD, COPY_LINK - c est-a-dire le vocabulaire du schema, en capitales et en
 * anglais, livre au client. On traduit ici, au seul endroit qui les montre.
 */
const ACTIONS: Record<string, string> = {
  LINK: "Ouverture d'un lien",
  CALL: "Appel",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VCARD: "Contact enregistre",
  SHARE: "Partage",
  COPY_LINK: "Adresse copiee",
  QR: "QR Code",
  DIRECTIONS: "Itineraire",
};

export default async function StatsPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow="Espace client"
          title="Statistiques"
          description="Les scans et les clics apparaitront ici des que votre carte sera en circulation."
        />
        <PageBody>
          <EmptyState
            title="Aucune statistique"
            body="Les scans et les clics apparaitront ici des que votre carte sera en circulation."
            actionHref="/dashboard/profile"
            actionLabel="Creer mon profil"
          />
        </PageBody>
      </>
    );
  }

  const stats = await getProfileStats(profile.id, 30);
  const totalClicks = stats.clicksByAction.reduce((sum, r) => sum + r.count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title="Statistiques"
        description="Donnees agregees sur 30 jours. Ni adresse IP, ni identifiant de visiteur ne sont conserves."
        stats={[
          {
            label: "Scans",
            value: stats.totalScans,
            hint: "depuis le debut",
            trend: stats.daily.map((d) => d.scans),
          },
          { label: "7 jours", value: stats.scans7d, tone: "plain" },
          { label: "30 jours", value: stats.scans30d, tone: "plain" },
          { label: "Actions", value: totalClicks, hint: "clics sur 30 jours", tone: "plain" },
        ]}
      />

      <PageBody className="space-y-6">
        <Surface>
          <SectionTitle hint="30 derniers jours">Evolution quotidienne</SectionTitle>
          <DailyBars data={stats.daily} />
        </Surface>

        <div className="grid gap-6 md:grid-cols-2">
          <Surface>
            <SectionTitle hint={totalClicks > 0 ? `${totalClicks} au total` : undefined}>
              Ce que font les visiteurs
            </SectionTitle>
            {stats.clicksByAction.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2.5">
                {[...stats.clicksByAction]
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <Bar
                      key={row.action}
                      label={ACTIONS[row.action] ?? row.action}
                      value={row.count}
                      max={totalClicks}
                    />
                  ))}
              </ul>
            )}
          </Surface>

          <Surface>
            <SectionTitle>Liens les plus utilises</SectionTitle>
            {stats.topLinks.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2.5">
                {stats.topLinks.map((row) => (
                  <Bar
                    key={row.linkId}
                    label={row.label}
                    value={row.count}
                    max={stats.topLinks[0]?.count ?? 1}
                  />
                ))}
              </ul>
            )}
          </Surface>
        </div>
      </PageBody>
    </>
  );
}

/**
 * Ligne de classement avec sa barre.
 *
 * Une liste de nombres alignes a droite oblige a comparer mentalement ; la
 * barre donne le rapport avant meme d avoir lu les chiffres.
 */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4 text-[0.84rem]">
        <span className="min-w-0 truncate">{label}</span>
        <span className="font-[family-name:var(--font-mono)] text-[0.8rem] tabular-nums text-[var(--muted)]">
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--console-paper)]">
        <div
          className="h-full rounded-full bg-[var(--brand-copper)] transition-[width] duration-700"
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </li>
  );
}

function Empty() {
  return (
    <p className="text-[0.85rem] text-[var(--muted)]">
      Aucune donnee sur la periode. Les chiffres apparaitront des le premier scan.
    </p>
  );
}
