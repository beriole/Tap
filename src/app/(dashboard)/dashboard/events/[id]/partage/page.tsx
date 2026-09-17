import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { formatPhone } from "@/lib/events/phone";
import { dateParts } from "@/lib/events/invitation-view";
import { greetingName } from "@/lib/events/share";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { ShareCenter, type ShareRow } from "@/components/events/share-center";

export const metadata: Metadata = { title: "Partage" };

/**
 * Partage des invitations. Permission "messages".
 *
 * C est le SEUL ecran organisateur qui recoit les jetons d invitation : ils
 * sont necessaires pour composer les liens. Un co-organisateur charge des
 * invites ou de l accueil ne les recoit pas.
 */
export default async function EventSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs } = await eventPageContext(id, "messages");

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: {
      title: true,
      hosts: true,
      startsAt: true,
      timezone: true,
      status: true,
      shareTemplate: true,
      groups: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          guests: { orderBy: { position: "asc" }, select: { firstName: true, phoneE164: true, isPlusOne: true } },
          invitation: { select: { token: true, state: true, response: { select: { status: true } } } },
        },
      },
    },
  });

  const rows: ShareRow[] = event.groups.flatMap((g) => {
    if (!g.invitation) return [];
    const members = g.guests.filter((x) => !x.isPlusOne);
    const phone = members.find((x) => x.phoneE164)?.phoneE164 ?? null;
    return [
      {
        groupId: g.id,
        name: g.name,
        greeting: greetingName(g.name, members.map((x) => x.firstName ?? "")),
        phoneE164: phone,
        phoneDisplay: phone ? formatPhone(phone) : null,
        state: g.invitation.state,
        rsvpStatus: g.invitation.response?.status ?? "PENDING",
        link: `${siteConfig.url}/i/${g.invitation.token}`,
      },
    ];
  });

  return (
    <>
      <PageHeader
        eyebrow={event.title}
        title="Partage"
        description={
          event.status === "PUBLISHED"
            ? "Chaque groupe recoit son lien personnel. WhatsApp s ouvre avec le message pret ; vous confirmez l envoi."
            : "L evenement n est pas publie : les liens afficheront une page indisponible tant que vous ne le publiez pas."
        }
      >
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <ShareCenter
          eventId={id}
          rows={rows}
          template={event.shareTemplate}
          vars={{ hotes: event.hosts, titre: event.title, date: dateParts(event.startsAt, event.timezone).long }}
        />
      </PageBody>
    </>
  );
}
