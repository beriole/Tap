"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Loader2, Maximize2, RotateCw } from "lucide-react";
import {
  FAMILIES,
  PREMIUM_ENGINES,
  SHAPES,
  type EngineFamily,
  type PhotoFocus,
  type PremiumEngine,
} from "@/config/premium-themes";
import { Device, EASE, FullscreenPreview, TWO_SIDED, previewUrl, type Settings } from "./design-preview";
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
  /** Design en cours d enregistrement, puis celui qui vient d etre applique. */
  const [applying, setApplying] = useState<PremiumEngine | null>(null);
  const [justApplied, setJustApplied] = useState<PremiumEngine | null>(null);
  const reduced = useReducedMotion();
  const shown = PREMIUM_ENGINES.filter((e) => family === "all" || e.family === family);

  const engine = PREMIUM_ENGINES.find((e) => e.key === draft.engine)!;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || isLegacy;

  const persist = useCallback(
    async (next: Settings): Promise<string | null> => {
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
        const text: string = body?.error ?? "Enregistrement impossible.";
        setMessage({ ok: false, text });
        return text;
      }
      setSaved(next);
      setMessage({ ok: true, text: "Design enregistré. Votre carte l’affiche dès maintenant." });
      startTransition(() => router.refresh());
      return null;
    },
    [router],
  );

  useEffect(() => {
    if (!justApplied) return;
    const t = window.setTimeout(() => setJustApplied(null), 2800);
    return () => window.clearTimeout(t);
  }, [justApplied]);

  const toCustomize = () =>
    document.getElementById("personnaliser")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  /** "Utiliser ce design" : reglages par defaut du design, enregistres aussitot. */
  async function apply(key: PremiumEngine, variant?: string) {
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
    setApplying(key);
    const error = await persist(next);
    setApplying(null);
    if (!error) setJustApplied(key);
    return error;
  }

  /** Depuis le catalogue : on reste sur la carte, qui confirme sur place. */
  function adopt(key: PremiumEngine) {
    startTransition(async () => void (await apply(key)));
  }

  /**
   * Depuis l apercu : le bouton confirme "Design applique" dans la scene,
   * puis la scene se retire et on descend vers les reglages.
   */
  async function adoptFromPreview(key: PremiumEngine, variant: string) {
    const error = await apply(key, variant);
    if (!error) {
      window.setTimeout(
        () => {
          setFullscreen(null);
          window.setTimeout(toCustomize, 320);
        },
        reduced ? 500 : 1100,
      );
    }
    return error;
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
            const busy = applying === e.key;
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
                  {TWO_SIDED.has(e.key) && (
                    <span className="absolute left-3 top-3 z-[4] flex h-6 items-center gap-1 rounded-full bg-black/45 px-2.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-white backdrop-blur">
                      <RotateCw aria-hidden className="size-3" />
                      Recto · verso
                    </span>
                  )}
                  <span className="absolute right-3 top-3 z-[4] flex size-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
                    <Maximize2 className="size-3.5" />
                  </span>
                  {/* Confirmation sur place : le design vient d etre applique. */}
                  <AnimatePresence>
                    {justApplied === e.key && (
                      <motion.span
                        role="status"
                        className="absolute inset-x-0 bottom-5 z-[4] mx-auto flex h-9 w-fit items-center gap-1.5 rounded-full bg-[var(--brand-ink)] px-4 text-[0.78rem] font-semibold text-[var(--brand-paper)] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]"
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 28 }}
                      >
                        <Check className="size-3.5 text-[var(--state-live)]" strokeWidth={3} />
                        Design appliqué
                      </motion.span>
                    )}
                  </AnimatePresence>
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
                    disabled={pending || applying !== null || active}
                    aria-busy={busy}
                    className={cn(
                      "flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--brand-ink)] px-4 text-[0.82rem] font-semibold text-[var(--brand-paper)] transition-[transform,opacity] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-copper)] disabled:translate-y-0",
                      !busy && "disabled:opacity-40",
                    )}
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />}
                    {busy ? "Application…" : active ? "Utilisé" : "Utiliser ce design"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreen(e.key)}
                    className="h-11 px-1 text-[0.82rem] font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-copper)]"
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
                onClick={() =>
                  startTransition(async () => {
                    if (!(await persist(draft))) setJustApplied(draft.engine);
                  })
                }
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
            key={fullscreen}
            engineKey={fullscreen}
            initialVariant={saved.engine === fullscreen ? saved.variant : undefined}
            onClose={() => setFullscreen(null)}
            onUse={(variant) => adoptFromPreview(fullscreen, variant)}
            disabled={pending || applying !== null}
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
