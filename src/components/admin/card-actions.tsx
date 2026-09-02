"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProfileOption = { id: string; label: string };

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspendue" },
  { value: "LOST", label: "Perdue" },
  { value: "REPLACED", label: "Remplacee" },
  { value: "UNASSIGNED", label: "Non attribuee" },
] as const;

/**
 * §11 / §16 - Association carte -> profil et changement d etat.
 *
 * Ces deux gestes sont strictement administratifs : le client ne peut ni
 * changer son token ni reaffecter sa carte. C est aussi ici que passe la
 * revocation immediate d une carte perdue (§12).
 */
export function CardRowActions({
  cardId,
  status,
  assignedProfileId,
  profiles,
}: {
  cardId: string;
  status: string;
  assignedProfileId: string | null;
  profiles: ProfileOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function assign(profileId: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/cards/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, profileId: profileId || null }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Association impossible.");
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function setStatus(next: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, status: next }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Changement d etat impossible.");
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <select
          aria-label="Profil associe"
          disabled={pending}
          defaultValue={assignedProfileId ?? ""}
          onChange={(e) => assign(e.target.value)}
          className="max-w-[11rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs disabled:opacity-50"
        >
          <option value="">— non attribuee —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Etat de la carte"
          disabled={pending}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-[0.7rem] text-red-600">{error}</p>}
    </div>
  );
}
