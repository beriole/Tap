import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/server/events/access-control";
import { loadEventHeadcount } from "@/server/events/headcount";
import { PageBody, PageHeader, SectionTitle, StatTile, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Vue d ensemble" };

/**
 * Vue d ensemble d un evenement (§9).
 *
 * Premiere version, volontairement sobre : elle sert a verifier que les
 * totaux sont justes et que l acces est bien cloisonne. Le dashboard complet
 * (filtres, relances, rafraichissement) arrive en phase 7.
 *
 * Tous les chiffres viennent de loadEventHeadcount - aucun calcul ici.
 */
export default async function EventOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireEventAccess(id, "view");

  const [event, headcount] = await Promise.all([
    prisma.event.findUniqueOrThrow({
      where: { id },
      select: {
        title: true,
        startsAt: true,
        timezone: true,
        meals: { orderBy: { position: "asc" }, select: { id: true, label: true } },
      },
    }),
    loadEventHeadcount(id),
  ]);

  const { people, groups, meals, capacity } = headcount;
  const rate = Math.round(headcount.responseRate * 100);

  return (
    <>
      <PageHeader
        eyebrow={event.startsAt.toLocaleDateString("fr-FR", { dateStyle: "full", timeZone: event.timezone })}
        title={event.title}
        stats={[
          { label: "Attendus", value: people.expected, hint: `sur ${people.invitedSeats} places proposees` },
          { label: "Reponses", value: rate, hint: `% · ${groups.responded} groupes sur ${groups.total}`, tone: "plain" },
          { label: "Sans reponse", value: people.noResponse, hint: `${groups.pending} groupes`, tone: "plain" },
          { label: "Absents", value: people.declined, tone: "plain" },
        ]}
      />

      <PageBody className="space-y-6">
        {capacity.limit !== null && (
          <Surface>
            <SectionTitle hint={`capacite du lieu : ${capacity.limit}`}>Capacite</SectionTitle>
            <p className="text-[0.92rem]">
              {capacity.exceeded ? (
                <strong className="text-[var(--state-stop)]">
                  Depassement : {people.expected - capacity.limit} personne(s) de trop.
                </strong>
              ) : (
                <>
                  <strong>{capacity.remaining}</strong> place(s) restante(s).
                </>
              )}
              {people.maybe > 0 && (
                <span className="text-[var(--muted)]">
                  {" "}
                  Au pire, avec les « peut-etre » : {capacity.upperBound} personnes.
                </span>
              )}
            </p>
            {groups.overQuota > 0 && (
              <p className="mt-2 text-[0.85rem] text-[var(--state-warn)]">
                {groups.overQuota} groupe(s) depassent leur quota.
              </p>
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
                <span>Allergies signalees</span>
                <span className="tabular-nums">{meals.withAllergies}</span>
              </li>
            </ul>
          </Surface>

          <Surface>
            <SectionTitle hint={`${groups.total} groupes`}>Invitations</SectionTitle>
            <ul className="space-y-2 text-[0.9rem]">
              {[
                ["Creees", groups.withInvitation],
                ["Partagees", groups.shared],
                ["Ouvertes", groups.opened],
                ["Repondues", groups.responded],
                ["Peut-etre", groups.maybe],
                ["Entrees enregistrees", people.checkedIn],
              ].map(([label, value]) => (
                <li key={label} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <strong className="tabular-nums">{value}</strong>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      </PageBody>
    </>
  );
}
