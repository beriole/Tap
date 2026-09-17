"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Headcount } from "@/lib/events/headcount";

/**
 * Rafraichissement du tableau de bord (D11).
 *
 * Toutes les `seconds`, quand l onglet est visible :
 *  1. les totaux sont relus en JSON (/headcount) et poses dans le DOM par
 *     l attribut data-figure - c est ce que voit l organisateur ;
 *  2. router.refresh() est demande pour le reste de la page (liste, repas).
 *
 * Pourquoi les deux : router.refresh() seul ne remplacait pas toujours
 * l arbre - le flux RSC arrivait avec la bonne valeur et l ecran gardait
 * l ancienne. Les chiffres cles ne doivent pas dependre de ce comportement.
 *
 * Un onglet oublie en arriere-plan n interroge pas la base pour rien.
 */
export function AutoRefresh({ eventId, seconds = 10 }: { eventId: string; seconds?: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/organizer/events/${eventId}/headcount`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const h = (await res.json()) as Headcount;
        const figures: Record<string, number> = {
          expected: h.people.expected,
          rate: Math.round(h.responseRate * 100),
          declined: h.people.declined,
          checkedIn: h.people.checkedIn,
          noResponse: h.people.noResponse,
        };
        for (const [key, value] of Object.entries(figures)) {
          for (const node of document.querySelectorAll<HTMLElement>(`[data-figure="${key}"]`)) {
            if (node.textContent !== String(value)) node.textContent = String(value);
          }
        }
        setUpdatedAt(new Date());
        router.refresh();
      } catch {
        /* reseau absent : on reessaiera au prochain cycle */
      }
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, seconds * 1000);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void tick();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, eventId, seconds]);

  return (
    <span className="text-[0.72rem] text-[var(--console-on-band-dim)]" aria-live="polite">
      {updatedAt
        ? `Mis a jour a ${updatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        : `Actualisation toutes les ${seconds} s`}
    </span>
  );
}
