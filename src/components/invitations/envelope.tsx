"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ouverture de l enveloppe (cahier §6.2).
 *
 * L invitation est DEJA rendue sous ce voile, par le serveur : quand
 * l enveloppe s efface, la page est la, sans ecran blanc intermediaire. Le
 * voile ne bloque donc jamais l information - il la retarde de deux secondes
 * au plus, et "Passer" la donne tout de suite.
 *
 * Sequence, en CSS pilote par un seul attribut data-state :
 *   0 ms     le sceau se retire
 *   180 ms   le rabat bascule (rotation 3D autour de son pli)
 *   760 ms   la carte sort de l enveloppe
 *   1450 ms  le voile s efface
 *   2050 ms  le composant se retire du DOM, le defilement est rendu
 *
 * Mouvement reduit : pas de 3D, pas de translation, un fondu de 250 ms.
 * Le choix se lit dans un effet (matchMedia), jamais au rendu : le balisage
 * serveur et client reste identique, pas de divergence d hydratation.
 *
 * Sans JavaScript : la regle <noscript> masque le voile, l invitation se lit.
 * Aucun son, a aucun moment (§6.2).
 *
 * Les couleurs viennent du theme par variables CSS (--env-*).
 */

type Stage = "closed" | "opening" | "gone";

const OPEN_MS = 2050;
const REDUCED_MS = 260;

export function Envelope({
  recipient,
  monogram,
  className,
}: {
  recipient: string | null;
  monogram: string;
  /** Porte les variables --env-* et la police du theme */
  className?: string;
}) {
  const [stage, setStage] = useState<Stage>("closed");

  // Tant que l enveloppe est fermee, la page ne defile pas derriere.
  useEffect(() => {
    if (stage === "gone") return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "opening") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setStage("gone"), reduced ? REDUCED_MS : OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "closed") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStage("gone");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  if (stage === "gone") return null;

  return (
    <div
      data-state={stage}
      role="dialog"
      aria-modal="true"
      aria-label="Invitation sous enveloppe"
      className={cn(
        "env-veil group fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--env-bg)] px-6 text-[var(--env-ink)]",
        "transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transition-delay:1450ms]",
        "data-[state=opening]:pointer-events-none data-[state=opening]:opacity-0",
        "motion-reduce:![transition-delay:0ms] motion-reduce:![transition-duration:250ms]",
        className,
      )}
    >
      <noscript>
        <style>{".env-veil{display:none!important}"}</style>
      </noscript>

      <button
        type="button"
        onClick={() => setStage("gone")}
        className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] min-h-11 px-3 text-[12px] uppercase tracking-[0.2em] text-[var(--env-ink-2)] transition-opacity group-data-[state=opening]:opacity-0 hover:text-[var(--env-ink)]"
      >
        Passer
      </button>

      {recipient && (
        <div className="pc-fade mb-8">
          <p className="text-center text-[15px] italic text-[var(--env-ink-2)] transition-opacity duration-300 [font-family:var(--env-font)] group-data-[state=opening]:opacity-0">
            Pour {recipient}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setStage("opening")}
        disabled={stage !== "closed"}
        aria-label="Ouvrir l invitation"
        className="pc-rise relative w-[min(84vw,340px)] outline-none [perspective:1100px] focus-visible:[&>.env-body]:ring-2 focus-visible:[&>.env-body]:ring-[var(--env-seal)] focus-visible:[&>.env-body]:ring-offset-8 focus-visible:[&>.env-body]:ring-offset-[var(--env-bg)]"
        style={{ "--d": "120ms" } as React.CSSProperties}
      >
        {/* Carte : glissee dans l enveloppe, sort a l ouverture. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-[7%] top-[6%] z-10 flex aspect-[3/2] flex-col items-center justify-center bg-[var(--env-card)] text-[var(--env-card-ink)] shadow-[0_1px_0_var(--env-line)]",
            "transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transition-delay:760ms]",
            "group-data-[state=opening]:-translate-y-[62%]",
            "motion-reduce:!transition-none motion-reduce:group-data-[state=opening]:!translate-y-0",
          )}
        >
          <span className="text-[30px] leading-none [font-family:var(--env-font)]">{monogram}</span>
          <span className="mt-3 h-px w-8 bg-[var(--env-seal)]" />
        </span>

        {/* Corps de l enveloppe : devant la carte, poche basse. */}
        <span
          aria-hidden
          className="env-body relative z-20 block aspect-[3/2] w-full overflow-hidden bg-[var(--env-paper)] shadow-[0_24px_48px_-28px_rgb(0_0_0/0.45)]"
        >
          {/* Grain de papier : a peine visible, il suffit a quitter l aplat numerique. */}
          <span className="grain absolute inset-0 opacity-[0.18] mix-blend-multiply" />
          {/* Plis de la poche : deux triangles lateraux et un bas, par clip-path. */}
          <span className="absolute inset-0 bg-[var(--env-fold)] [clip-path:polygon(0_0,50%_58%,0_100%)]" />
          <span className="absolute inset-0 bg-[var(--env-fold)] [clip-path:polygon(100%_0,50%_58%,100%_100%)]" />
          <span className="absolute inset-0 bg-[var(--env-paper)] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
          <span className="absolute inset-0 [background:linear-gradient(to_top,var(--env-line),transparent_1px)] [clip-path:polygon(0_100%,50%_52%,100%_100%)] opacity-60" />
        </span>

        {/* Rabat : bascule autour de son pli, puis passe derriere la carte. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 z-30 block aspect-[3/1.28] origin-top [transform-style:preserve-3d]",
            "transition-[transform,z-index] duration-[580ms,0ms] ease-[cubic-bezier(0.65,0,0.35,1)] [transition-delay:180ms,700ms]",
            "group-data-[state=opening]:z-0 group-data-[state=opening]:[transform:rotateX(180deg)]",
            "motion-reduce:!transition-none motion-reduce:group-data-[state=opening]:![transform:none]",
          )}
        >
          {/* Le liseré passe par drop-shadow sur un calque parent : une ombre
              posee sur l element decoupe serait elle-meme decoupee. */}
          <span className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_1px_0_var(--env-edge))_drop-shadow(0_6px_8px_rgb(0_0_0/0.06))]">
            <span className="absolute inset-0 bg-[var(--env-flap)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          </span>
          {/* Revers du rabat : la doublure, visible une fois ouvert. */}
          <span className="absolute inset-0 bg-[var(--env-liner)] [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)] [transform:rotateX(180deg)]" />
        </span>

        {/* Sceau : pose sur la pointe du rabat. Rabat 3:1,28 sur enveloppe 3:2,
            sa pointe tombe donc a 1,28/2 = 64 % de la hauteur. */}
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 top-[64%] z-40 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--env-seal)] text-[15px] text-[var(--env-seal-ink)] shadow-[inset_0_0_0_3px_color-mix(in_srgb,var(--env-seal-ink)_22%,transparent),0_6px_14px_-6px_rgb(0_0_0/0.5)] [font-family:var(--env-font)]",
            // Tailwind 4 : scale est une propriete a part, pas un transform.
            "transition-[scale,opacity] duration-[260ms] ease-out",
            "group-data-[state=opening]:scale-75 group-data-[state=opening]:opacity-0",
            "motion-reduce:!transition-none",
          )}
        >
          {monogram}
        </span>
      </button>

      {/* Deux elements : l animation d entree (fill-mode both) verrouille
          l opacite de son element, le fondu de sortie doit en porter un autre. */}
      <div className="pc-fade mt-10" style={{ "--d": "400ms" } as React.CSSProperties}>
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--env-ink-2)] transition-opacity duration-200 group-data-[state=opening]:opacity-0">
          Toucher pour ouvrir
        </p>
      </div>
    </div>
  );
}
