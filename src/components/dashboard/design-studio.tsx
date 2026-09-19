"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, Loader2, Maximize2, X } from "lucide-react";
import {
  FAMILIES,
  PREMIUM_ENGINES,
  SHAPES,
  type EngineFamily,
  type PhotoFocus,
  type PremiumEngine,
  type PremiumShape,
} from "@/config/premium-themes";
import { SectionTitle, Surface } from "@/components/app/ui";
import { cn } from "@/lib/utils";

/**
 * Studio de design : "Choisissez votre design".
 *
 * Le client ne choisit pas sur des captures d ecran d inconnus : chaque apercu
 * est une iframe vers /preview/theme, qui rend le VRAI design avec SES
 * donnees. Il se voit avec Signature, avec Obsidian, avec Immersive.
 *
 * Deux temps, dans l ordre ou l on decide reellement :
 *   1. choisir une direction - trois telephones cote a cote ;
 *   2. l ajuster - variante, accent, forme, cadrage - avec un apercu vivant.
 *
 * Ce qui n est PAS reglable ici l est volontairement : espacements, tailles,
 * proportions, contrastes et animations appartiennent au design.
 */

type Settings = {
  engine: PremiumEngine;
  variant: string;
  accent: string | null;
  shape: PremiumShape;
  photo: PhotoFocus;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function previewUrl(s: Partial<Settings> & { engine: PremiumEngine }) {
  const q = new URLSearchParams({ key: s.engine });
  if (s.variant) q.set("variant", s.variant);
  if (s.accent) q.set("accent", s.accent);
  if (s.shape) q.set("shape", s.shape);
  if (s.photo) q.set("photo", s.photo);
  return `/preview/theme?${q.toString()}`;
}

export function DesignStudio({
  current,
  isLegacy,
  hasPhoto,
}: {
  current: Settings;
  /** Le profil utilise encore un theme de l ancienne collection. */
  isLegacy: boolean;
  hasPhoto: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<Settings>(current);
  const [draft, setDraft] = useState<Settings>(current);
  const [fullscreen, setFullscreen] = useState<PremiumEngine | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [family, setFamily] = useState<EngineFamily | "all">("all");
  const shown = PREMIUM_ENGINES.filter((e) => family === "all" || e.family === family);

  const engine = PREMIUM_ENGINES.find((e) => e.key === draft.engine)!;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || isLegacy;

  const persist = useCallback(
    async (next: Settings) => {
      const def = PREMIUM_ENGINES.find((e) => e.key === next.engine)!;
      const variant = def.variants.find((v) => v.key === next.variant) ?? def.variants[0];
      setMessage(null);

      const response = await fetch("/api/profile/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeKey: next.engine,
          variant: variant.key,
          accentColor: next.accent ?? variant.tokens.accent,
          mode: variant.tokens.scheme === "dark" ? "DARK" : "LIGHT",
          buttonStyle: "SOLID",
          customConfig: {
            shape: next.shape,
            photo: next.photo,
            ...(next.accent ? { accent: next.accent } : {}),
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setMessage({ ok: false, text: body?.error ?? "Enregistrement impossible." });
        return false;
      }
      setSaved(next);
      setMessage({ ok: true, text: "Design enregistré. Votre carte l’affiche dès maintenant." });
      startTransition(() => router.refresh());
      return true;
    },
    [router],
  );

  /** "Utiliser ce design" : reglages par defaut du design, enregistres aussitot. */
  function adopt(key: PremiumEngine, variant?: string) {
    const def = PREMIUM_ENGINES.find((e) => e.key === key)!;
    const next: Settings =
      key === saved.engine && !isLegacy && (!variant || variant === saved.variant)
        ? saved
        : {
            engine: key,
            variant: variant ?? def.variants[0].key,
            accent: null,
            shape: key === saved.engine ? saved.shape : def.defaultShape,
            photo: draft.photo,
          };
    setDraft(next);
    setFullscreen(null);
    startTransition(async () => {
      const ok = await persist(next);
      if (ok) document.getElementById("personnaliser")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-10">
      {isLegacy && (
        <p className="rounded-2xl border border-[var(--state-warn)]/25 bg-[var(--state-warn-bg)] px-4 py-3 text-[0.85rem] text-[var(--state-warn)]">
          Votre carte utilise encore un design de l’ancienne collection. Choisissez l’un des treize
          designs ci-dessous : vos informations et vos liens restent exactement les mêmes.
        </p>
      )}

      {/* ------------------------------------------ 1. Choisir une direction */}
      <section>
        <SectionTitle hint="Avec vos propres informations">Treize designs</SectionTitle>

        {/* Douze designs se choisissent mieux par intention que par defilement. */}
        <div role="tablist" aria-label="Familles de designs" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {[{ key: "all" as const, label: "Tous" }, ...FAMILIES].map((f) => {
            const count =
              f.key === "all" ? PREMIUM_ENGINES.length : PREMIUM_ENGINES.filter((e) => e.family === f.key).length;
            const on = family === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFamily(f.key)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8rem] font-medium transition-colors duration-200",
                  on
                    ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                    : "border-[var(--console-hairline)] bg-[var(--console-card)] hover:border-[var(--muted)]",
                )}
              >
                {f.label}
                <span className={cn("text-[0.7rem]", on ? "text-white/60" : "text-[var(--muted)]")}>{count}</span>
              </button>
            );
          })}
        </div>

        <ul className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-14 md:overflow-visible md:px-0 xl:grid-cols-3">
          {shown.map((e) => {
            const active = saved.engine === e.key && !isLegacy;
            return (
              <li key={e.key} className="group/card w-[280px] shrink-0 snap-center md:w-auto">
                {/* La scene : le design pose sur SA propre matiere (le fond de sa
                    premiere variante), avec un grain et une lumiere rasante. Pas
                    une carte blanche a bordure : c est le design qu on regarde. */}
                <button
                  type="button"
                  onClick={() => setFullscreen(e.key)}
                  aria-label={`Aperçu plein écran de ${e.name}`}
                  className={cn(
                    "relative block w-full overflow-hidden rounded-[22px] px-6 pb-0 pt-7 outline-none transition-[box-shadow,transform] duration-500 ease-[var(--ease-settle)] focus-visible:ring-2 focus-visible:ring-[var(--brand-copper)] focus-visible:ring-offset-4",
                    active ? "shadow-[0_0_0_2px_var(--brand-copper)]" : "hover:-translate-y-1",
                  )}
                  style={{
                    // Sur une matiere sombre, le chassis noir du telephone disparaitrait : on eclaircit la scene.
                    background:
                      e.variants[0]!.tokens.scheme === "dark"
                        ? `color-mix(in srgb, ${e.variants[0]!.tokens.bg} 80%, white)`
                        : e.variants[0]!.tokens.bg,
                  }}
                >
                  <span aria-hidden className="grain absolute inset-0 opacity-[0.1] mix-blend-multiply" />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, transparent 40%, rgba(0,0,0,0.10) 100%)" }}
                  />
                  {/* Le telephone sort du bas de la scene : on voit le haut de la carte, le reste se devine. */}
                  <span className="relative mx-auto block w-fit translate-y-2 transition-transform duration-500 ease-[var(--ease-settle)] group-hover/card:-translate-y-1">
                    <Device src={previewUrl(active ? saved : { engine: e.key })} width={220} height={430} interactive={false} lazy />
                  </span>
                  <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover/card:opacity-100">
                    <Maximize2 className="size-3.5" />
                  </span>
                </button>

                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-[1.45rem] leading-none tracking-[-0.02em]">{e.name}</h3>
                  {active ? (
                    <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-[var(--state-live)]">
                      <Check className="size-3" strokeWidth={3} />
                      Votre design
                    </span>
                  ) : (
                    <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]">{e.tags[0]}</span>
                  )}
                </div>
                <p className="mt-1.5 text-[0.8rem] leading-snug text-[var(--muted)]">{e.audience}</p>
                {/* Les variantes : la matiere de chacune, en pastilles. */}
                <div className="mt-3 flex items-center gap-1.5">
                  {e.variants.map((v) => (
                    <span key={v.key} title={v.name} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${v.tokens.bg} 50%, ${v.tokens.accent} 50%)` }} />
                  ))}
                  <span className="ml-1 text-[0.72rem] text-[var(--muted)]">
                    {e.variants.length} variante{e.variants.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => adopt(e.key)}
                    disabled={pending || active}
                    className="h-10 whitespace-nowrap rounded-full bg-[var(--brand-ink)] px-4 text-[0.82rem] font-semibold text-[var(--brand-paper)] transition-[transform,opacity] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                  >
                    {active ? "Utilisé" : "Utiliser ce design"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreen(e.key)}
                    className="h-10 text-[0.82rem] font-medium underline-offset-4 hover:underline"
                  >
                    Aperçu
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------- 2. Personnaliser */}
      <section id="personnaliser" className="scroll-mt-6">
        <SectionTitle hint={engine.name}>Personnaliser</SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <Surface className="space-y-8">
            <Field label="Variante" hint="Quatre ambiances pour la même composition.">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {engine.variants.map((v) => {
                  const on = draft.variant === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setDraft({ ...draft, variant: v.key, accent: null })}
                      aria-pressed={on}
                      className={cn(
                        "rounded-2xl border p-2 text-left transition-all duration-200",
                        on
                          ? "border-[var(--brand-ink)] shadow-[0_0_0_1px_var(--brand-ink)]"
                          : "border-[var(--console-hairline)] hover:border-[var(--muted)]",
                      )}
                    >
                      {/* Echantillon : le fond, l encre et l accent de la variante,
                          composes comme une page plutot qu en trois pastilles. */}
                      <span
                        className="relative block h-16 overflow-hidden rounded-xl"
                        style={{ background: v.tokens.bg }}
                      >
                        <span className="absolute left-2.5 top-2.5 block h-1.5 w-9 rounded-full" style={{ background: v.tokens.ink }} />
                        <span className="absolute left-2.5 top-5 block h-1 w-14 rounded-full opacity-50" style={{ background: v.tokens.ink }} />
                        <span className="absolute inset-x-2.5 bottom-2.5 block h-3 rounded-[4px]" style={{ background: v.tokens.ctaBg }} />
                        <span className="absolute right-2.5 top-2.5 block size-2 rounded-full" style={{ background: v.tokens.accent }} />
                      </span>
                      <span className="mt-2 block px-1 text-[0.82rem] font-semibold">{v.name}</span>
                      <span className="block truncate px-1 pb-0.5 text-[0.7rem] text-[var(--muted)]">{v.mood}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Couleur d’accent" hint="Réservée aux détails : le design garde ses contrastes.">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, accent: null })}
                  aria-pressed={draft.accent === null}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-[0.78rem] font-medium transition-colors",
                    draft.accent === null
                      ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                      : "border-[var(--console-hairline)] hover:border-[var(--muted)]",
                  )}
                >
                  Celle de la variante
                </button>
                {engine.palette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft({ ...draft, accent: c })}
                    aria-label={`Accent ${c}`}
                    aria-pressed={draft.accent === c}
                    className={cn(
                      "size-9 rounded-full ring-offset-2 ring-offset-[var(--console-card)] transition-all duration-200",
                      draft.accent === c ? "ring-2 ring-[var(--brand-ink)]" : "ring-1 ring-black/10 hover:scale-105",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Field>

            <Field label="Forme des boutons">
              <div className="grid grid-cols-3 gap-2.5">
                {SHAPES.map((s) => {
                  const on = draft.shape === s.key;
                  const radius = { soft: "8px", pill: "999px", sharp: "2px" }[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setDraft({ ...draft, shape: s.key })}
                      aria-pressed={on}
                      className={cn(
                        "flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-3.5 transition-all duration-200",
                        on
                          ? "border-[var(--brand-ink)] shadow-[0_0_0_1px_var(--brand-ink)]"
                          : "border-[var(--console-hairline)] hover:border-[var(--muted)]",
                      )}
                    >
                      <span className="block h-5 w-16 bg-[var(--brand-ink)]" style={{ borderRadius: radius }} />
                      <span className="text-[0.8rem] font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {hasPhoto && (
              <Field label="Cadrage de la photo" hint="Où tombe votre visage dans le cadre.">
                <div className="inline-grid grid-cols-3 rounded-xl border border-[var(--console-hairline)] p-1">
                  {(
                    [
                      ["top", "Haut"],
                      ["center", "Centre"],
                      ["bottom", "Bas"],
                    ] as [PhotoFocus, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDraft({ ...draft, photo: key })}
                      aria-pressed={draft.photo === key}
                      className={cn(
                        "h-9 rounded-lg px-4 text-[0.82rem] font-medium transition-colors duration-200",
                        draft.photo === key ? "bg-[var(--brand-ink)] text-[var(--brand-paper)]" : "hover:bg-[var(--console-paper)]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Contenu" hint="Ce qui s’affiche se règle à la source, une fois pour tous les designs.">
              <ul className="grid gap-2 sm:grid-cols-3">
                {[
                  ["/dashboard/profile", "Photo et couverture"],
                  ["/dashboard/links", "Ordre des liens"],
                  ["/dashboard/profile", "Sections visibles"],
                ].map(([href, label]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex items-center justify-between rounded-xl border border-[var(--console-hairline)] px-3.5 py-3 text-[0.84rem] transition-colors hover:bg-[var(--console-paper)]"
                    >
                      {label}
                      <ArrowUpRight className="size-3.5 opacity-40 transition-opacity group-hover:opacity-80" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Field>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--console-hairline)] pt-6">
              <button
                type="button"
                onClick={() => startTransition(async () => void (await persist(draft)))}
                disabled={!dirty || pending}
                className="tap-target rounded-xl bg-[var(--brand-copper)] px-6 text-[0.9rem] font-semibold text-[#231206] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </button>
              {dirty && !pending && (
                <button
                  type="button"
                  onClick={() => setDraft(saved)}
                  className="tap-target px-3 text-[0.85rem] text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Annuler les changements
                </button>
              )}
              <AnimatePresence>
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24, ease: EASE }}
                    className={cn("text-[0.84rem]", message.ok ? "text-[var(--state-live)]" : "text-[var(--state-stop)]")}
                  >
                    {message.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </Surface>

          {/* Apercu vivant : il suit chaque reglage avant meme l enregistrement. */}
          <div className="hidden lg:sticky lg:top-6 lg:block">
            <Device src={previewUrl(draft)} width={288} height={590} />
            <p className="mt-3 text-center text-[0.72rem] text-[var(--muted)]">
              {dirty ? "Aperçu non enregistré" : "Tel qu’il s’affiche au scan"}
            </p>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {fullscreen && (
          <FullscreenPreview
            engineKey={fullscreen}
            initialVariant={saved.engine === fullscreen ? saved.variant : undefined}
            onClose={() => setFullscreen(null)}
            onUse={(variant) => adopt(fullscreen, variant)}
            pending={pending}
            active={saved.engine === fullscreen && !isLegacy}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.86rem] font-semibold">{label}</p>
      {hint && <p className="mt-0.5 text-[0.76rem] text-[var(--muted)]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * Telephone contenant le rendu reel, a 390 px puis mis a l echelle.
 *
 * Au changement d adresse, l ancien rendu reste visible puis cede la place au
 * nouveau en fondu : passer d une variante a l autre se voit comme une
 * transition, jamais comme un ecran blanc.
 */
function Device({
  src,
  width,
  height,
  interactive = true,
  lazy = false,
}: {
  src: string;
  width: number;
  height: number;
  /** Miniature d une carte : l iframe capterait le clic destine au bouton. */
  interactive?: boolean;
  /**
   * Ne charger l apercu qu a l approche de l ecran. Douze iframes chargees
   * d un coup, c est douze pages completes a rendre avant que le studio
   * reponde.
   */
  lazy?: boolean;
}) {
  const scale = width / 390;
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

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
        onLoad={() =>
          setSlots((s) => (s[slot] === src && s.front !== slot ? { ...s, front: slot } : s))
        }
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
      className="relative rounded-[2.4rem] bg-[#0b0b0d] p-[7px] shadow-[0_2px_6px_rgb(0_0_0/0.08),0_30px_70px_-34px_rgb(0_0_0/0.55)]"
      style={{ width: width + 14 }}
    >
      <div ref={holder} className="relative overflow-hidden rounded-[2rem] bg-[#111]" style={{ width, height }}>
        {visible ? (
          <>
            {layer("a")}
            {layer("b")}
          </>
        ) : (
          <span aria-hidden className="pc-skeleton absolute inset-0 text-white" />
        )}
      </div>
    </div>
  );
}

function FullscreenPreview({
  engineKey,
  initialVariant,
  onClose,
  onUse,
  pending,
  active,
}: {
  engineKey: PremiumEngine;
  initialVariant?: string;
  onClose: () => void;
  onUse: (variant: string) => void;
  pending: boolean;
  active: boolean;
}) {
  const engine = PREMIUM_ENGINES.find((e) => e.key === engineKey)!;
  const [variant, setVariant] = useState(initialVariant ?? engine.variants[0].key);
  const src = useMemo(() => previewUrl({ engine: engineKey, variant }), [engineKey, variant]);
  const [viewport, setViewport] = useState({ w: 390, h: 844 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Au telephone, l apercu occupe l ecran entier ; ailleurs, un appareil a
  // taille reelle, borne par la hauteur disponible.
  const mobile = viewport.w < 640;
  const deviceHeight = Math.min(844, viewport.h - 180);
  const deviceWidth = Math.round((deviceHeight * 390) / 844);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${engine.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0c]/92 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold">{engine.name}</p>
          <p className="text-[0.74rem] text-white/55">{engine.tags.join(" · ")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l’aperçu"
          className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="size-4" />
        </button>
      </div>

      <motion.div
        className="flex min-h-0 flex-1 items-center justify-center"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {mobile ? (
          <iframe key={src} src={src} title={`Aperçu de ${engine.name}`} className="size-full border-0 bg-white" />
        ) : (
          <Device src={src} width={deviceWidth} height={deviceHeight} />
        )}
      </motion.div>

      <div className="flex flex-col items-center gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:justify-center">
        <div className="flex gap-1.5 rounded-full bg-white/8 p-1">
          {engine.variants.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVariant(v.key)}
              aria-pressed={variant === v.key}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-3 text-[0.78rem] font-medium transition-colors duration-200",
                variant === v.key ? "bg-white text-[#0a0a0c]" : "text-white/70 hover:text-white",
              )}
            >
              <span className="size-3 rounded-full ring-1 ring-white/25" style={{ background: v.tokens.bg }} />
              {v.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onUse(variant)}
          disabled={pending || (active && variant === initialVariant)}
          className="h-11 rounded-full bg-[var(--brand-copper)] px-6 text-[0.88rem] font-semibold text-[#231206] disabled:opacity-50"
        >
          {active && variant === initialVariant ? "Design actuel" : "Utiliser ce design"}
        </button>
      </div>
    </motion.div>
  );
}
