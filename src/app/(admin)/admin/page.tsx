import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview, getPlatformStats } from "@/server/stats";
import { DailyBars } from "@/components/app/figures";
import {
  PageBody,
  PageHeader,
  SectionTitle,
  StatusBadge,
  Surface,
  Token,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Administration" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/**
 * §16 - Vue d ensemble de la plateforme.
 *
 * L ancienne version alignait cinq nombres en haut d une page vide aux deux
 * tiers : elle disait combien de choses existaient, jamais ce qu il fallait
 * faire. Trois questions structurent desormais l ecran :
 *   1. ou en est l activite (la bande, avec sa courbe) ;
 *   2. qu est-ce qui demande une intervention (les alertes, en premier) ;
 *   3. que s est-il passe recemment (les arrivees).
 */
export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, overview] = await Promise.all([getPlatformStats(), getAdminOverview()]);

  const alerts = [
    {
      count: overview.attention.invited,
      label: "compte invite sans activation",
      plural: "comptes invites sans activation",
      href: "/admin/clients",
      tone: "warn" as const,
    },
    {
      count: overview.attention.unlinked,
      label: "client actif sans carte",
      plural: "clients actifs sans carte",
      href: "/admin/clients",
      tone: "warn" as const,
    },
    {
      count: overview.attention.lost,
      label: "carte declaree perdue",
      plural: "cartes declarees perdues",
      href: "/admin/cards",
      tone: "stop" as const,
    },
    {
      count: overview.attention.suspended,
      label: "carte suspendue",
      plural: "cartes suspendues",
      href: "/admin/cards",
      tone: "warn" as const,
    },
  ].filter((a) => a.count > 0);

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
        title="Vue d'ensemble"
        description="L'etat de la plateforme en un ecran : ce qui tourne, ce qui attend une intervention, ce qui vient d'arriver."
        action={
          <Link
            href="/admin/cards"
            className="tap-target rounded-xl bg-[var(--brand-copper)] px-5 text-[0.87rem] font-semibold text-[#231206] transition-transform hover:-translate-y-0.5"
          >
            <CreditCard className="size-4" />
            Creer un lot de cartes
          </Link>
        }
        stats={[
          { label: "Clients", value: stats.clients, tone: "plain" },
          { label: "Cartes actives", value: stats.activeCards, tone: "plain" },
          { label: "Cartes en stock", value: stats.unassignedCards, tone: "plain" },
          { label: "Scans · 30 j", value: stats.scans30d, trend: overview.trend },
          { label: "Nouveaux comptes", value: stats.newAccounts30d, hint: "30 derniers jours", tone: "plain" },
        ]}
      />

      <PageBody className="space-y-6">
        {alerts.length > 0 && (
          <section>
            <SectionTitle hint="A traiter">Demande votre attention</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {alerts.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--console-hairline)] bg-[var(--console-card)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-copper)]/40"
                >
                  <span
                    className="console-figure text-[1.8rem]"
                    style={{
                      color: a.tone === "stop" ? "var(--state-stop)" : "var(--state-warn)",
                    }}
                  >
                    {a.count}
                  </span>
                  <span className="flex-1 text-[0.82rem] leading-snug text-[var(--muted)]">
                    {a.count > 1 ? a.plural : a.label}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Surface>
            <SectionTitle hint="30 derniers jours">Scans par jour</SectionTitle>
            <DailyBars data={daily} />
          </Surface>

          <Surface>
            <SectionTitle hint="Depuis le debut">Profils les plus scannes</SectionTitle>
            {overview.topProfiles.length === 0 ? (
              <p className="text-[0.85rem] text-[var(--muted)]">
                Aucune carte n&apos;a encore ete scannee.
              </p>
            ) : (
              <ol className="space-y-3">
                {overview.topProfiles.map((p, i) => (
                  <li key={p.token ?? p.name} className="flex items-center gap-3">
                    <span className="w-4 font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--muted)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.86rem]">{p.name}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[0.8rem] font-medium tabular-nums">
                      {p.scans}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Surface>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Surface>
            <SectionTitle
              hint={
                <Link href="/admin/cards" className="hover:underline">
                  Tout voir
                </Link>
              }
            >
              Dernieres cartes
            </SectionTitle>
            <ul className="divide-y divide-[var(--console-hairline)]">
              {overview.recentCards.map((c) => (
                <li key={c.token} className="flex items-center gap-3 py-2.5">
                  <Token>{c.token}</Token>
                  <span className="min-w-0 flex-1 truncate text-[0.82rem] text-[var(--muted)]">
                    {c.owner ?? c.label ?? "Non attribuee"}
                  </span>
                  <StatusBadge status={c.status} />
                  <span className="hidden w-16 shrink-0 text-right text-[0.72rem] text-[var(--muted)] sm:block">
                    {dateFmt.format(c.at)}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface>
            <SectionTitle
              hint={
                <Link href="/admin/clients" className="hover:underline">
                  Tout voir
                </Link>
              }
            >
              Derniers clients
            </SectionTitle>
            <ul className="divide-y divide-[var(--console-hairline)]">
              {overview.recentClients.map((u) => (
                <li key={u.email} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--console-paper)] text-[0.68rem] font-semibold text-[var(--muted)]">
                    <Users className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.85rem]">{u.name ?? "Sans nom"}</span>
                    <span className="block truncate text-[0.74rem] text-[var(--muted)]">
                      {u.email}
                    </span>
                  </span>
                  <StatusBadge status={u.status} kind="account" />
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      </PageBody>
    </>
  );
}
