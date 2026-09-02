import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { THEMES } from "@/config/themes";

export const metadata: Metadata = { title: "Themes" };

/** §16 - Themes : creer/activer/desactiver, apercu, ordre d affichage, plans autorises. */
export default async function AdminThemesPage() {
  await requireAdmin();

  const stored = await prisma.theme.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { profileThemes: true } } },
  });
  const byKey = new Map(stored.map((t) => [t.key, t]));

  return (
    <section className="space-y-5">
      <h1 className="text-xl font-semibold">Themes</h1>
      <p className="text-sm text-[var(--muted)]">
        Un theme absent de la base n est pas proposable aux clients. Executer le seed pour
        synchroniser la bibliotheque du code avec la base.
      </p>

      <ul className="grid gap-3 md:grid-cols-2">
        {THEMES.map((theme) => {
          const row = byKey.get(theme.key);
          return (
            <li
              key={theme.key}
              className="rounded-[var(--radius-card)] border border-[var(--border)] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {theme.code} - {theme.name}
                </p>
                <span className="text-xs text-[var(--muted)]">
                  {row ? (row.isActive ? "Actif" : "Desactive") : "Absent en base"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{theme.direction}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Profils utilisant ce theme : {row?._count.profileThemes ?? 0}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
