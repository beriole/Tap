"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
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
}: {
  token: string;
  profileId: string;
  name: string;
  preview?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  icon: React.ReactNode;
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
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            {icon}
            {label}
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
