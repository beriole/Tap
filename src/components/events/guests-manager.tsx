"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Pencil, Phone, Plus, Search, TriangleAlert } from "lucide-react";
import { Pill, Surface } from "@/components/app/ui";
import { displayName, nameKey } from "@/lib/events/names";
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson } from "./form-kit";
import { emptyGroup, GroupEditor, toGroupPayload, type GroupDraft } from "./group-editor";

const ImportPanel = dynamic(() => import("./import-panel"), {
  loading: () => <p className="text-[0.86rem] text-[var(--muted)]">Chargement de l import...</p>,
});

/**
 * Liste des invites d un evenement (plan, phase 2).
 *
 * L unite affichee est le GROUPE (D1) : c est lui qui recoit un lien et qui
 * repond. Les personnes sont listees dedans.
 *
 * Filtrage cote navigateur : jusqu a quelques centaines de groupes, c est
 * instantane. Pagination et agregats serveur arrivent avec le dashboard
 * complet (phase 7, §20).
 */

export type GroupRow = {
  id: string;
  name: string;
  maxSeats: number;
  category: string | null;
  internalNote: string | null;
  invitationState: string | null;
  rsvpStatus: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  guests: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phoneRaw: string | null;
    phoneE164: string | null;
    /** Formate cote serveur : la bibliotheque des numeros reste hors du bundle de la liste. */
    phoneDisplay: string | null;
    ageCategory: "ADULT" | "CHILD" | "BABY";
    attending: boolean | null;
    isPlusOne: boolean;
  }[];
};

const STATUS: Record<GroupRow["rsvpStatus"], { label: string; tone: "live" | "warn" | "stop" | "idle" }> = {
  PENDING: { label: "Sans reponse", tone: "idle" },
  ATTENDING: { label: "Present", tone: "live" },
  DECLINED: { label: "Absent", tone: "stop" },
  MAYBE: { label: "Peut-etre", tone: "warn" },
};

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "PENDING", label: "Sans reponse" },
  { key: "ATTENDING", label: "Presents" },
  { key: "DECLINED", label: "Absents" },
  { key: "phone", label: "Numero a verifier" },
] as const;

type Mode = { kind: "list" } | { kind: "add" } | { kind: "import" } | { kind: "edit"; id: string };

const primaryPhoneMissing = (g: GroupRow) => !g.guests.find((p) => !p.isPlusOne)?.phoneE164;

function toDraft(group: GroupRow): GroupDraft {
  return {
    id: group.id,
    name: group.name,
    maxSeats: group.maxSeats,
    category: group.category ?? "",
    internalNote: group.internalNote ?? "",
    guests: group.guests.map((g) => ({
      id: g.id,
      fullName: displayName(g, ""),
      phone: g.phoneRaw ?? "",
      ageCategory: g.ageCategory,
    })),
  };
}

export function GuestsManager({
  eventId,
  defaultCountry,
  groups,
  canEditSensitive,
  justCreated,
}: {
  eventId: string;
  defaultCountry: string;
  groups: GroupRow[];
  canEditSensitive: boolean;
  justCreated: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(justCreated && groups.length === 0 ? { kind: "add" } : { kind: "list" });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [notice, setNotice] = useState<string | null>(null);
  // Changer la cle remonte un formulaire vierge apres chaque ajout.
  const [addKey, setAddKey] = useState(0);

  const counts = useMemo(
    () => ({
      people: groups.reduce((n, g) => n + g.guests.length, 0),
      toCheck: groups.filter(primaryPhoneMissing).length,
    }),
    [groups],
  );

  const visible = useMemo(() => {
    const q = nameKey(query);
    const digits = query.replace(/\D/g, "");
    return groups.filter((group) => {
      if (filter === "phone" && !primaryPhoneMissing(group)) return false;
      if (filter !== "all" && filter !== "phone" && group.rsvpStatus !== filter) return false;
      if (!q && !digits) return true;
      const haystack = nameKey(group.name, ...group.guests.flatMap((g) => [g.firstName, g.lastName]));
      const words = q.split(" ").filter(Boolean);
      return (
        (words.length > 0 && words.every((w) => haystack.includes(w))) ||
        (digits.length >= 3 && group.guests.some((g) => g.phoneE164?.includes(digits)))
      );
    });
  }, [groups, query, filter]);

  function done(message: string) {
    setMode({ kind: "list" });
    setNotice(message);
    router.refresh();
  }

  async function saveNew(draft: GroupDraft) {
    const result = await sendJson(`/api/organizer/events/${eventId}/groups`, "POST", toGroupPayload(draft));
    if (!result.ok) return result.error;
    const name = toGroupPayload(draft).name;
    // On reste en mode ajout : saisir une liste, c est enchainer les groupes.
    setNotice(`« ${name} » ajoute.`);
    setAddKey((k) => k + 1);
    router.refresh();
    return null;
  }

  return (
    <div className="space-y-5">
      {mode.kind === "add" && (
        <Surface>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.1rem] font-semibold">Nouveau groupe</h2>
          <GroupEditor
            key={addKey}
            initial={emptyGroup()}
            canEditSensitive={canEditSensitive}
            onSave={saveNew}
            onCancel={() => setMode({ kind: "list" })}
          />
        </Surface>
      )}

      {mode.kind === "import" && (
        <Surface>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.1rem] font-semibold">Importer une liste</h2>
          <ImportPanel
            eventId={eventId}
            defaultCountry={defaultCountry}
            onCancel={() => setMode({ kind: "list" })}
            onDone={(created) => done(`${created} groupe${created > 1 ? "s" : ""} importe${created > 1 ? "s" : ""}.`)}
          />
        </Surface>
      )}

      {mode.kind !== "import" && (
        <div className="flex flex-wrap items-center gap-2">
          {mode.kind !== "add" && (
            <Button onClick={() => { setNotice(null); setMode({ kind: "add" }); }}>
              <Plus className="size-4" aria-hidden /> Ajouter un groupe
            </Button>
          )}
          <Button variant="secondary" onClick={() => { setNotice(null); setMode({ kind: "import" }); }}>
            <ClipboardPaste className="size-4" aria-hidden /> Coller une liste
          </Button>
          {notice && (
            <div className="ml-1">
              <FormMessage tone="success">{notice}</FormMessage>
            </div>
          )}
        </div>
      )}

      {groups.length === 0 ? (
        mode.kind === "list" && (
          <div className="rounded-2xl border border-dashed border-[var(--console-hairline)] bg-[var(--console-paper)] p-10 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">Aucun invite pour l instant</h3>
            <p className="mx-auto mt-2 max-w-md text-[0.87rem] leading-relaxed text-[var(--muted)]">
              Ajoutez les familles une par une, ou collez directement votre liste depuis Excel, une note ou WhatsApp.
            </p>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block sm:w-80">
              <span className="sr-only">Rechercher un invite</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom ou numero"
                className="w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-card)] py-2.5 pl-10 pr-3.5 text-[1rem] outline-none focus:border-[var(--brand-copper)] sm:text-[0.9rem]"
              />
            </label>
            <p className="text-[0.8rem] text-[var(--muted)]">
              {groups.length} groupes · {counts.people} personnes
              {counts.toCheck > 0 && ` · ${counts.toCheck} numero(s) a verifier`}
            </p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrer">
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
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-8 text-center text-[0.88rem] text-[var(--muted)]">Aucun groupe ne correspond.</p>
          ) : (
            <ul className="space-y-2.5">
              {visible.map((group) => {
                const status = STATUS[group.rsvpStatus];
                const primary = group.guests.find((g) => !g.isPlusOne);
                const editing = mode.kind === "edit" && mode.id === group.id;
                return (
                  <li key={group.id}>
                    <Surface padded={false} className={cn("p-4 sm:p-5", editing && "ring-2 ring-[var(--brand-copper)]")}>
                      {editing ? (
                        <GroupEditor
                          initial={toDraft(group)}
                          canEditSensitive={canEditSensitive}
                          hasResponse={group.rsvpStatus !== "PENDING"}
                          onCancel={() => setMode({ kind: "list" })}
                          onSave={async (draft) => {
                            const r = await sendJson(`/api/organizer/events/${eventId}/groups/${group.id}`, "PATCH", toGroupPayload(draft));
                            if (!r.ok) return r.error;
                            done(`« ${toGroupPayload(draft).name} » enregistre.`);
                            return null;
                          }}
                          onDelete={async () => {
                            const r = await sendJson(`/api/organizer/events/${eventId}/groups/${group.id}`, "DELETE");
                            if (!r.ok) return r.error;
                            done(`« ${group.name} » supprime.`);
                            return null;
                          }}
                        />
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="min-w-0 break-words font-[family-name:var(--font-display)] text-[1.02rem] font-semibold">
                                {group.name}
                              </h3>
                              <Pill tone={status.tone}>{status.label}</Pill>
                            </div>
                            <p className="mt-1 text-[0.84rem] text-[var(--muted)]">
                              {group.guests.map((g) => displayName(g)).join(", ")}
                              <span className="whitespace-nowrap"> · {group.maxSeats} place{group.maxSeats > 1 ? "s" : ""}</span>
                            </p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem]">
                              {primary?.phoneE164 ? (
                                <>
                                  <Phone className="size-3.5 text-[var(--muted)]" aria-hidden />
                                  <span className="font-[family-name:var(--font-mono)]">{primary.phoneDisplay}</span>
                                </>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[var(--state-warn)]">
                                  <TriangleAlert className="size-3.5" aria-hidden />
                                  {primary?.phoneRaw ? `Numero a verifier : ${primary.phoneRaw}` : "Sans numero"}
                                </span>
                              )}
                            </p>
                            {group.internalNote && (
                              <p className="mt-1.5 text-[0.78rem] italic text-[var(--muted)]">Note : {group.internalNote}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setNotice(null); setMode({ kind: "edit", id: group.id }); }}
                            aria-label={`Modifier ${group.name}`}
                            className="tap-target flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--console-hairline)] text-[var(--muted)] hover:bg-[var(--console-paper)] hover:text-[var(--foreground)]"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                        </div>
                      )}
                    </Surface>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
