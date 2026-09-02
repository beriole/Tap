import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ClientRowActions, CreateClientForm } from "@/components/admin/client-actions";
import { PageHeader } from "@/components/app/ui";

export const metadata: Metadata = { title: "Clients" };

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

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Clients"
        description="Creez un compte apres l achat d une carte, suspendez un acces ou renvoyez un lien d activation."
      />

      <CreateClientForm />

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Profil</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Liens</th>
              <th className="px-4 py-3">Cree le</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.profiles[0]?.displayName ?? "-"}</td>
                <td className="px-4 py-3">{user.status}</td>
                <td className="px-4 py-3 tabular-nums">{user.profiles[0]?._count.links ?? 0}</td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {user.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <ClientRowActions
                    client={{ id: user.id, email: user.email, status: user.status }}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--muted)]">
                  Aucun client pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
