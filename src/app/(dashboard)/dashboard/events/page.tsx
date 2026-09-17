import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageBody, PageHeader, Pill, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Evenements" };

const TYPES: Record<string, string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Entreprise",
  MEMORIAL: "Hommage",
  OTHER: "Evenement",
};

const STATUSES: Record<string, { label: string; tone: "live" | "warn" | "idle" }> = {
  DRAFT: { label: "Brouillon", tone: "warn" },
  PUBLISHED: { label: "Publie", tone: "live" },
  CLOSED: { label: "Clos", tone: "idle" },
  ARCHIVED: { label: "Archive", tone: "idle" },
};

/**
 * Liste des evenements du compte.
 *
 * On ne liste QUE par appartenance (EventMember) : il n existe aucune requete
 * "tous les evenements" cote organisateur, donc aucun oubli de filtre possible.
 */
export default async function EventsPage() {
  const user = await requireUser();
  const memberships = await prisma.eventMember.findMany({
    where: { userId: user.id },
    orderBy: { event: { startsAt: "asc" } },
    select: {
      role: true,
      event: {
        select: {
          id: true,
          type: true,
          status: true,
          title: true,
          startsAt: true,
          timezone: true,
          _count: { select: { groups: true } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Invitations"
        title="Evenements"
        description="Vos invitations, les reponses de vos invites et l accueil le jour J."
        action={
          <Link
            href="/dashboard/events/new"
            className="tap-target inline-flex items-center rounded-xl bg-[var(--brand-copper)] px-5 text-[0.87rem] font-semibold text-[#231206] transition-transform hover:-translate-y-0.5"
          >
            Nouvel evenement
          </Link>
        }
      />
      <PageBody>
        {memberships.length === 0 ? (
          <EmptyState
            title="Aucun evenement"
            body="Creez votre premier evenement : trois questions, puis vos invites. Les evenements partages avec vous apparaitront aussi ici."
            actionHref="/dashboard/events/new"
            actionLabel="Creer un evenement"
          />
        ) : (
          <ul className="space-y-3">
            {memberships.map(({ role, event }) => {
              const status = STATUSES[event.status] ?? STATUSES.DRAFT!;
              return (
                <li key={event.id}>
                  <Link href={`/dashboard/events/${event.id}`} className="block transition-transform hover:-translate-y-0.5">
                    <Surface className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                          {TYPES[event.type]} ·{" "}
                          {event.startsAt.toLocaleDateString("fr-FR", {
                            dateStyle: "long",
                            timeZone: event.timezone,
                          })}
                        </p>
                        <h2 className="mt-1 truncate font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">
                          {event.title}
                        </h2>
                        <p className="mt-1 text-[0.8rem] text-[var(--muted)]">
                          {event._count.groups} groupe{event._count.groups > 1 ? "s" : ""} invite
                          {event._count.groups > 1 ? "s" : ""}
                          {role === "COORGANIZER" ? " · vous co-organisez" : ""}
                        </p>
                      </div>
                      <Pill tone={status.tone}>{status.label}</Pill>
                    </Surface>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
