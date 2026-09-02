import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ClientRowActions, CreateClientForm } from "@/components/admin/client-actions";
import { initials } from "@/lib/utils";
import {
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Clients" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** §16 - Clients : creer, rechercher, suspendre, reinitialiser acces, ouvrir le profil. */
export default async function AdminClientsPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      profiles: {
        select: { id: true, displayName: true, isPublished: true, _count: { select: { links: true } } },
      },
    },
  });

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Clients"
        description="Creez un compte apres l achat d une carte, suspendez un acces ou renvoyez un lien d activation."
        stats={[
          { label: "Comptes", value: users.length, tone: "plain" },
          { label: "Actifs", value: counts.ACTIVE ?? 0 },
          { label: "Invites", value: counts.INVITED ?? 0, hint: "activation en attente", tone: "plain" },
          { label: "Suspendus", value: counts.SUSPENDED ?? 0, tone: "plain" },
        ]}
      />
      <PageBody className="space-y-6">
        <CreateClientForm />

        {users.length === 0 ? (
          <EmptyState
            title="Aucun client pour le moment"
            body="Creez un compte apres la vente d une carte : le client recevra un lien d activation a transmettre."
          />
        ) : (
          <DataTable
            caption="Comptes clients"
            head={
              <>
                <Th>Client</Th>
                <Th>Profil</Th>
                <Th>Etat</Th>
                <Th className="text-right">Liens</Th>
                <Th>Inscrit le</Th>
                <Th className="text-right">Actions</Th>
              </>
            }
          >
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-[var(--console-paper)]">
                <Td>
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--console-paper)] text-[0.66rem] font-bold text-[var(--muted)]">
                      {initials(user.profiles[0]?.displayName ?? user.email)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.85rem]">
                        {user.name ?? user.profiles[0]?.displayName ?? "Sans nom"}
                      </span>
                      <span className="block truncate text-[0.74rem] text-[var(--muted)]">
                        {user.email}
                      </span>
                    </span>
                  </span>
                </Td>
                <Td className="max-w-[12rem] truncate">
                  {user.profiles[0]?.displayName ?? <span className="text-[var(--muted)]">—</span>}
                </Td>
                <Td>
                  <StatusBadge status={user.status} kind="account" />
                </Td>
                <Td className="text-right font-[family-name:var(--font-mono)] text-[0.82rem] tabular-nums">
                  {user.profiles[0]?._count.links ?? 0}
                </Td>
                <Td className="text-[0.78rem] text-[var(--muted)]">
                  {dateFmt.format(user.createdAt)}
                </Td>
                <Td className="text-right">
                  <ClientRowActions
                    client={{ id: user.id, email: user.email, status: user.status }}
                  />
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </PageBody>
    </>
  );
}
