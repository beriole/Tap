"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, ShieldOff } from "lucide-react";
import { Pill, SectionTitle, Surface } from "@/components/app/ui";
import { Button, Field, FormMessage, sendJson, TextInput } from "./form-kit";

/**
 * Postes d accueil (D6). Le PIN n est visible qu a la creation, une seule
 * fois : il n est stocke que hache. L organisateur le note ou le transmet
 * tout de suite a la personne qui tiendra l entree.
 */

export type StationRow = { id: string; label: string; link: string; createdAt: string; revoked: boolean; entries: number };

export function StationsManager({ eventId, stations, canCreate }: { eventId: string; stations: StationRow[]; canCreate: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ label: string; link: string; pin: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const r = await sendJson<{ token: string; label: string; pin: string }>(`/api/organizer/events/${eventId}/stations`, "POST", { label });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setCreated({ label: r.data.label, link: `${window.location.origin}/accueil/${r.data.token}`, pin: r.data.pin });
    setLabel("");
    router.refresh();
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Copie impossible sur cet appareil : selectionnez le texte.");
    }
  }

  return (
    <div className="space-y-5">
      {created && (
        <Surface className="border-[var(--brand-copper)]/50">
          <SectionTitle>Poste cree : notez le code PIN maintenant</SectionTitle>
          <p className="text-[0.88rem] text-[var(--muted)]">Il ne sera plus affiche. Transmettez le lien et le PIN a la personne qui tiendra « {created.label} ».</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-xl bg-[var(--console-paper)] p-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">Lien du poste</p>
              <p className="mt-1 break-all font-[family-name:var(--font-mono)] text-[0.8rem]">{created.link}</p>
              <Button variant="ghost" className="mt-1 px-0" onClick={() => copy(created.link, "link")}>
                <Copy className="size-4" aria-hidden /> {copied === "link" ? "Copie" : "Copier le lien"}
              </Button>
            </div>
            <div className="rounded-xl bg-[var(--brand-ink)] p-3 text-center text-[var(--brand-paper)]">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] opacity-70">Code PIN</p>
              <p className="console-figure mt-1 text-[2.4rem] tracking-[0.3em]">{created.pin}</p>
            </div>
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setCreated(null)}>
            C est note
          </Button>
        </Surface>
      )}

      {canCreate && (
        <Surface>
          <SectionTitle hint="Un lien + un PIN par poste, sans compte">Nouveau poste</SectionTitle>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Nom du poste" className="w-full sm:w-72">
              <TextInput value={label} placeholder="Entree principale" onChange={(e) => setLabel(e.target.value)} />
            </Field>
            <Button busy={busy} disabled={label.trim().length < 2} onClick={create}>
              <Plus className="size-4" aria-hidden /> Creer le poste
            </Button>
          </div>
          {error && (
            <div className="mt-3">
              <FormMessage tone="error">{error}</FormMessage>
            </div>
          )}
        </Surface>
      )}

      <Surface>
        <SectionTitle hint={`${stations.filter((s) => !s.revoked).length} actif(s)`}>Postes</SectionTitle>
        {stations.length === 0 ? (
          <p className="text-[0.86rem] text-[var(--muted)]">Aucun poste. Creez-en un par entree ; chaque personne d accueil aura son lien et son PIN.</p>
        ) : (
          <ul className="divide-y divide-[var(--console-hairline)]">
            {stations.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {s.label} {s.revoked ? <Pill tone="stop">Revoque</Pill> : <Pill tone="live">Actif</Pill>}
                  </p>
                  <p className="text-[0.78rem] text-[var(--muted)]">
                    {s.entries} entree{s.entries > 1 ? "s" : ""} enregistree{s.entries > 1 ? "s" : ""} · cree le {s.createdAt}
                  </p>
                </div>
                {!s.revoked && (
                  <div className="flex gap-1.5">
                    <Button variant="secondary" onClick={() => copy(s.link, s.id)}>
                      <Copy className="size-4" aria-hidden /> {copied === s.id ? "Copie" : "Lien"}
                    </Button>
                    {canCreate && (
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (!window.confirm(`Revoquer « ${s.label} » ? Le lien cessera de fonctionner immediatement.`)) return;
                          const r = await sendJson(`/api/organizer/events/${eventId}/stations?station=${s.id}`, "DELETE");
                          if (!r.ok) return setError(r.error);
                          router.refresh();
                        }}
                      >
                        <ShieldOff className="size-4" aria-hidden /> Revoquer
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
