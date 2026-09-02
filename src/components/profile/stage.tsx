"use client";

import { motion, useMotionTemplate, useMotionValue, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * L arrivee de la page.
 *
 * Le visiteur vient d approcher une carte physique : la page se pose comme cet
 * objet - une fois, avec du poids - puis son contenu se depose ligne a ligne.
 * Une seule sequence orchestree plutot que des effets disperses.
 *
 * Le respect de prefers-reduced-motion n est PAS traite ici : il est delegue a
 * <MotionProvider>, qui pose MotionConfig reducedMotion="user". Brancher le
 * balisage sur useReducedMotion() casserait l hydratation (voir motion-provider).
 */

const SETTLE: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.62,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.055,
      delayChildren: 0.14,
    },
  },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function Stage({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
}) {
  const MotionTag = motion[Tag];

  return (
    <MotionTag variants={SETTLE} initial="hidden" animate="show" className={className}>
      {children}
    </MotionTag>
  );
}

export function StageItem({
  children,
  className,
  delay,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** `li` pour rester valide a l interieur d une liste, sans wrapper parasite. */
  as?: "div" | "li" | "header" | "section";
}) {
  const MotionTag = motion[Tag];

  return (
    <MotionTag variants={ITEM} transition={delay ? { delay } : undefined} className={className}>
      {children}
    </MotionTag>
  );
}

/**
 * Apparition au defilement.
 *
 * <Stage> orchestre ce qui est visible au chargement ; au-dela de la ligne de
 * flottaison, une sequence lancee tout de suite se joue dans le vide. Reveal
 * attend que l element entre dans le champ, et ne se joue qu une fois.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Carte de verre qui suit le pointeur.
 *
 * Un halo doux se deplace sous le doigt ou le curseur, comme un reflet sur une
 * surface reelle. Aucune rotation 3D : sur un telephone tenu a la main, une
 * carte qui bascule donne l impression que la page glisse.
 */
export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(50);
  const y = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(22rem circle at ${x}% ${y}%, rgba(255,255,255,0.13), transparent 42%)`;

  return (
    <motion.div
      variants={ITEM}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width) * 100);
        y.set(((e.clientY - r.top) / r.height) * 100);
      }}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/**
 * Fond vivant des themes sombres : des nappes de couleur qui derivent lentement,
 * plus un grain fin qui casse la bande de degrade. Purement decoratif, donc
 * invisible pour les lecteurs d ecran et coupe sous reduced-motion par la CSS.
 */
export function Ambience({
  from,
  to,
  third,
  intensity = 0.6,
  className,
}: {
  from: string;
  to: string;
  /** Troisieme nappe : ce qui separe un fond colore d un vrai champ vivant. */
  third?: string;
  intensity?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="aurora"
        style={{
          opacity: intensity,
          background: [
            `radial-gradient(42% 38% at 20% 14%, ${from} 0%, transparent 68%)`,
            `radial-gradient(48% 44% at 82% 66%, ${to} 0%, transparent 70%)`,
            third ? `radial-gradient(40% 36% at 52% 96%, ${third} 0%, transparent 66%)` : "",
          ]
            .filter(Boolean)
            .join(","),
        }}
      />
      <div className="grain" />
    </div>
  );
}
