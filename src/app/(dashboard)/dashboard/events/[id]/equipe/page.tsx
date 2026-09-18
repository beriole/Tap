import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { eventPageContext } from "@/server/events/page-context";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventTabs } from "@/components/events/event-tabs";
import { TeamManager, type MemberRow } from "@/components/events/team-manager";

export const metadata: Metadata = { title: "Equipe" };

/** Co-organisateurs (D5). Lecture pour tous les membres ; gestion par le proprietaire. */
export default async function EventTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tabs, can } = await eventPageContext(id, "view");

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: {
      title: true,
      members: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true, role: true, permissions: true, user: { select: { name: true, email: true, status: true } } },
      },
    },
  });
  const members: MemberRow[] = event.members.map((m) => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    pending: m.user.status === "INVITED",
    permissions: m.permissions,
  }));

  return (
    <>
      <PageHeader eyebrow={event.title} title="Equipe" description="Qui peut faire quoi sur cet evenement. Chaque personne a son propre compte.">
        <EventTabs eventId={id} allowed={tabs} />
      </PageHeader>
      <PageBody>
        <TeamManager eventId={id} members={members} canManage={can("team")} />
      </PageBody>
    </>
  );
}
