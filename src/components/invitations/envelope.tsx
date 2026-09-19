"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * L OUVERTURE DE L ENVELOPPE (cahier §6.2).
 *
 * C est le premier geste de l invite, et le seul moment de la plateforme qui
 * doit provoquer une emotion avant de donner une information. On ne montre
 * donc pas une page qui se devoile : on montre un OBJET - un pli ferme, pose
 * sous une lumiere douce, avec son papier, son rabat et son cachet de cire.
 *
 * Sequence, en une seule ligne de temps (Motion pilote, un etat suffit) :
 *   0 ms     le cachet se souleve et s efface
 *   200 ms   le rabat bascule autour de son pli (rotation 3D)
 *   780 ms   le carton sort du pli et grandit a peine
 *   1250 ms  la page dessous commence sa propre entree (data-sealed retire)
 *   1350 ms  la camera avance sur le carton, le voile se fond
 *   2150 ms  le voile quitte le DOM, le defilement est rendu
 *
 * Trois regles tenues ici :
 *  - l invitation est DEJA rendue sous le voile par le serveur : rien n est
 *    charge a l ouverture, et "Passer" donne l information immediatement ;
 *  - la page dessous attend : le theme porte data-sealed, qui met ses entrees
 *    en pause (globals.css). Sans cela, l invite ouvre l enveloppe sur une
 *    page deja animee, donc figee - l effet tombe a plat ;
 *  - mouvement reduit : aucun 3D, aucune translation, un fondu de 260 ms.
 *    Le reglage se lit apres le rendu, jamais pendant : le balisage serveur et
 *    client reste identique.
 *
 * Sans JavaScript, la regle <noscript> masque le voile : l invitation se lit.
 * Aucun son, a aucun moment.
 *
 * Les couleurs et les polices viennent du theme (variables --env-*).
 */

type Stage = "closed" | "opening" | "gone";

const REVEAL_MS = 1250;
const END_MS = 2150;
const REDUCED_MS = 280;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_FOLD = [0.65, 0, 0.35, 1] as const;

export function Envelope({
  recipient,
  monogram,
  hosts,
  label = "Ouvrir l’invitation",
  className,
}: {
  recipient: string | null;
  monogram: string;
  /** Les hotes, graves sur le carton qui sort du pli. */
  hosts?: string | null;
  /** Libelle du bouton : "Ouvrir l invitation", ou autre selon la collection. */
  label?: string;
  /** Porte les variables --env-* et les polices du theme */
  className?: string;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const reduced = useReducedMotion();
  const opening = stage === "opening";
  const openButton = useRef<HTMLButtonElement>(null);

  // Tant que le pli est ferme, la page ne defile pas derriere.
  useEffect(() => {
    if (stage === "gone") return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [stage]);

  // Rend la main a la page : ses entrees demarrent quand le carton sort.
  useEffect(() => {
    if (stage === "closed") return;
    const release = () => document.querySelector("[data-sealed]")?.removeAttribute("data-sealed");
    if (stage === "gone" || reduced) {
      release();
      return;
    }
    const reveal = window.setTimeout(release, REVEAL_MS);
    const end = window.setTimeout(() => setStage("gone"), END_MS);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(end);
    };
  }, [stage, reduced]);

  useEffect(() => {
    if (stage !== "opening" || !reduced) return;
    const timer = window.setTimeout(() => setStage("gone"), REDUCED_MS);
    return () => window.clearTimeout(timer);
  }, [stage, reduced]);

  // Echap ouvre directement l invitation : un voile ne doit jamais enfermer.
  useEffect(() => {
    if (stage !== "closed") return;
    openButton.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStage("gone");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  if (stage === "gone") return null;

  const t = (duration: number, delay = 0, ease = EASE_OUT) =>
    reduced ? { duration: 0 } : { duration, delay, ease };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Invitation sous pli"
      initial={false}
      animate={{ opacity: opening ? 0 : 1 }}
      transition={reduced ? { duration: 0.24 } : { duration: 0.75, delay: 1.35, ease: EASE_OUT }}
      className={cn("env-veil fixed inset-0 z-50 overflow-hidden bg-[var(--env-bg)] text-[var(--env-ink)]", className)}
    >
      <noscript>
        <style>{".env-veil{display:none!important}"}</style>
      </noscript>

      {/* La lumiere de la scene : une source haute, douce, et un grain. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 75% at 50% -10%, color-mix(in srgb, var(--env-paper) 65%, white 12%), transparent 62%), radial-gradient(90% 60% at 50% 115%, color-mix(in srgb, var(--env-seal) 12%, transparent), transparent 70%)",
        }}
      />
      <span aria-hidden className="grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply" />

      <button
        type="button"
        onClick={() => setStage("gone")}
        className={cn(
          "absolute right-3 top-[max(14px,env(safe-area-inset-top))] z-10 min-h-11 px-3 text-[11px] uppercase tracking-[0.24em] text-[var(--env-ink-2)] transition-opacity duration-300 hover:text-[var(--env-ink)]",
          opening && "pointer-events-none opacity-0",
        )}
      >
        Passer
      </button>

      <div className="relative flex h-full flex-col items-center justify-center px-6">
        {/* Le destinataire, ecrit a la main sur le pli. */}
        {recipient && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: opening ? 0 : 1, y: 0 }}
            transition={t(0.6, opening ? 0 : 0.15)}
            className="mb-7 max-w-[300px] text-center text-[clamp(22px,7vw,28px)] leading-tight text-[var(--env-ink-2)] [font-family:var(--env-script,var(--env-font))]"
          >
            {recipient}
          </motion.p>
        )}

        {/* LE PLI --------------------------------------------------------- */}
        <motion.div
          animate={opening && !reduced ? { scale: 1.22, y: "-4%" } : { scale: 1, y: 0 }}
          transition={t(0.9, 1.25, EASE_OUT)}
          className="relative w-[min(86vw,360px)] [perspective:1400px]"
        >
          <motion.div
            animate={reduced || opening ? { y: 0 } : { y: [0, -6, 0] }}
            transition={reduced || opening ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative [transform-style:preserve-3d]"
          >
            {/* Le carton, glisse dans le pli. */}
            <motion.div
              aria-hidden
              animate={opening && !reduced ? { y: "-58%", scale: 1.04 } : { y: 0, scale: 1 }}
              transition={t(0.85, 0.78)}
              className="absolute inset-x-[6.5%] top-[5%] z-10 flex aspect-[3/2.05] flex-col items-center justify-center bg-[var(--env-card)] text-[var(--env-card-ink)] shadow-[0_1px_0_rgba(0,0,0,0.06),0_18px_30px_-22px_rgba(0,0,0,0.45)]"
            >
              <span className="grain absolute inset-0 opacity-[0.10] mix-blend-multiply" />
              <span className="absolute inset-[7px] border border-[color-mix(in_srgb,var(--env-seal)_35%,transparent)]" />
              <span className="relative text-[clamp(26px,8vw,34px)] leading-none [font-family:var(--env-font)]">{monogram}</span>
              {hosts && (
                <span className="relative mt-3 max-w-[80%] truncate text-[10px] uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--env-card-ink)_62%,transparent)]">
                  {hosts}
                </span>
              )}
            </motion.div>

            {/* Le corps du pli : poche basse, devant le carton. */}
            <span
              aria-hidden
              className="relative z-20 block aspect-[3/2] w-full overflow-hidden bg-[var(--env-paper)] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.08),0_30px_60px_-30px_rgba(0,0,0,0.5),0_70px_90px_-70px_rgba(0,0,0,0.6)]"
            >
              <span className="grain absolute inset-0 opacity-[0.16] mix-blend-multiply" />
              <span className="absolute inset-0 bg-[var(--env-fold)] [clip-path:polygon(0_0,50%_58%,0_100%)]" />
              <span className="absolute inset-0 bg-[var(--env-fold)] [clip-path:polygon(100%_0,50%_58%,100%_100%)]" />
              <span className="absolute inset-0 bg-[var(--env-paper)] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
              {/* Le pli de la poche : une arete claire, une ombre sous elle. */}
              <span className="absolute inset-0 opacity-70 [background:linear-gradient(to_top,transparent,color-mix(in_srgb,var(--env-edge)_60%,transparent)_1px,transparent_2px)] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
              <span className="absolute inset-0 opacity-50 [background:linear-gradient(to_bottom,rgba(0,0,0,0.10),transparent_22%)] [clip-path:polygon(0_100%,50%_52%,100%_100%)]" />
            </span>

            {/* Le rabat : bascule autour de son pli, puis passe derriere. */}
            <motion.span
              aria-hidden
              animate={opening && !reduced ? { rotateX: 180, zIndex: 0 } : { rotateX: 0, zIndex: 30 }}
              transition={{
                rotateX: reduced ? { duration: 0 } : { duration: 0.78, delay: 0.2, ease: EASE_FOLD },
                zIndex: { delay: reduced ? 0 : 0.72 },
              }}
              style={{ transformStyle: "preserve-3d", transformOrigin: "top center" }}
              className="absolute inset-x-0 top-0 block aspect-[3/1.28]"
            >
              <span className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_1px_0_var(--env-edge))_drop-shadow(0_10px_12px_rgba(0,0,0,0.10))]">
                <span className="absolute inset-0 bg-[var(--env-flap)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                <span className="absolute inset-0 opacity-60 [background:linear-gradient(to_bottom,rgba(255,255,255,0.22),transparent_60%)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                <span className="grain absolute inset-0 opacity-[0.14] mix-blend-multiply [clip-path:polygon(0_0,100%_0,50%_100%)]" />
              </span>
              {/* La doublure, visible une fois le rabat retourne. */}
              <span className="absolute inset-0 [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)] [transform:rotateX(180deg)]">
                <span className="absolute inset-0 bg-[var(--env-liner)] opacity-90" />
                <span className="absolute inset-0 [background:linear-gradient(to_top,rgba(0,0,0,0.18),transparent_55%)]" />
              </span>
            </motion.span>

            {/* Le cachet de cire, pose sur la pointe du rabat. */}
            <motion.span
              aria-hidden
              animate={opening && !reduced ? { scale: 0.86, opacity: 0, y: -6, rotate: -10 } : { scale: 1, opacity: 1, y: 0, rotate: -4 }}
              transition={t(0.42)}
              className="absolute left-1/2 top-[64%] z-40 block size-[clamp(52px,15vw,64px)] -translate-x-1/2 -translate-y-1/2"
            >
              <WaxSeal monogram={monogram} />
            </motion.span>
          </motion.div>
        </motion.div>

        {/* L appel a l action : un filet, pas un bouton d application. */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: opening ? 0 : 1, y: 0 }}
          transition={t(0.6, opening ? 0 : 0.35)}
          className="mt-12"
        >
          <button
            ref={openButton}
            type="button"
            onClick={() => setStage("opening")}
            disabled={opening}
            className="group relative flex min-h-12 items-center gap-3 px-2 text-[11.5px] uppercase tracking-[0.3em] text-[var(--env-ink)] outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--env-seal)] focus-visible:ring-offset-8 focus-visible:ring-offset-[var(--env-bg)]"
          >
            <span aria-hidden className="h-px w-7 bg-[var(--env-seal)] transition-[width] duration-500 group-hover:w-10" />
            {label}
            <span aria-hidden className="h-px w-7 bg-[var(--env-seal)] transition-[width] duration-500 group-hover:w-10" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Le cachet : une goutte de cire, pas un rond parfait. Le trace est irregulier,
 * la lumiere vient d en haut a gauche, le monogramme est creuse dans la matiere
 * (une ombre claire dessous, une ombre sombre dessus).
 */
function WaxSeal({ monogram }: { monogram: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">
      <defs>
        <radialGradient id="wax" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--env-seal) 72%, white)" />
          <stop offset="55%" stopColor="var(--env-seal)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--env-seal) 72%, black)" />
        </radialGradient>
      </defs>
      <path
        d="M50 4 C64 4 74 9 82 19 C90 29 96 38 95 51 C94 64 88 75 78 84 C68 93 58 96 47 95 C36 94 25 89 16 80 C7 71 3 59 5 47 C7 35 13 23 24 14 C33 7 40 4 50 4 Z"
        fill="url(#wax)"
      />
      <path
        d="M50 4 C64 4 74 9 82 19 C90 29 96 38 95 51 C94 64 88 75 78 84 C68 93 58 96 47 95 C36 94 25 89 16 80 C7 71 3 59 5 47 C7 35 13 23 24 14 C33 7 40 4 50 4 Z"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        className="[font-family:var(--env-font)]"
        fontSize="30"
        fill="color-mix(in srgb, var(--env-seal) 55%, black)"
        style={{ filter: "drop-shadow(0 1px 0 color-mix(in srgb, var(--env-seal) 60%, white))" }}
      >
        {monogram}
      </text>
    </svg>
  );
}
