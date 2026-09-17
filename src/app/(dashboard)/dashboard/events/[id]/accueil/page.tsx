import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { eventPageContext } from "@/server/events/page-context";
import { loadEventHeadcount } from "@/server/events/headcount";
import { PageBody, PageHeader, SectionTitle, StatTile, Surface } from "@/components/app/ui";
import { AutoRefresh } from "@/components/events/auto-refresh";
import { EventTabs } from "@/components/events/event-tabs";
import { StationsManager, type StationRow } from "@/components/events/stations-manager";

export const metadata: Metadata = { title: "Accueil" };

/**
 * Jour J (cahier §9 "Jour J", §10) : postes d accueil, entrees, capacite
 * restante, dernieres arrivees. Permission "checkin".
 */
export default async function EventCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs, can } = await eventPageContext(id, "checkin");

  const [event, headcount, recent, groupsIn] = await Promise.all([
    prisma.event.findUniqueOrThrow({
      where: { id },
      select: {
        title: true,
        timezone: true,
        stations: { orderBy: { createdAt: "asc" }, select: { id: true, label: true, token: true, createdAt: true, revokedAt: true, _count: { select: { checkIns: true } } } },
      },
    }),
    loadEventHeadcount(id),
    prisma.checkIn.findMany({
      where: { ticket: { invitation: { group: { eventId: id } } } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, createdAt: true, quantity: true, operatorName: true, method: true, override: true, station: { select: { label: true } }, ticket: { select: { seats: true, seatsUsed: true, invitation: { select: { group: { select: { name: true } } } } } } },
    }),
    prisma.ticket.count({ where: { invitation: { group: { eventId: id } }, seatsUsed: { gt: 0 } } }),
  ]);

  const stations: StationRow[] = event.stations.map((s) => ({
    id: s.id,
    label: s.label,
    link: `${siteConfig.url}/accueil/${s.token}`,
    createdAt: s.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: event.timezone }),
    revoked: Boolean(s.revokedAt),
    entries: s._count.checkIns,
  }));
  const overrides = recent.filter((c) => c.override).length;

  return (
    <>
      <PageHeader
        eyebrow={event.title}
        title="Accueil"
        description="Les postes d accueil scannent le QR de chaque groupe ou cherchent par nom. Chaque entree est horodatee et signee."
        stats={[
          { label: "Entres", value: headcount.people.checkedIn, figure: "checkedIn", hint: `sur ${headcount.people.expected} attendus` },
          { label: "Restants", value: Math.max(0, headcount.people.expected - headcount.people.checkedIn), hint: "encore attendus", tone: "plain" },
          { label: "Groupes entres", value: groupsIn, hint: `sur ${headcount.groups.attending} attendus`, tone: "plain" },
          { label: "Forcees", value: overrides, hint: "au-dela des places", tone: overrides > 0 ? "copper" : "plain" },
        ]}
      >
        <EventTabs eventId={id} allowed={tabs} />
        <div className="mt-3">
          <AutoRefresh eventId={id} seconds={10} />
        </div>
      </PageHeader>
      <PageBody className="space-y-6">
        <Surface>
          <SectionTitle hint="les 15 plus recentes">Dernieres entrees</SectionTitle>
          {recent.length === 0 ? (
            <p className="text-[0.86rem] text-[var(--muted)]">Aucune entree pour l instant. Elles apparaitront ici des le premier scan.</p>
          ) : (
            <ul className="divide-y divide-[var(--console-hairline)] text-[0.88rem]">
              {recent.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{c.ticket.invitation.group.name}</span>
                    <span className="text-[var(--muted)]">
                      {" "}· {c.quantity} personne{c.quantity > 1 ? "s" : ""} ({c.ticket.seatsUsed}/{c.ticket.seats}){c.override ? " · forcee" : ""}
                    </span>
                  </span>
                  <span className="text-[0.76rem] text-[var(--muted)]">
                    {c.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: event.timezone })} · {c.operatorName}
                    {c.station ? ` · ${c.station.label}` : ""} · {c.method === "QR" ? "QR" : "manuel"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Attendus" value={headcount.people.expected} />
          <StatTile label="Adultes" value={headcount.people.adults} />
          <StatTile label="Enfants" value={headcount.people.children} />
          <StatTile label="Capacite" value={headcount.capacity.limit ?? "—"} hint={headcount.capacity.limit !== null ? `${headcount.capacity.remaining} place(s) libre(s)` : "non renseignee"} />
        </div>

        <StationsManager eventId={id} stations={stations} canCreate={can("checkin")} />
      </PageBody>
    </>
  );
}
