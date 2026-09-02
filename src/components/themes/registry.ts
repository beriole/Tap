import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ThemeKey, ThemeProps } from "@/types/profile";

/**
 * §17 - "Chaque theme est un composant independant." Le choix du client ne
 * change pas la structure de la base : il change uniquement le moteur de rendu.
 * Chargement dynamique : un profil ne telecharge que le theme qu il utilise (§13).
 */
export const THEME_COMPONENTS: Record<ThemeKey, ComponentType<ThemeProps>> = {
  minimal: dynamic(() => import("./theme-minimal").then((m) => m.ThemeMinimal)),
  executive: dynamic(() => import("./theme-executive").then((m) => m.ThemeExecutive)),
  creator: dynamic(() => import("./theme-creator").then((m) => m.ThemeCreator)),
  tech: dynamic(() => import("./theme-tech").then((m) => m.ThemeTech)),
  luxury: dynamic(() => import("./theme-luxury").then((m) => m.ThemeLuxury)),
  business: dynamic(() => import("./theme-business").then((m) => m.ThemeBusiness)),
  photo: dynamic(() => import("./theme-photo").then((m) => m.ThemePhoto)),
  compact: dynamic(() => import("./theme-compact").then((m) => m.ThemeCompact)),
  aurora: dynamic(() => import("./theme-aurora").then((m) => m.ThemeAurora)),
  carbone: dynamic(() => import("./theme-carbone").then((m) => m.ThemeCarbone)),
  signal: dynamic(() => import("./theme-signal").then((m) => m.ThemeSignal)),
  editorial: dynamic(() => import("./theme-editorial").then((m) => m.ThemeEditorial)),
  hub: dynamic(() => import("./theme-hub").then((m) => m.ThemeHub)),
  onyx: dynamic(() => import("./theme-onyx").then((m) => m.ThemeOnyx)),
  atelier: dynamic(() => import("./theme-atelier").then((m) => m.ThemeAtelier)),
};
