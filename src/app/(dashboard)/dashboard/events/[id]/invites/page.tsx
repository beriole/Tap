import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/events/phone";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { GuestsManager, type GroupRow } from "@/components/events/guests-manager";

export const metadata: Metadata = { title: "Invites" };

/**
 * Invites d un evenement. Permission "guests".
 *
 * Ce qui part vers le navigateur est choisi champ par champ : ni jeton
 * d invitation (il arrive avec l ecran de partage), ni allergies, et la note
 * interne seulement avec la permission "sensitive" (D12).
 */
export default async function EventGuestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const { can, tabs } = await eventPageContext(id, "guests");
  const sensitive = can("sensitive");

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: {
      title: true,
      defaultCountry: true,
      groups: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          maxSeats: true,
          category: true,
          internalNote: sensitive,
          invitation: { select: { state: true, response: { select: { status: true } } } },
          guests: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneRaw: true,
              phoneE164: true,
              ageCategory: true,
              attending: true,
              isPlusOne: true,
            },
          },
        },
      },
    },
  });

  const groups: GroupRow[] = event.groups.map((g) => ({
    id: g.id,
    name: g.name,
    maxSeats: g.maxSeats,
    category: g.category,
    internalNote: sensitive ? (g.internalNote ?? null) : null,
    invitationState: g.invitation?.state ?? null,
    rsvpStatus: g.invitation?.response?.status ?? "PENDING",
    guests: g.guests.map((guest) => ({ ...guest, phoneDisplay: guest.phoneE164 ? formatPhone(guest.phoneE164) : null })),
  }));

  return (
    <>
      <PageHeader
        eyebrow={event.title}
        title="Invites"
        description={
          nouveau
            ? "Evenement cree. Ajoutez maintenant vos invites : une famille, un couple ou une personne par groupe."
            : "Chaque groupe recoit un lien personnel et repond pour tous ses membres."
        }
      >
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <GuestsManager
          eventId={id}
          defaultCountry={event.defaultCountry}
          groups={groups}
          canEditSensitive={sensitive}
          justCreated={Boolean(nouveau)}
        />
      </PageBody>
    </>
  );
}
