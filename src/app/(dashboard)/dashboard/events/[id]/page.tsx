import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/events/names";
import { eventPageContext } from "@/server/events/page-context";
import { loadEventHeadcount } from "@/server/events/headcount";
import { PageBody, PageHeader, SectionTitle, StatTile, Surface } from "@/components/app/ui";
import { AutoRefresh } from "@/components/events/auto-refresh";
import { DashboardTable, type DashboardRow } from "@/components/events/dashboard-table";
import { EventTabs } from "@/components/events/event-tabs";
import { PublishToggle } from "@/components/events/publish-toggle";

export const metadata: Metadata = { title: "Vue d ensemble" };

/**
 * Tableau de bord d un evenement (cahier §9, plan phase 7).
 *
 * "Operationnel avant d etre decoratif" : les chiffres qui changent une
 * decision - attendus, capacite, a relancer - sont dans la bande de titre,
 * visibles sans defiler. Tous les totaux viennent de loadEventHeadcount ;
 * la liste en dessous n additionne rien de son cote.
 *
 * Rafraichi toutes les 10 s quand l onglet est visible (D11).
 */
export default async function EventOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs, can } = await eventPageContext(id, "view");
  const sensitive = can("sensitive");

  const [event, headcount] = await Promise.all([
    prisma.event.findUniqueOrThrow({
      where: { id },
      select: {
        title: true,
        status: true,
        startsAt: true,
        timezone: true,
        meals: { orderBy: { position: "asc" }, select: { id: true, label: true } },
        groups: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            category: true,
            maxSeats: true,
            invitation: {
              select: {
                state: true,
                response: { select: { status: true, message: true, respondedAt: true } },
              },
            },
            guests: {
              orderBy: { position: "asc" },
              select: {
                firstName: true,
                lastName: true,
                attending: true,
                isPlusOne: true,
                preference: { select: { allergies: true, meal: { select: { label: true } } } },
              },
            },
          },
        },
      },
    }),
    loadEventHeadcount(id),
  ]);

  const { people, groups, meals, capacity } = headcount;
  const rate = Math.round(headcount.responseRate * 100);
  const toChase = event.groups.filter((g) => g.invitation && !g.invitation.response && (g.invitation.state === "SHARED" || g.invitation.state === "OPENED")).length;

  const rows: DashboardRow[] = event.groups.map((g) => {
    const status = g.invitation?.response?.status ?? "PENDING";
    const present = status === "ATTENDING" ? g.guests.filter((x) => x.attending === true) : [];
    return {
      groupId: g.id,
      name: g.name,
      category: g.category,
      seats: g.maxSeats,
      people: g.guests.filter((x) => !(x.isPlusOne && x.attending === false)).map((x) => displayName(x, "Accompagnant")),
      presentCount: present.length,
      state: g.invitation?.state ?? "CREATED",
      status,
      meals: Object.entries(
        present.reduce<Record<string, number>>((acc, x) => {
          const label = x.preference?.meal?.label ?? "Sans choix";
          acc[label] = (acc[label] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([label, n]) => (n > 1 ? `${n} × ${label}` : label)),
      hasAllergies: present.some((x) => Boolean(x.preference?.allergies?.trim())),
      // Le mot des invites est un message aux hotes : lisible par l equipe, pas une donnee sensible.
      message: g.invitation?.response?.message ?? null,
      respondedAt: g.invitation?.response?.respondedAt
        ? g.invitation.response.respondedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: event.timezone })
        : null,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={event.startsAt.toLocaleDateString("fr-FR", { dateStyle: "full", timeZone: event.timezone })}
        title={event.title}
        action={can("design") ? <PublishToggle eventId={id} published={event.status === "PUBLISHED"} /> : undefined}
        stats={[
          { label: "Attendus", value: people.expected, figure: "expected", hint: capacity.limit !== null ? `capacite ${capacity.limit}` : `sur ${people.invitedSeats} places proposees` },
          { label: "Reponses", value: rate, figure: "rate", hint: `% · ${groups.responded} groupes sur ${groups.total}`, tone: "plain" },
          { label: "A relancer", value: toChase, hint: `${groups.pending - toChase} pas encore envoyees`, tone: toChase > 0 ? "copper" : "plain" },
          { label: "Absents", value: people.declined, figure: "declined", tone: "plain" },
          { label: "Entrees", value: people.checkedIn, figure: "checkedIn", hint: "le jour J", tone: "plain" },
        ]}
      >
        <EventTabs eventId={id} allowed={tabs} />
        <div className="mt-3">
          <AutoRefresh eventId={id} seconds={10} />
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        {(capacity.exceeded || groups.overQuota > 0) && (
          <Surface className="border-[var(--state-stop)]/40">
            <SectionTitle>Attention</SectionTitle>
            {capacity.exceeded && (
              <p className="text-[0.92rem] text-[var(--state-stop)]">
                <strong>Capacite depassee</strong> : {people.expected - capacity.limit!} personne(s) de trop pour {capacity.limit} places.
              </p>
            )}
            {groups.overQuota > 0 && (
              <p className="mt-1 text-[0.88rem] text-[var(--state-warn)]">{groups.overQuota} groupe(s) depassent leur quota.</p>
            )}
          </Surface>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Adultes" value={people.adults} />
          <StatTile label="Enfants" value={people.children} />
          <StatTile label="Bebes" value={people.babies} />
          <StatTile label="Accompagnants" value={people.plusOnes} hint="+1 inclus dans les attendus" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Surface>
            <SectionTitle hint={`${people.expected} attendus`}>Repas</SectionTitle>
            <ul className="space-y-2 text-[0.9rem]">
              {event.meals.map((meal) => (
                <li key={meal.id} className="flex justify-between gap-3">
                  <span>{meal.label}</span>
                  <strong className="tabular-nums">{meals.byOption[meal.id] ?? 0}</strong>
                </li>
              ))}
              <li className="flex justify-between gap-3 text-[var(--muted)]">
                <span>Sans choix</span>
                <span className="tabular-nums">{meals.unassigned}</span>
              </li>
              <li className="flex justify-between gap-3 text-[var(--muted)]">
                <span>Allergies signalees{sensitive ? "" : " (detail reserve)"}</span>
                <span className="tabular-nums">{meals.withAllergies}</span>
              </li>
            </ul>
          </Surface>

          <Surface>
            <SectionTitle hint={`${groups.total} groupes`}>Capacite et invitations</SectionTitle>
            <ul className="space-y-2 text-[0.9rem]">
              {capacity.limit !== null && (
                <li className="flex justify-between gap-3">
                  <span>Places restantes</span>
                  <strong className={`tabular-nums ${capacity.exceeded ? "text-[var(--state-stop)]" : ""}`}>{capacity.remaining}</strong>
                </li>
              )}
              {people.maybe > 0 && (
                <li className="flex justify-between gap-3 text-[var(--muted)]">
                  <span>Au pire, avec les « peut-etre »</span>
                  <span className="tabular-nums">{capacity.upperBound}</span>
                </li>
              )}
              {[
                ["Creees", groups.withInvitation],
                ["Envoyees", groups.shared],
                ["Ouvertes", groups.opened],
                ["Repondues", groups.responded],
              ].map(([label, value]) => (
                <li key={label} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <strong className="tabular-nums">{value}</strong>
                </li>
              ))}
            </ul>
          </Surface>
        </div>

        <DashboardTable eventId={id} rows={rows} canExport={can("exports")} canShare={can("messages")} />
      </PageBody>
    </>
  );
}
