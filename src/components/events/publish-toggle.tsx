"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, sendJson } from "./form-kit";

/**
 * Publication de l evenement, dans la bande de titre de la vue d ensemble.
 * Depublier demande une confirmation : tous les liens deja envoyes cessent
 * de fonctionner.
 */
export function PublishToggle({ eventId, published }: { eventId: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(next: boolean) {
    setBusy(true);
    setError(null);
    const result = await sendJson(`/api/organizer/events/${eventId}/publish`, "POST", { published: next });
    setBusy(false);
    setConfirming(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {published ? (
        confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.8rem] text-[var(--console-on-band-dim)]">Les liens envoyes cesseront de fonctionner.</span>
            <Button variant="secondary" busy={busy} onClick={() => set(false)}>
              Depublier
            </Button>
            <Button variant="ghost" className="text-[var(--console-on-band-dim)]" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[0.8rem] text-[var(--console-on-band)]">
              <span className="size-2 rounded-full bg-[var(--state-live)]" aria-hidden />
              Publie : les liens fonctionnent
            </span>
            <Button variant="ghost" className="text-[var(--console-on-band-dim)]" onClick={() => setConfirming(true)}>
              Depublier
            </Button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-[0.8rem] text-[var(--console-on-band-dim)]">Brouillon : aucun lien ne fonctionne</span>
          <Button busy={busy} onClick={() => set(true)}>
            Publier
          </Button>
        </div>
      )}
      {error && <p className="text-[0.8rem] text-[var(--state-stop)]">{error}</p>}
    </div>
  );
}
