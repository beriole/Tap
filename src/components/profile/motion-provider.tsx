"use client";

import { MotionConfig } from "motion/react";

/**
 * Point unique de gestion de prefers-reduced-motion pour tout le profil public.
 *
 * Pourquoi ici et nulle part ailleurs : useReducedMotion() vaut false pendant
 * le rendu serveur et peut valoir true au client. Faire dependre le balisage de
 * cette valeur - une classe en moins, un composant motion remplace par une
 * balise simple - produit une divergence d hydratation qui fait echouer le
 * rendu de la page entiere, precisement pour les utilisateurs qu on voulait
 * menager.
 *
 * `reducedMotion="user"` laisse Motion neutraliser lui-meme les animations de
 * transformation et d opacite, sans que le DOM change. Les animations CSS
 * (reflet, derive du fond) sont coupees en parallele par la media query de
 * globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
