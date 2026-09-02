"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Chiffres animes de la console.
 *
 * Un tableau de bord est d abord une suite de nombres. Les poser d un coup les
 * rend inertes ; les faire monter une fois a l arrivee attire l oeil dans le
 * bon ordre et donne la seule impression de vie dont l ecran a besoin.
 *
 * Tout est fait a la main, sans librairie d animation : en importer une ici
 * ajoutait 34 ko a CHAQUE page des deux espaces, pour interpoler un entier et
 * tracer une polyligne. Le profil public, lui, garde Motion - il en a besoin.
 *
 * L animation ne touche QUE le contenu textuel, jamais la structure : le
 * serveur rend deja la valeur finale, donc aucun risque de divergence
 * d hydratation, et un lecteur d ecran lit toujours le bon chiffre.
 */

/** Respecte le reglage systeme "reduire les animations" (§13). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Decelere franchement a l arrivee : le chiffre se pose au lieu de s arreter net.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number;
  className?: string;
  /** Duree en millisecondes. */
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Au clavier ou avec "moins d animations", on affiche la valeur, point.
    if (reduced || value === 0) {
      node.textContent = String(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      node.textContent = String(Math.round(easeOut(t) * value));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  // Valeur finale rendue cote serveur : elle reste juste si le JS ne part pas.
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {value}
    </span>
  );
}

/**
 * Courbe d activite, tracee en SVG sans librairie.
 *
 * Elle vit DERRIERE le chiffre des scans plutot qu a cote : la forme donne la
 * tendance d un coup d oeil, le nombre donne la valeur exacte. Deux lectures,
 * un seul espace.
 */
export function Sparkline({
  points,
  className,
  stroke = "currentColor",
  fill,
}: {
  points: number[];
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => setDrawn(true), []);

  if (points.length < 2) return null;

  const W = 100;
  const H = 32;
  const max = Math.max(...points, 1);
  const step = W / (points.length - 1);
  const coords = points.map((p, i) => [i * step, H - (p / max) * (H - 3) - 1.5] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-full w-full", className)}
    >
      {fill && <path d={area} fill={fill} />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={
          reduced
            ? undefined
            : {
                strokeDasharray: 240,
                strokeDashoffset: drawn ? 0 : 240,
                transition: "stroke-dashoffset 1.1s var(--ease-settle) 0.15s",
              }
        }
      />
    </svg>
  );
}

/**
 * Histogramme journalier.
 *
 * L ancienne version empilait des barres nues, sans echelle ni date : on
 * voyait une silhouette sans savoir de quand elle parlait. Chaque barre porte
 * maintenant sa valeur au survol, et les extremites sont datees.
 */
export function DailyBars({
  data,
  className,
}: {
  data: { date: string; scans: number; clicks: number }[];
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const max = Math.max(...data.map((d) => d.scans), 1);
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <figure className={cn("space-y-2", className)}>
      <div className="flex h-32 items-end gap-[3px]">
        {data.map((d, i) => {
          const h = Math.max((d.scans / max) * 100, d.scans ? 6 : 2);
          return (
            <div
              key={d.date}
              className="group relative flex-1 rounded-t-[3px] bg-[var(--brand-copper)]/60 transition-colors hover:bg-[var(--brand-copper-deep)]"
              style={{
                height: `${h}%`,
                animation: reduced
                  ? undefined
                  : `console-rise 0.5s var(--ease-settle) ${Math.min(i * 14, 420)}ms both`,
              }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--console-band)] px-2 py-1 text-[0.68rem] font-medium text-[var(--console-on-band)] group-hover:block">
                {fmt(d.date)} · {d.scans} scan{d.scans > 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="flex justify-between text-[0.68rem] text-[var(--muted)]">
        <span>{fmt(data[0]?.date ?? "")}</span>
        <span>Aujourd&apos;hui</span>
      </figcaption>
    </figure>
  );
}
