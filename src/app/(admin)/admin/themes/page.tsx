import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { THEMES } from "@/config/themes";
import { PageBody, PageHeader, Pill, SectionTitle, Surface } from "@/components/app/ui";

export const metadata: Metadata = { title: "Themes" };

/** §16 - Themes : creer/activer/desactiver, apercu, ordre d affichage, plans autorises. */
export default async function AdminThemesPage() {
  await requireAdmin();

  const stored = await prisma.theme.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { profileThemes: true } } },
  });
  const byKey = new Map(stored.map((t) => [t.key, t]));

  const inUse = stored.reduce((n, t) => n + t._count.profileThemes, 0);
  const missing = THEMES.filter((t) => !byKey.has(t.key)).length;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Bibliotheque de themes"
        description="Quinze directions artistiques pour un seul jeu de donnees. Un theme absent de la base n'est pas proposable aux clients : executer le seed pour synchroniser le code avec la base."
        stats={[
          { label: "Themes livres", value: THEMES.length, tone: "plain" },
          { label: "Actifs en base", value: stored.filter((t) => t.isActive).length, tone: "plain" },
          { label: "Profils habilles", value: inUse },
          { label: "Absents en base", value: missing, tone: "plain" },
        ]}
      />

      <PageBody>
        <SectionTitle hint="Ordre d'affichage chez le client">Les quinze directions</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {THEMES.map((theme) => {
            const row = byKey.get(theme.key);
            return (
              <li key={theme.key}>
                <Surface className="h-full" padded={false}>
                  {/* Bandeau a l accent du theme : on reconnait une direction
                      artistique a sa couleur bien avant de lire son nom. */}
                  <div
                    className="h-1.5 rounded-t-2xl"
                    style={{ background: theme.defaultAccent }}
                    aria-hidden
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-mono)] text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                          {theme.code}
                        </p>
                        <h3 className="mt-1 font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">
                          {theme.name}
                        </h3>
                      </div>
                      {row ? (
                        <Pill tone={row.isActive ? "live" : "idle"}>
                          {row.isActive ? "Actif" : "Desactive"}
                        </Pill>
                      ) : (
                        <Pill tone="stop">Absent en base</Pill>
                      )}
                    </div>

                    <p className="mt-3 text-[0.82rem] leading-relaxed text-[var(--muted)]">
                      {theme.direction}
                    </p>

                    <dl className="mt-4 flex items-center justify-between border-t border-[var(--console-hairline)] pt-3 text-[0.75rem]">
                      <div className="flex items-center gap-2">
                        <dt className="text-[var(--muted)]">Profils</dt>
                        <dd className="font-[family-name:var(--font-mono)] font-medium tabular-nums">
                          {row?._count.profileThemes ?? 0}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Position</dt>
                        <dd className="text-[var(--muted)]">
                          {theme.mvp ? "Toutes offres" : "Premium et Business"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      </PageBody>
    </>
  );
}
