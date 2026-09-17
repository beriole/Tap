"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bouton de reponse colle en bas d ecran (§6.3 "CTA sticky ou repete
 * intelligemment").
 *
 * "Intelligemment" : il n apparait que lorsque le bouton du haut est sorti de
 * l ecran ET que la section de reponse n y est pas encore. Deux boutons
 * "Repondre" visibles en meme temps, c est du bruit.
 *
 * Le rendu serveur le laisse cache : sans JavaScript, la page garde ses deux
 * boutons fixes et rien ne manque.
 */
export function RsvpDock({
  heroId,
  targetId,
  label,
  className,
  buttonClassName,
}: {
  heroId: string;
  targetId: string;
  label: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const target = document.getElementById(targetId);
    if (!hero || !target || !("IntersectionObserver" in window)) return;

    const state = { heroVisible: true, targetVisible: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) state.heroVisible = entry.isIntersecting;
        if (entry.target === target) state.targetVisible = entry.isIntersecting;
      }
      setVisible(!state.heroVisible && !state.targetVisible);
    });
    observer.observe(hero);
    observer.observe(target);
    return () => observer.disconnect();
  }, [heroId, targetId]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        className,
      )}
    >
      <a href={`#${targetId}`} tabIndex={visible ? 0 : -1} className={buttonClassName}>
        {label}
      </a>
    </div>
  );
}
