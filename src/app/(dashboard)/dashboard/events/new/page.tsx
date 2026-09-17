import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/app/ui";
import { EventWizard } from "@/components/events/event-wizard";

export const metadata: Metadata = { title: "Nouvel evenement" };

export default async function NewEventPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        eyebrow="Invitations"
        title="Nouvel evenement"
        description="Trois questions pour commencer. Programme, menu, dress code et design se completent ensuite."
      />
      <PageBody>
        <EventWizard />
      </PageBody>
    </>
  );
}
