"use client";

import { useEffect } from "react";

/**
 * Relais JavaScript des scenes de la vitrine, pour les navigateurs sans
 * animation-timeline (Safari, iPhone compris).
 *
 * Les scenes restent decrites en CSS (globals.css, mk-*) ; ici on ne fait que
 * PILOTER les memes keyframes : chaque animation est posee en pause (classe
 * mk-js) et sa position (currentTime, sur une duree de 1 s) suit la
 * progression du defilement. Changer un delai CSS ne suffit pas : Chrome ne
 * repositionne pas une animation en pause. Une seule ecoute de scroll,
 * regroupee dans requestAnimationFrame.
 *
 * Ne s active pas du tout quand le navigateur sait faire en CSS, ni quand
 * l utilisateur a demande moins d animations.
 */
export function ScrollScenes() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("mk-js");
    const scenes = Array.from(document.querySelectorAll<HTMLElement>(".mk-scene"));
    let frame = 0;

    const seek = (el: Element, p: number) => {
      for (const a of el.getAnimations()) a.currentTime = Math.min(Math.max(p, 0), 1) * 1000;
    };
    const layers = Array.from(document.querySelectorAll(".mk-layer-slow, .mk-layer-mid, .mk-layer-fast"));

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      // Heros : de 0 a une hauteur d ecran de defilement.
      const h = window.scrollY / vh;
      for (const el of layers) seek(el, h);
      // Scene du pli : meme plage qu en CSS, "contain 4% -> contain 72%".
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        const span = rect.height - vh;
        const contain = span > 0 ? -rect.top / span : 0;
        const p = (contain - 0.04) / (0.72 - 0.04);
        for (const el of scene.querySelectorAll(".mk-seal, .mk-flap, .mk-card, .mk-caption")) seek(el, p);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("mk-js");
    };
  }, []);

  return null;
}
