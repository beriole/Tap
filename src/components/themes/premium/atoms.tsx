"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { ClickAction } from "@prisma/client";
import { Check, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackClick } from "@/components/profile/track";

/**
 * Atomes interactifs des moteurs premium.
 *
 * Les themes restent des composants serveur ; seuls ces atomes s hydratent.
 * Ils portent ce que le CSS ne sait pas faire : suivre un clic, confirmer
 * qu un contact est pret, copier un lien.
 *
 * Aucun d entre eux ne masque son contenu en attendant le JavaScript : un
 * visiteur sur un reseau lent voit et touche la page avant l hydratation.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// ---------------------------------------------------------------------------
// Portrait
// ---------------------------------------------------------------------------

/**
 * Photo avec squelette.
 *
 * Le squelette est SOUS l image, jamais a la place : l image se peint des
 * qu elle arrive, qu il y ait du JavaScript ou non. L etat `loaded` ne fait
 * qu arreter le miroitement.
 */
export function Portrait({
  src,
  alt,
  sizes,
  position,
  priority = true,
  className,
  imageClassName,
  fallback,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  position: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallback: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Image deja en cache : son evenement load a pu partir avant l hydratation.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);

  if (!src || failed) {
    return <div className={cn("relative overflow-hidden", className)}>{fallback}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", !loaded && "pc-skeleton", className)}>
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: position }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lien suivi
// ---------------------------------------------------------------------------

/**
 * Lien avec retour d appui et comptage.
 *
 * L appui a 0.98 est pose en CSS (pc-press) pour repondre avant l hydratation ;
 * Motion n ajoute que le retour visuel d une touche aboutie : un bref voile.
 */
export function TrackedLink({
  href,
  profileId,
  action,
  linkId = null,
  preview,
  external,
  className,
  style,
  children,
  ariaLabel,
}: {
  href: string;
  profileId: string;
  action: ClickAction;
  linkId?: string | null;
  preview?: boolean;
  external?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const [pulse, setPulse] = useState(0);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      onClick={() => {
        trackClick({ profileId, linkId, action, preview });
        setPulse((n) => n + 1);
      }}
      className={cn("pc-press relative isolate", className)}
      style={style}
    >
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[var(--pc-press)]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        )}
      </AnimatePresence>
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Enregistrer le contact
// ---------------------------------------------------------------------------

/**
 * L action principale.
 *
 * Un vrai <a> vers /api/vcard/[jeton] : iOS et Android ouvrent alors leur
 * fiche contact native, ce qu un fetch() ne declencherait pas. Apres le
 * toucher, le libelle se remplace par une confirmation - le visiteur sait que
 * son geste a ete pris en compte, meme si la fiche met un instant a s ouvrir.
 */
export function SaveContact({
  token,
  profileId,
  name,
  preview,
  className,
  style,
  label = "Enregistrer le contact",
  icon,
  trailing,
}: {
  token: string;
  profileId: string;
  name: string;
  preview?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  icon: React.ReactNode;
  /** Element pose a l extremite droite (fleche d une composition suisse). */
  trailing?: React.ReactNode;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(t);
  }, [saved]);

  const nav = preview
    ? { href: "#", onClickCapture: (e: React.MouseEvent) => e.preventDefault() }
    : { href: `/api/vcard/${token}`, download: `${name}.vcf` };

  return (
    <motion.a
      {...nav}
      onClick={() => {
        trackClick({ profileId, action: "VCARD", preview });
        setSaved(true);
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: EASE }}
      className={cn(
        "relative flex items-center justify-center overflow-hidden select-none",
        className,
      )}
      style={style}
    >
      <AnimatePresence mode="wait" initial={false}>
        {saved ? (
          <motion.span
            key="saved"
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            <Check className="size-[1.1rem]" strokeWidth={2.25} />
            Contact prêt
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className={cn("flex items-center gap-2.5", trailing ? "w-full justify-between" : undefined)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            {icon}
            {label}
            {trailing}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.a>
  );
}

// ---------------------------------------------------------------------------
// Partage
// ---------------------------------------------------------------------------

/**
 * Partager la page.
 *
 * La feuille de partage native quand le telephone la propose ; sinon, le lien
 * est copie et le bouton le dit. Jamais un bouton qui ne fait rien en silence.
 */
export function ShareControl({
  url,
  title,
  profileId,
  preview,
  className,
  showLabel = false,
  label = "Partager",
}: {
  url: string;
  title: string;
  profileId: string;
  preview?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    trackClick({ profileId, action: "SHARE", preview });
    if (preview) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* partage annule : on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      trackClick({ profileId, action: "COPY_LINK", preview });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : rien a signaler de plus */
    }
  }

  return (
    <motion.button
      type="button"
      onClick={share}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18, ease: EASE }}
      aria-label={showLabel ? undefined : label}
      className={cn("pc-press inline-flex items-center justify-center gap-2", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="ok"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <Check className="size-[1.05rem]" strokeWidth={2.25} />
            {showLabel && "Lien copié"}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="inline-flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {/* Une seule icone, identique au serveur et au client : la choisir
                selon navigator.share ferait diverger l hydratation. */}
            <Share className="size-[1.05rem]" />
            {showLabel && label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Carte inclinable
// ---------------------------------------------------------------------------

/**
 * La carte physique reproduite en tete du design Carte.
 *
 * Elle s incline de quelques degres sous le doigt ou le pointeur, suit le
 * geste, puis revient au repos d un ressort amorti. Jamais en continu : sans
 * contact, elle ne bouge pas. Sans JavaScript, elle reste simplement posee.
 * Six degres au plus - assez pour sentir un objet, trop peu pour un effet.
 */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const glare = useMotionValue(50);
  const springX = useSpring(rx, { stiffness: 220, damping: 22 });
  const springY = useSpring(ry, { stiffness: 220, damping: 22 });
  const background = useMotionTemplate`radial-gradient(120% 90% at ${glare}% 0%, rgba(255,255,255,0.16), transparent 55%)`;

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 12);
    rx.set((0.5 - py) * 12);
    glare.set(px * 100);
  }

  function reset() {
    rx.set(0);
    ry.set(0);
    glare.set(50);
  }

  return (
    <div className="[perspective:1100px]">
      <motion.div
        onPointerMove={move}
        onPointerLeave={reset}
        onPointerUp={reset}
        onPointerCancel={reset}
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        className={cn("relative touch-pan-y", className)}
      >
        {children}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background }}
        />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recto / verso
// ---------------------------------------------------------------------------

/**
 * Une carte a deux faces, qu on retourne d un toucher.
 *
 * C est l objet qu un designer de marque dessine en premier : un recto qui ne
 * porte que l identite (monogramme, nom, logo), un verso qui porte les
 * coordonnees. Les deux faces sont dans le DOM ; la face cachee est retiree de
 * l arbre d accessibilite. Aucun lien dedans - la carte est un bouton, et les
 * actions sont en dessous.
 *
 * Retournement par ressort (Motion) ; avec "reduire les animations", la face
 * change sans rotation.
 */
export function FlipCard({
  front,
  back,
  className,
  hint = "Toucher pour retourner",
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  hint?: string | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();
  return (
    <div className="[perspective:1600px]">
      <motion.button
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? "Voir le recto de la carte" : "Voir le verso de la carte"}
        onClick={() => setFlipped((f) => !f)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 20, mass: 0.9 }}
        style={{ transformStyle: "preserve-3d" }}
        className={cn("relative block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--pc-bg)]", className)}
      >
        <div aria-hidden={flipped} className="relative [backface-visibility:hidden]">
          {front}
        </div>
        <div aria-hidden={!flipped} className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {back}
        </div>
      </motion.button>
      {hint && (
        <p aria-hidden className="mt-3 text-center text-[10.5px] uppercase tracking-[0.24em] text-[var(--pc-ink-3)]">
          {flipped ? "Recto" : hint}
        </p>
      )}
    </div>
  );
}
