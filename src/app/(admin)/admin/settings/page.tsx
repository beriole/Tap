import type { Metadata } from "next";
import { AlertTriangle, Globe } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { PageBody, PageHeader, SectionTitle, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Parametres" };

const stamp = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Les actions du journal sont stockees en majuscules techniques
 * (CARD_SUSPEND, CLIENT_INVITE…). On les rend lisibles ici plutot que de
 * livrer le vocabulaire du code a l administrateur.
 */
function readable(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** §16 - Parametres : branding, domaine, e-mails, limites, securite, plans futurs. */
export default async function AdminSettingsPage() {
  await requireAdmin();

  const audit = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { email: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Parametres"
        description="La configuration de la plateforme et la trace de ce qui y a ete fait."
      />

      <PageBody className="space-y-6">
        <Surface>
          <SectionTitle>Domaine canonique</SectionTitle>
          <p className="flex items-center gap-2.5 font-[family-name:var(--font-mono)] text-[0.95rem]">
            <Globe className="size-4 shrink-0 text-[var(--muted)]" />
            {siteConfig.url}
          </p>
          {/* L avertissement le plus couteux du produit : il merite d etre vu,
              pas noye dans une ligne de texte gris. */}
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--state-warn)]/25 bg-[var(--state-warn-bg)] p-3.5 text-[0.82rem] leading-relaxed text-[var(--state-warn)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Cette adresse est gravee dans chaque puce. La changer rend muettes toutes les
              cartes deja distribuees : elle ne doit etre fixee qu avant le premier encodage.
            </span>
          </p>
        </Surface>

        <Surface>
          <SectionTitle hint={`${audit.length} dernieres operations`}>
            Journal d audit
          </SectionTitle>
          {audit.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--muted)]">
              Aucune operation enregistree pour l instant.
            </p>
          ) : (
            <ol className="relative space-y-0">
              {audit.map((entry, i) => (
                <li key={entry.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Fil vertical : une suite d evenements se lit comme une
                      chronologie, pas comme un tableau a deux colonnes. */}
                  <span className="relative flex flex-col items-center">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--brand-copper)]" />
                    {i < audit.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-[var(--console-hairline)]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 pb-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-[0.86rem] font-medium">{readable(entry.action)}</span>
                      <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--muted)]">
                        {stamp.format(entry.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[0.78rem] text-[var(--muted)]">
                      {entry.actor?.email ?? "systeme"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Surface>
      </PageBody>
    </>
  );
}
