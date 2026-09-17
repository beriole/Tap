import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseRsvpSettings } from "@/lib/events/rsvp";
import { utcToWallTime } from "@/lib/events/time";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { RsvpConfig } from "@/components/events/rsvp-config";

export const metadata: Metadata = { title: "Formulaire de reponse" };

/** Reglages, menus et questions du RSVP. Permission "design". */
export default async function EventRsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs } = await eventPageContext(id, "design");

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: {
      title: true,
      timezone: true,
      rsvpSettings: true,
      meals: { orderBy: { position: "asc" }, select: { id: true, label: true, description: true, forChildren: true, _count: { select: { preferences: true } } } },
      questions: {
        orderBy: { position: "asc" },
        select: { id: true, type: true, label: true, options: true, required: true, perGuest: true, _count: { select: { answers: true } } },
      },
      _count: { select: { groups: { where: { invitation: { response: { status: { not: "PENDING" } } } } } } },
    },
  });
  const settings = parseRsvpSettings(event.rsvpSettings);

  return (
    <>
      <PageHeader eyebrow={event.title} title="Formulaire de reponse" description="Ce que vos invites renseignent en repondant. Plus c est court, plus ils repondent.">
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <RsvpConfig
          eventId={id}
          responded={event._count.groups}
          settings={{
            allowMaybe: settings.allowMaybe,
            allowEdit: settings.allowEdit,
            deadline: settings.deadline ? utcToWallTime(new Date(settings.deadline), event.timezone) : "",
          }}
          meals={event.meals.map((m) => ({ id: m.id, label: m.label, description: m.description ?? "", forChildren: m.forChildren, used: m._count.preferences }))}
          questions={event.questions.map((q) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            options: Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string").join("\n") : "",
            required: q.required,
            perGuest: q.perGuest,
            used: q._count.answers,
          }))}
        />
      </PageBody>
    </>
  );
}
