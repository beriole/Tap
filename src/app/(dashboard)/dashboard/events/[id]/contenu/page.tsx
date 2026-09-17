import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { utcToWallTime } from "@/lib/events/time";
import { sectionSchema } from "@/lib/validations/event";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { ContentEditor, type SectionDraft } from "@/components/events/content-editor";

export const metadata: Metadata = { title: "Contenu" };

/** Informations, lieux et sections de la page invite. Permission "design". */
export default async function EventContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs } = await eventPageContext(id, "design");

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: {
      type: true,
      status: true,
      title: true,
      hosts: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      capacity: true,
      venues: { orderBy: { position: "asc" } },
      sections: { orderBy: { position: "asc" } },
    },
  });
  const tz = event.timezone;

  // Une section dont les donnees ne passent plus la validation (schema modifie
  // depuis) est ecartee plutot que de faire planter l ecran entier.
  const sections = event.sections.flatMap((s) => {
    const parsed = sectionSchema.safeParse({ kind: s.kind, title: s.title, isVisible: s.isVisible, data: s.data });
    return parsed.success ? [{ ...parsed.data, title: parsed.data.title ?? "" } as SectionDraft] : [];
  });

  return (
    <>
      <PageHeader eyebrow={event.title} title="Contenu" description="Ce que vos invites liront sur leur invitation.">
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <ContentEditor
          eventId={id}
          published={event.status === "PUBLISHED"}
          info={{
            type: event.type,
            title: event.title,
            hosts: event.hosts,
            startsAt: utcToWallTime(event.startsAt, tz),
            endsAt: event.endsAt ? utcToWallTime(event.endsAt, tz) : "",
            timezone: tz,
            capacity: event.capacity ? String(event.capacity) : "",
          }}
          venues={event.venues.map((v) => ({
            label: v.label,
            name: v.name,
            address: v.address,
            landmark: v.landmark ?? "",
            startsAt: v.startsAt ? utcToWallTime(v.startsAt, tz) : "",
          }))}
          sections={sections}
        />
      </PageBody>
    </>
  );
}
