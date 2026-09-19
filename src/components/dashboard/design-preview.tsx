"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2, RotateCw, X } from "lucide-react";
import {
  PREMIUM_ENGINES,
  type PhotoFocus,
  type PremiumEngine,
  type PremiumShape,
  type PremiumVariant,
} from "@/config/premium-themes";
import { cn } from "@/lib/utils";

/**
 * Apercus du studio de design : le telephone qui porte le rendu reel, et la
 * scene plein ecran ou on le regarde comme un objet pose sur sa matiere.
 */

export type Settings = {
  engine: PremiumEngine;
  variant: string;
  accent: string | null;
  shape: PremiumShape;
  photo: PhotoFocus;
};

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Designs dont l en-tete est une carte a deux faces (FlipCard). Sert a
 * l annoncer dans le catalogue ; dans l apercu, la presence reelle du recto /
 * verso est lue dans la page elle-meme.
 */
export const TWO_SIDED: ReadonlySet<PremiumEngine> = new Set<PremiumEngine>([
  "obsidian",
  "corporate",
  "heritage",
  "terminal",
  "carte",
  "instant",
  "swiss",
  "journal",
  "block",
]);

/** Le bouton de retournement de FlipCard, dans la page d apercu. */
const FLIP_SELECTOR = 'button[aria-pressed][aria-label*="de la carte"]';

export function previewUrl(s: Partial<Settings> & { engine: PremiumEngine }) {
  const q = new URLSearchParams({ key: s.engine });
  if (s.variant) q.set("variant", s.variant);
  if (s.accent) q.set("accent", s.accent);
  if (s.shape) q.set("shape", s.shape);
  if (s.photo) q.set("photo", s.photo);
  return `/preview/theme?${q.toString()}`;
}

/**
 * La matiere sur laquelle un design est pose : le fond de sa variante,
 * legerement teinte par son encre (clair) ou eclairci (sombre) pour que le
 * chassis noir du telephone reste lisible, avec une pointe de son accent.
 */
export function sceneColor(v: PremiumVariant) {
  const t = v.tokens;
  const base =
    t.scheme === "dark"
      ? `color-mix(in srgb, ${t.bg} 80%, white)`
      : `color-mix(in srgb, ${t.bg} 91%, ${t.ink})`;
  return `color-mix(in srgb, ${base} ${t.scheme === "dark" ? 88 : 93}%, ${t.accent})`;
}

// ---------------------------------------------------------------------------
// Telephone
// ---------------------------------------------------------------------------

/**
 * Telephone contenant le rendu reel, a 390 px puis mis a l echelle.
 *
 * Au changement d adresse, l ancien rendu reste visible puis cede la place au
 * nouveau en fondu : passer d une variante a l autre se voit comme une
 * transition, jamais comme un ecran blanc. Tant que le premier rendu n est pas
 * arrive, un squelette occupe l ecran.
 */
export function Device({
  src,
  width,
  height,
  interactive = true,
  lazy = false,
  glass = false,
  onDocument,
}: {
  src: string;
  width: number;
  height: number;
  /** Miniature d une carte : l iframe capterait le clic destine au bouton. */
  interactive?: boolean;
  /**
   * Ne charger l apercu qu a l approche de l ecran. Treize iframes chargees
   * d un coup, c est treize pages completes a rendre avant que le studio
   * reponde.
   */
  lazy?: boolean;
  /** Reflet de la vitre, a peine visible : reserve a l apercu plein ecran. */
  glass?: boolean;
  /** Recoit le document du rendu affiche, a chaque chargement. */
  onDocument?: (doc: Document | null) => void;
}) {
  const scale = width / 390;
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);
  const [ready, setReady] = useState(false);
  const latest = useRef(src);
  latest.current = src;

  useEffect(() => {
    if (visible || !holder.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px" },
    );
    io.observe(holder.current);
    return () => io.disconnect();
  }, [visible]);

  // Deux calques a cle STABLE : changer la cle d une iframe la recree et la
  // recharge. Le calque arriere charge la nouvelle adresse ; une fois pret,
  // il passe devant et l ancien s efface.
  const [slots, setSlots] = useState<{ a: string; b: string; front: "a" | "b" }>({
    a: src,
    b: "",
    front: "a",
  });

  useEffect(() => {
    setSlots((s) => {
      if (s[s.front] === src) return s;
      const back = s.front === "a" ? "b" : "a";
      return s[back] === src ? s : { ...s, [back]: src };
    });
  }, [src]);

  const layer = (slot: "a" | "b") =>
    slots[slot] ? (
      <iframe
        key={slot}
        src={slots[slot]}
        title="Aperçu du design"
        tabIndex={interactive ? undefined : -1}
        aria-hidden={interactive ? undefined : true}
        onLoad={(event) => {
          setReady(true);
          if (slots[slot] !== latest.current) return;
          setSlots((s) => (s[slot] === latest.current && s.front !== slot ? { ...s, front: slot } : s));
          try {
            onDocument?.(event.currentTarget.contentDocument);
          } catch {
            onDocument?.(null);
          }
        }}
        className={cn(
          "absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-300",
          !interactive && "pointer-events-none",
          slots.front === slot ? "z-[1] opacity-100" : "z-0 opacity-0",
        )}
        style={{ width: 390, height: height / scale, transform: `scale(${scale})` }}
      />
    ) : null;

  return (
    <div
      className="relative rounded-[2.4rem] bg-[#0b0b0d] p-[7px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_0_0_1px_rgb(0_0_0/0.35),0_2px_6px_rgb(0_0_0/0.08),0_30px_70px_-34px_rgb(0_0_0/0.55)]"
      style={{ width: width + 14 }}
    >
      {/* Les touches laterales : deux traits d un pixel, l objet devient un telephone. */}
      <span aria-hidden className="absolute -left-[2px] top-[18%] h-[7%] w-[2px] rounded-l-sm bg-[#1c1c20]" />
      <span aria-hidden className="absolute -left-[2px] top-[27%] h-[7%] w-[2px] rounded-l-sm bg-[#1c1c20]" />
      <span aria-hidden className="absolute -right-[2px] top-[22%] h-[11%] w-[2px] rounded-r-sm bg-[#1c1c20]" />
      <div ref={holder} className="relative overflow-hidden rounded-[2rem] bg-[#111]" style={{ width, height }}>
        {visible && (
          <>
            {layer("a")}
            {layer("b")}
          </>
        )}
        <span
          aria-hidden
          className={cn(
            "pc-skeleton pointer-events-none absolute inset-0 z-[2] bg-[#111] text-white transition-opacity duration-500",
            visible && ready ? "opacity-0" : "opacity-100",
          )}
        />
        {glass && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[3]"
            style={{
              background:
                "linear-gradient(118deg, rgb(255 255 255 / 0.09) 0%, rgb(255 255 255 / 0.025) 26%, transparent 42%)",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apercu plein ecran
// ---------------------------------------------------------------------------

type Status = "idle" | "saving" | "done";

/**
 * Le design en situation : le telephone pose sur la matiere de la variante,
 * eclaire d en haut, avec son ombre de contact. Le fond suit la variante
 * choisie ; pour les designs a deux faces, Recto / Verso pilote la carte
 * DANS le rendu, et reste synchronise si on la touche directement.
 */
export function FullscreenPreview({
  engineKey,
  initialVariant,
  onClose,
  onUse,
  disabled,
  active,
}: {
  engineKey: PremiumEngine;
  initialVariant?: string;
  onClose: () => void;
  /** Enregistre le design ; renvoie le message d erreur, ou null. */
  onUse: (variant: string) => Promise<string | null>;
  disabled: boolean;
  active: boolean;
}) {
  const engine = PREMIUM_ENGINES.find((e) => e.key === engineKey)!;
  const reduced = useReducedMotion();
  const [variant, setVariant] = useState(initialVariant ?? engine.variants[0].key);
  const current = engine.variants.find((v) => v.key === variant) ?? engine.variants[0];
  const src = useMemo(() => previewUrl({ engine: engineKey, variant }), [engineKey, variant]);
  const [viewport, setViewport] = useState({ w: 390, h: 844 });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Recto / verso : l etat vit dans la page d apercu, on le lit et on le pilote.
  const [doc, setDoc] = useState<Document | null>(null);
  const [flipButton, setFlipButton] = useState<HTMLButtonElement | null>(null);
  const [flipped, setFlipped] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const cycleVariant = useCallback(
    (step: number) => {
      const i = engine.variants.findIndex((v) => v.key === variant);
      const next = engine.variants[(i + step + engine.variants.length) % engine.variants.length];
      if (next) setVariant(next.key);
    },
    [engine.variants, variant],
  );

  // Echap ferme, fleches changent de variante, le focus reste dans la scene
  // et revient a l element d origine a la fermeture.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    const onFocus = (e: FocusEvent) => {
      if (root.current && e.target instanceof Node && !root.current.contains(e.target)) closeButton.current?.focus();
    };
    measure();
    closeButton.current?.focus();
    window.addEventListener("resize", measure);
    document.addEventListener("focusin", onFocus);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("focusin", onFocus);
      document.body.style.overflow = "";
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement | null;
        if (target?.closest("iframe, input, textarea")) return;
        cycleVariant(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    // Le focus peut etre DANS le rendu (iframe) : Echap doit fermer quand meme.
    const onInnerKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    doc?.addEventListener("keydown", onInnerKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      doc?.removeEventListener("keydown", onInnerKey);
    };
  }, [cycleVariant, doc]);

  const handleDocument = useCallback((d: Document | null) => {
    setDoc(d);
    const button = d?.querySelector<HTMLButtonElement>(FLIP_SELECTOR) ?? null;
    setFlipButton(button);
    setFlipped(button?.getAttribute("aria-pressed") === "true");
  }, []);

  // Si on retourne la carte en la touchant, la commande suit.
  useEffect(() => {
    if (!flipButton) return;
    const view = flipButton.ownerDocument.defaultView;
    if (!view) return;
    const mo = new view.MutationObserver(() => setFlipped(flipButton.getAttribute("aria-pressed") === "true"));
    mo.observe(flipButton, { attributes: true, attributeFilter: ["aria-pressed"] });
    return () => mo.disconnect();
  }, [flipButton]);

  function showFace(back: boolean) {
    if (!flipButton || flipped === back) return;
    flipButton.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    flipButton.click();
  }

  async function use() {
    setStatus("saving");
    setError(null);
    const failure = await onUse(variant);
    if (failure) {
      setStatus("idle");
      setError(failure);
    } else {
      setStatus("done");
    }
  }

  // Mise en page : le telephone prend toute la hauteur que laissent l en-tete
  // et le pupitre, sans jamais depasser la taille reelle.
  const mobile = viewport.w < 640;
  const chrome = mobile ? 64 + 152 + 28 : 72 + 92 + 48;
  let deviceHeight = Math.max(320, Math.min(844, viewport.h - chrome));
  let deviceWidth = Math.round((deviceHeight * 390) / 844);
  const maxWidth = viewport.w - 56;
  if (deviceWidth > maxWidth) {
    deviceWidth = maxWidth;
    deviceHeight = Math.round((deviceWidth * 844) / 390);
  }

  const dark = current.tokens.scheme === "dark";
  const twoSided = Boolean(flipButton);
  const isCurrent = active && variant === initialVariant;

  return (
    <motion.div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${engine.name}`}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden text-[var(--st-fg)]"
      style={
        {
          backgroundColor: sceneColor(current),
          transition: "background-color 600ms var(--ease-settle)",
          "--st-fg": dark ? "#ffffff" : current.tokens.ink,
          "--st-dim": dark ? "rgb(255 255 255 / 0.62)" : `color-mix(in srgb, ${current.tokens.ink} 68%, transparent)`,
          "--st-dock": dark ? "rgb(0 0 0 / 0.30)" : "rgb(255 255 255 / 0.55)",
          "--st-hover": dark ? "rgb(255 255 255 / 0.10)" : "rgb(0 0 0 / 0.06)",
          "--st-on": dark ? "#ffffff" : current.tokens.ink,
          "--st-on-ink": dark ? "#0a0a0c" : current.tokens.bg,
        } as React.CSSProperties
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* La lumiere : une source haute et douce, un vignetage, le grain de la matiere. */}
      <span aria-hidden className={cn("grain absolute inset-0", dark ? "opacity-[0.14] mix-blend-overlay" : "opacity-[0.1] mix-blend-multiply")} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(90% 62% at 50% 4%, rgb(255 255 255 / ${dark ? 0.12 : 0.34}), transparent 70%), radial-gradient(150% 110% at 50% 38%, transparent 52%, rgb(0 0 0 / ${dark ? 0.32 : 0.13}) 100%)`,
        }}
      />

      <header className="relative flex items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-6 sm:pt-4">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-tight tracking-[-0.02em]">{engine.name}</p>
          <p className="truncate text-[0.74rem] text-[var(--st-dim)]">
            {engine.tags.join(" · ")}
            <span className="hidden sm:inline"> — {engine.audience}</span>
          </p>
        </div>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Fermer l’aperçu"
          aria-keyshortcuts="Escape"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--st-dock)] backdrop-blur-md outline-none transition-colors hover:bg-[var(--st-hover)] focus-visible:ring-2 focus-visible:ring-[var(--st-fg)]"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Le telephone, pose : il se redresse a l ouverture puis ne bouge plus -
          le rendu reste net, c est lui qu on regarde. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center [perspective:1600px]">
        <motion.div
          className="relative"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, rotateX: 9, scale: 0.97 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: reduced ? 0.2 : 0.7, ease: EASE }}
          style={{ transformOrigin: "50% 100%" }}
        >
          {/* Ombre de contact, puis ombre portee diffuse sur la surface. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: -10,
              width: deviceWidth * 0.92,
              height: 26,
              background: `radial-gradient(closest-side, rgb(0 0 0 / ${dark ? 0.55 : 0.34}), transparent)`,
              filter: "blur(4px)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: -34,
              width: deviceWidth * 1.5,
              height: 70,
              background: `radial-gradient(closest-side, rgb(0 0 0 / ${dark ? 0.3 : 0.16}), transparent)`,
              filter: "blur(10px)",
            }}
          />
          <Device src={src} width={deviceWidth} height={deviceHeight} glass onDocument={handleDocument} />
        </motion.div>
      </div>

      {/* Le pupitre : variantes, face de la carte, decision. */}
      <div className="relative px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6 sm:pt-6">
        <div className="mx-auto flex w-full max-w-[26rem] flex-col gap-2 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <div
            role="group"
            aria-label="Variantes"
            className="grid gap-1 rounded-[20px] bg-[var(--st-dock)] p-1 backdrop-blur-md sm:flex"
            style={{ gridTemplateColumns: `repeat(${engine.variants.length}, minmax(0, 1fr))` }}
          >
            {engine.variants.map((v) => {
              const on = variant === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  data-variant={v.key}
                  onClick={() => setVariant(v.key)}
                  aria-pressed={on}
                  title={v.mood}
                  className={cn(
                    "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[0.72rem] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--st-fg)] sm:flex-row sm:gap-2 sm:px-3.5 sm:text-[0.78rem]",
                    on ? "text-[var(--st-on-ink)]" : "text-[var(--st-dim)] hover:bg-[var(--st-hover)] hover:text-[var(--st-fg)]",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="st-variant"
                      aria-hidden
                      className="absolute inset-0 rounded-2xl bg-[var(--st-on)]"
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative size-3.5 shrink-0 rounded-full ring-1 ring-black/15"
                    style={{ background: `linear-gradient(135deg, ${v.tokens.bg} 55%, ${v.tokens.accent} 55%)` }}
                  />
                  <span className="relative truncate">{v.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {twoSided && (
              <div
                role="group"
                aria-label="Face de la carte"
                className="flex shrink-0 items-center gap-1 rounded-[20px] bg-[var(--st-dock)] p-1 backdrop-blur-md"
              >
                <RotateCw aria-hidden className={cn("mx-1.5 size-3.5 text-[var(--st-dim)] transition-transform duration-500 ease-[var(--ease-settle)]", flipped && "rotate-180")} />
                {[false, true].map((back) => {
                  const on = flipped === back;
                  return (
                    <button
                      key={String(back)}
                      type="button"
                      data-face={back ? "back" : "front"}
                      onClick={() => showFace(back)}
                      aria-pressed={on}
                      className={cn(
                        "min-h-11 rounded-2xl px-3.5 text-[0.78rem] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--st-fg)]",
                        on ? "bg-[var(--st-on)] text-[var(--st-on-ink)]" : "text-[var(--st-dim)] hover:bg-[var(--st-hover)] hover:text-[var(--st-fg)]",
                      )}
                    >
                      {back ? "Verso" : "Recto"}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={use}
              disabled={disabled || isCurrent || status !== "idle"}
              className={cn(
                "relative flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[20px] px-6 text-[0.88rem] font-semibold outline-none transition-[background-color,opacity,transform] duration-300 focus-visible:ring-2 focus-visible:ring-[var(--st-fg)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent enabled:hover:-translate-y-0.5 sm:flex-none",
                status === "done" ? "bg-[var(--state-live)] text-white" : "bg-[var(--brand-copper)] text-[#231206]",
                isCurrent && "opacity-55",
                status === "idle" && !isCurrent && disabled && "opacity-55",
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={isCurrent ? "current" : status}
                  className="flex items-center gap-2"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: EASE }}
                >
                  {status === "saving" && <Loader2 className="size-4 animate-spin" />}
                  {status === "done" && <Check className="size-4" strokeWidth={3} />}
                  {status === "saving"
                    ? "Application…"
                    : status === "done"
                      ? "Design appliqué"
                      : isCurrent
                        ? "Design actuel"
                        : "Utiliser ce design"}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <p aria-live="polite" className="mt-2 min-h-[1.1em] text-center text-[0.74rem] text-[var(--st-dim)]">
          {error ? (
            <span className="text-[var(--state-stop)]">{error}</span>
          ) : status === "done" ? (
            "Votre carte affiche ce design dès maintenant."
          ) : twoSided ? (
            <span className="hidden sm:inline">Touchez la carte pour la retourner · ← → pour changer de variante</span>
          ) : (
            <span className="hidden sm:inline">← → pour changer de variante</span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
