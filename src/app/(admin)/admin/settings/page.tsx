import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Parametres" };

/** §16 - Parametres : branding, domaine, e-mails, limites, securite, plans futurs. */
export default async function AdminSettingsPage() {
  await requireAdmin();

  const audit = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { email: true } } },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Parametres</h1>

      <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-5">
        <h2 className="text-sm font-medium">Domaine canonique</h2>
        <p className="mt-2 font-mono text-sm text-[var(--muted)]">{siteConfig.url}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Changer ce domaine invalide toutes les URL deja encodees dans les puces. A ne modifier
          qu avant la mise en production.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-5">
        <h2 className="text-sm font-medium">Journal d audit</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {audit.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-4">
              <span className="truncate">
                <span className="font-mono text-xs">{entry.action}</span>{" "}
                <span className="text-[var(--muted)]">{entry.actor?.email ?? "systeme"}</span>
              </span>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </span>
            </li>
          ))}
          {audit.length === 0 && <li className="text-[var(--muted)]">Aucune operation enregistree.</li>}
        </ul>
      </div>
    </section>
  );
}
