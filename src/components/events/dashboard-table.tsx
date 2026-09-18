"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Pill, SectionTitle, Surface } from "@/components/app/ui";
import { EXPORT_LABELS, type ExportKind } from "@/lib/events/exports";
import { nameKey } from "@/lib/events/names";
import { cn } from "@/lib/utils";

/**
 * Tableau de bord : liste des groupes, filtres, exports (cahier §9).
 *
 * La liste « a relancer » est la premiere chose visible quand elle n est pas
 * vide : c est l action qui change le taux de reponse. Un clic mene a l ecran
 * Partage, deja filtre sur les envoyees non ouvertes ou ouvertes sans reponse.
 *
 * Filtrage cote navigateur : instantane jusqu a quelques centaines de groupes.
 */

export type DashboardRow = {
  groupId: string;
  name: string;
  category: string | null;
  seats: number;
  people: string[];
  presentCount: number;
  state: "CREATED" | "SHARED" | "OPENED" | "RESPONDED" | "REVOKED";
  status: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  meals: string[];
  hasAllergies: boolean;
  message: string | null;
  respondedAt: string | null;
};

const STATUS: Record<DashboardRow["status"], { label: string; tone: "live" | "warn" | "stop" | "idle" }> = {
  PENDING: { label: "Sans reponse", tone: "idle" },
  ATTENDING: { label: "Present", tone: "live" },
  DECLINED: { label: "Absent", tone: "stop" },
  MAYBE: { label: "Peut-etre", tone: "warn" },
};

const FILTERS = [
  { key: "all", label: "Tous", test: () => true },
  { key: "ATTENDING", label: "Presents", test: (r: DashboardRow) => r.status === "ATTENDING" },
  { key: "PENDING", label: "Sans reponse", test: (r: DashboardRow) => r.status === "PENDING" },
  { key: "DECLINED", label: "Absents", test: (r: DashboardRow) => r.status === "DECLINED" },
  { key: "MAYBE", label: "Peut-etre", test: (r: DashboardRow) => r.status === "MAYBE" },
  { key: "allergies", label: "Allergies", test: (r: DashboardRow) => r.hasAllergies },
  { key: "messages", label: "Avec un mot", test: (r: DashboardRow) => Boolean(r.message) },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function DashboardTable({
  eventId,
  rows,
  canExport,
  canShare,
}: {
  eventId: string;
  rows: DashboardRow[];
  canExport: boolean;
  canShare: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const toChase = useMemo(() => rows.filter((r) => r.status === "PENDING" && (r.state === "SHARED" || r.state === "OPENED")), [rows]);
  const notSent = useMemo(() => rows.filter((r) => r.state === "CREATED").length, [rows]);

  const visible = useMemo(() => {
    const test = FILTERS.find((f) => f.key === filter)!.test;
    const q = nameKey(query);
    return rows.filter((r) => test(r) && (!q || q.split(" ").every((w) => nameKey(r.name, ...r.people).includes(w))));
  }, [rows, filter, query]);

  return (
    <div className="space-y-6">
      {(toChase.length > 0 || notSent > 0) && (
        <Surface className="border-[var(--brand-copper)]/40">
          <SectionTitle hint={canShare ? <Link href={`/dashboard/events/${eventId}/partage`} className="underline underline-offset-4">Ouvrir le partage</Link> : undefined}>
            A relancer
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {notSent > 0 && (
              <ChaseTile
                href={canShare ? `/dashboard/events/${eventId}/partage` : null}
                count={notSent}
                label="pas encore envoyees"
                hint="Le lien existe, personne ne l a recu."
              />
            )}
            {toChase.length > 0 && (
              <ChaseTile
                href={canShare ? `/dashboard/events/${eventId}/partage` : null}
                count={toChase.length}
                label="sans reponse apres envoi"
                hint={`${toChase.filter((r) => r.state === "OPENED").length} ont ouvert sans repondre`}
              />
            )}
          </div>
        </Surface>
      )}

      {canExport && (
        <Surface>
          <SectionTitle hint="Memes totaux que cette page">Exports</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(EXPORT_LABELS) as ExportKind[]).map((kind) => (
              <div key={kind} className="rounded-xl border border-[var(--console-hairline)] p-3.5">
                <span className="block text-[0.88rem] font-semibold">{EXPORT_LABELS[kind].label}</span>
                <span className="mt-0.5 block text-[0.76rem] leading-snug text-[var(--muted)]">{EXPORT_LABELS[kind].description}</span>
                <span className="mt-2.5 flex flex-wrap gap-1.5">
                  {(kind === "checkin" ? ["xlsx", "csv", "pdf"] : ["xlsx", "csv"]).map((format) => (
                    <a
                      key={format}
                      href={`/api/organizer/events/${eventId}/export?kind=${kind}&format=${format}`}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--console-hairline)] px-2.5 py-1.5 text-[0.76rem] font-medium uppercase transition-colors hover:bg-[var(--console-paper)]"
                    >
                      <Download className="size-3.5 text-[var(--brand-copper-deep)]" aria-hidden /> {format}
                    </a>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      )}

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block sm:w-72">
            <span className="sr-only">Rechercher un invite</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-card)] py-2.5 pl-10 pr-3.5 text-[1rem] outline-none focus:border-[var(--brand-copper)] sm:text-[0.9rem]"
            />
          </label>
          <p className="text-[0.8rem] text-[var(--muted)]">
            {visible.length} groupe{visible.length > 1 ? "s" : ""} · {visible.reduce((n, r) => n + r.presentCount, 0)} personne{visible.reduce((n, r) => n + r.presentCount, 0) > 1 ? "s" : ""} attendue{visible.reduce((n, r) => n + r.presentCount, 0) > 1 ? "s" : ""}
          </p>
        </div>
        <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrer">
          <div className="flex w-max gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-colors",
                  filter === f.key
                    ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                    : "border-[var(--console-hairline)] bg-[var(--console-card)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {f.label} <span className="tabular-nums">{rows.filter(f.test).length}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="py-8 text-center text-[0.88rem] text-[var(--muted)]">Aucun groupe ne correspond.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {visible.map((row) => {
              const status = STATUS[row.status];
              return (
                <li key={row.groupId}>
                  <Surface padded={false} className="p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 break-words text-[0.95rem] font-semibold">{row.name}</h3>
                          <Pill tone={status.tone}>{status.label}</Pill>
                          {row.status === "ATTENDING" && (
                            <span className="text-[0.8rem] tabular-nums text-[var(--muted)]">
                              {row.presentCount}/{row.seats}
                            </span>
                          )}
                          {row.hasAllergies && <Pill tone="warn">Allergie</Pill>}
                        </div>
                        <p className="mt-1 text-[0.82rem] text-[var(--muted)]">{row.people.join(", ")}</p>
                        {row.status === "ATTENDING" && row.meals.length > 0 && (
                          <p className="mt-1 text-[0.78rem] text-[var(--muted)]">{row.meals.join(" · ")}</p>
                        )}
                        {row.message && <p className="mt-1.5 text-[0.82rem] italic">« {row.message} »</p>}
                      </div>
                      {row.respondedAt && <span className="text-[0.72rem] text-[var(--muted)]">{row.respondedAt}</span>}
                    </div>
                  </Surface>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChaseTile({ href, count, label, hint }: { href: string | null; count: number; label: string; hint: string }) {
  const body = (
    <>
      <span className="console-figure block text-[1.9rem] text-[var(--brand-copper-deep)]">{count}</span>
      <span className="block text-[0.86rem] font-medium">{label}</span>
      <span className="mt-0.5 block text-[0.76rem] text-[var(--muted)]">{hint}</span>
    </>
  );
  const cls = "block rounded-xl border border-[var(--console-hairline)] p-4";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:bg-[var(--console-paper)]")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
