import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { eventPlan } from "@/config/event-plans";
import { getInvitationTheme, resolveThemeSettings } from "@/config/invitation-themes";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { DesignStudio } from "@/components/events/design-studio";

export const metadata: Metadata = { title: "Design" };

/** Theme, variante, accent, photo. Permission "design". */
export default async function EventDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs } = await eventPageContext(id, "design");
  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: { title: true, plan: true, themeKey: true, themeSettings: true, heroImageUrl: true },
  });
  const theme = getInvitationTheme(event.themeKey);

  return (
    <>
      <PageHeader eyebrow={event.title} title="Design" description="Le theme et ses reglages ; vos donnees restent les memes quel que soit le choix.">
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <DesignStudio
          eventId={id}
          themeKey={theme.key}
          settings={resolveThemeSettings(theme.key, event.themeSettings)}
          heroImageUrl={event.heroImageUrl}
          allowedThemes={eventPlan(event.plan).themeKeys}
        />
      </PageBody>
    </>
  );
}
