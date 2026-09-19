import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationSection, InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { HeroCta, RsvpBlock, SectionBody, countdownText, delay, monogram, salutation, type SectionStyles } from "../../shared";
import { cityOf, monthNumber } from "../../stationery";
import { playfair } from "../fonts";
import { Bloom, Loop, Spray } from "./flora";
import { romanticScript } from "./font";

/**
 * ROMANTIC - poudre, pivoines au trait, une seule plume.
 *
 * Le parti pris : un premier ecran SANS photo, tout en papier poudre - un
 * halo rose derriere les prenoms, deux bouquets de pivoines dessines au trait
 * qui se tracent a l ouverture. La photographie vient plus tard, dans un
 * medaillon ovale, comme un portrait qu on garde.
 *
 * La calligraphie (Ballet, une anglaise contemporaine) est LIMITEE : les
 * prenoms, puis la signature sous le mot des maries. Rien d autre. Titres en
 * Playfair italique, texte en Geist.
 *
 * Signatures : le calendrier du mois avec le jour entoure a la main ; les
 * lieux et la reponse sous des arches douces (ellipses, sans bordure ni
 * ombre) ; le programme centre, heure en italique.
 *
 * Parcours : ouverture -> mot des maries -> calendrier -> lieux -> programme
 * -> portrait -> reponse -> informations.
 */

type Palette = { bg: string; paper: string; blush: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string; flower: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "blush" | "ink" | "ink2" | "line">> = {
  poudre: { bg: "#F8EEEA", paper: "#FCF6F3", blush: "#F1DCD5", ink: "#3B2A2F", ink2: "#6E5760", line: "#E8D5CF" },
  bordeaux: { bg: "#3A1E25", paper: "#452630", blush: "#532E38", ink: "#F8EDEA", ink2: "#D8BFC5", line: "#5C3842" },
};

/** [aplat du bouton, texte d accent, texte sur bouton, trait des fleurs] - textes >= 4,5:1. */
const ACCENTS: Record<string, { poudre: [string, string, string, string]; bordeaux: [string, string, string, string] }> = {
  rose: { poudre: ["#9C4A57", "#914250", "#FFFFFF", "#C98A93"], bordeaux: ["#EBA6B1", "#F2BCC5", "#3A1E25", "#D78E9A"] },
  peche: { poudre: ["#A2552F", "#94492A", "#FFFFFF", "#D39A7C"], bordeaux: ["#EDAE8C", "#F4C4AA", "#3A1E25", "#DB9A78"] },
  mauve: { poudre: ["#73567B", "#6A4E72", "#FFFFFF", "#AD93B4"], bordeaux: ["#CDB2D5", "#DDC8E3", "#3A1E25", "#B79BC0"] },
};

function palette(variant: string, accent: string): Palette & { dark: boolean } {
  const v = (VARIANTS[variant] ? variant : "poudre") as "poudre" | "bordeaux";
  const [a, accentText, onAccent, flower] = (ACCENTS[accent] ?? ACCENTS.rose!)[v];
  return { ...VARIANTS[v]!, accent: a, accentText, onAccent, flower, dark: v === "bordeaux" };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Vous êtes invité",
  CORPORATE: "Invitation",
  MEMORIAL: "En mémoire de",
  OTHER: "Invitation",
};

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "De tous les jours que nous partagerons, celui-ci sera le premier d’une longue histoire. Nous aimerions l’écrire entourés de vous.",
  BIRTHDAY: "Une année de plus, et l’envie de la fêter avec vous, tout simplement.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const serif = "[font-family:var(--inv-playfair)]";
/** Axe optique au plus bas : les deliés s epaississent, la plume reste lisible en grand. */
const script = "[font-family:var(--ro-script)] font-normal [font-variation-settings:'opsz'_16]";
const caps = "text-[11px] font-semibold uppercase tracking-[0.26em]";

/** La plume prend de la place : l echelle reste plus sage qu une serif. */
function nameSize(longest: number): string {
  if (longest <= 7) return "text-[clamp(52px,15.5vw,70px)]";
  if (longest <= 10) return "text-[clamp(44px,12.5vw,58px)]";
  if (longest <= 15) return "text-[clamp(34px,9.6vw,44px)]";
  if (longest <= 22) return "text-[clamp(28px,7.8vw,36px)]";
  return "text-[clamp(25px,6.8vw,30px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--ro-accent)] px-6 text-[14.5px] font-medium tracking-[0.02em] text-[var(--ro-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ro-accent)]";

const styles: SectionStyles = {
  heading: cn(serif, "text-[32px] italic leading-[1.1]"),
  body: "text-[16px] leading-relaxed text-[var(--ro-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ro-ink-2)]",
  label: cn(caps, "text-[10.5px] text-[var(--ro-accent-text)]"),
  rule: "divide-[var(--ro-line)] border-[var(--ro-line)]",
  emphasis: cn(serif, "text-[22px] leading-[1.2]"),
  link: "inline-flex items-center gap-1.5 text-[13px] font-medium underline decoration-[var(--ro-accent)] underline-offset-[6px] transition-opacity hover:opacity-70",
};

/** Arche douce : une ellipse en tete, aucun cadre. */
const arch = "rounded-b-[28px] rounded-tl-[50%_120px] rounded-tr-[50%_120px] bg-[var(--ro-paper)]";

const DRAW_CSS =
  ".ro-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ro-draw 1.9s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*35ms + 200ms)}@keyframes ro-draw{to{stroke-dashoffset:0}}[data-sealed] .ro-draw{animation-play-state:paused}";

export function Romantic({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const city = cityOf(view);
  const longest = Math.max(...event.hostParts.map((h) => h.length));

  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : WELCOME[event.type];
  const programs = sections.filter((s) => s.kind === "program");
  const infos = sections.filter((s) => s !== wordSection && s.kind !== "program");

  const style = {
    "--ro-bg": p.bg,
    "--ro-paper": p.paper,
    "--ro-blush": p.blush,
    "--ro-ink": p.ink,
    "--ro-ink-2": p.ink2,
    "--ro-line": p.line,
    "--ro-accent": p.accent,
    "--ro-accent-text": p.accentText,
    "--ro-on-accent": p.onAccent,
    "--ro-flower": p.flower,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": p.dark ? "#4A2A33" : "#F0DDD7",
    "--env-fold": p.dark ? "#42252D" : "#EAD3CC",
    "--env-flap": p.dark ? "#55343E" : "#E3C8C0",
    "--env-edge": p.dark ? "#6B4550" : "#D1B0A7",
    "--env-card": "#FCF6F3",
    "--env-card-ink": "#3B2A2F",
    "--env-liner": p.flower,
    "--env-seal": p.accent,
    "--env-seal-ink": p.onAccent,
    "--env-font": "var(--inv-playfair)",
    "--env-script": "var(--ro-script)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.paper,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.line,
    "--rsvp-rule": p.accent,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": p.dark ? "#F0A39C" : "#A8342D",
    "--rsvp-font": "var(--inv-playfair)",
  } as React.CSSProperties;

  return (
    <main
      style={style}
      className={cn(
        playfair.variable,
        romanticScript.variable,
        "relative min-h-dvh overflow-x-clip bg-[var(--ro-bg)] font-[family-name:var(--app-font-sans)] text-[var(--ro-ink)] antialiased",
        p.dark ? "[color-scheme:dark]" : "[color-scheme:light]",
      )}
    >
      <style>{DRAW_CSS}</style>
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={monogram(view)} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        {/* ------------------------------------------------ OUVERTURE -- */}
        <header className="relative isolate flex min-h-[100svh] flex-col items-center px-6 pb-6 pt-[max(20px,env(safe-area-inset-top))] text-center">
          <span
            aria-hidden
            className="absolute left-1/2 top-[20%] -z-10 size-[min(96vw,420px)] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, var(--ro-blush) 0%, color-mix(in srgb, var(--ro-blush) 60%, transparent) 42%, transparent 70%)" }}
          />
          <Spray draw className="pointer-events-none absolute -right-14 -top-4 -z-10 w-[200px] rotate-[100deg] text-[var(--ro-flower)]" />
          <Spray draw className="pointer-events-none absolute -left-16 bottom-[20%] -z-10 w-[170px] -rotate-[70deg] text-[var(--ro-flower)]" />

          {dear ? (
            <p className={cn(serif, "pc-fade mt-2 flex max-w-[82%] items-center gap-3 text-[16px] italic leading-snug text-[var(--ro-ink-2)]")} style={delay(0)}>
              {dear.length <= 26 && <span aria-hidden className="h-px w-6 shrink-0 bg-[var(--ro-flower)]" />}
              <span className="[text-wrap:balance]">Pour {dear}</span>
              {dear.length <= 26 && <span aria-hidden className="h-px w-6 shrink-0 bg-[var(--ro-flower)]" />}
            </p>
          ) : (
            <span />
          )}
          {event.updatedNote && <p className={cn(caps, "pc-fade mt-3 text-[10px] text-[var(--ro-accent-text)]")}>{event.updatedNote}</p>}

          <div className="min-h-6 flex-1" />

          <p className={cn(caps, "pc-fade text-[var(--ro-accent-text)]")} style={delay(80)}>
            {EYEBROW[event.type]}
          </p>
          <h1 className={cn(script, "mt-5 w-full")}>
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn(nameSize(longest), "block leading-[1.15] [overflow-wrap:anywhere]")}>{event.hostParts[0]}</span>
                <span className={cn(serif, "block text-[26px] italic leading-none text-[var(--ro-accent-text)]")}>&amp;</span>
                <span className={cn(nameSize(longest), "block leading-[1.15] [overflow-wrap:anywhere]")}>{event.hostParts[1]}</span>
              </>
            ) : (
              <span className={cn(nameSize(longest), "block leading-[1.2] [overflow-wrap:anywhere] [text-wrap:balance]")}>{event.hostParts[0]}</span>
            )}
          </h1>

          <p className={cn(serif, "mt-6 text-[clamp(20px,5.8vw,23px)] leading-snug")}>
            {starts.weekday} {starts.day} {starts.month} {starts.year}
          </p>
          <p className={cn(serif, "mt-1 text-[16px] italic text-[var(--ro-ink-2)]")}>
            à {starts.time}
            {city && <> · {city}</>}
          </p>
          {theme.settings.countdown && event.daysLeft !== null && (
            <p className={cn(caps, "mt-3 text-[10px] text-[var(--ro-accent-text)]")}>{countdownText(event.daysLeft)}</p>
          )}

          <div className="min-h-6 flex-1" />
          <HeroCta view={view} id="ro-hero-cta" button={button} className="max-w-[340px]" noteClassName="text-[var(--ro-ink-2)]" />
        </header>

        {/* ---------------------------------------------------- LE MOT -- */}
        <section className="pc-inview px-8 pb-16 pt-16 text-center">
          <Bloom className="mx-auto size-9 text-[var(--ro-flower)]" />
          <p className={cn(serif, "mx-auto mt-7 max-w-[19rem] whitespace-pre-line text-[clamp(21px,5.8vw,24px)] italic leading-[1.55] [text-wrap:pretty]")}>{word}</p>
          {event.type === "WEDDING" && <p className={cn(script, "mt-7 text-[34px] leading-[1.3] text-[var(--ro-accent-text)]")}>{event.hostParts.join(" & ")}</p>}
        </section>

        <div className="px-5">
          {/* ------------------------------------------- CALENDRIER -- */}
          <section className="pc-inview mb-20 text-center">
            <Heading kicker="Réservez la date" title="Le jour" />
            <Calendar view={view} />
            <p className={cn(serif, "mt-7 text-[20px]")}>
              {starts.weekday} {starts.day} {starts.month}, <span className="italic text-[var(--ro-ink-2)]">à {starts.time}</span>
            </p>
            {theme.settings.countdown && event.daysLeft !== null && <p className={cn(caps, "mt-2 text-[10px] text-[var(--ro-accent-text)]")}>{countdownText(event.daysLeft)}</p>}
          </section>

          {/* ------------------------------------------------ LIEUX -- */}
          {venues.length > 0 && (
            <section className="pc-inview mb-20 text-center">
              <Heading kicker={venues.length > 1 ? "Où nous retrouver" : "Où nous retrouver"} title={venues.length > 1 ? "Les lieux" : "Le lieu"} />
              <ul className="space-y-5">
                {venues.map((venue) => (
                  <li key={`${venue.label}-${venue.name}`} className={cn(arch, "px-6 pb-9 pt-14")}>
                    <p className={styles.label}>
                      {venue.label}
                      {venue.time && <span className="tracking-[0.14em]"> · {venue.time}</span>}
                    </p>
                    <p className={cn(serif, "mt-3 text-[23px] leading-[1.2] [overflow-wrap:anywhere]")}>{venue.name}</p>
                    <p className={cn("mt-2", styles.muted)}>{venue.address}</p>
                    {venue.landmark && <p className={cn("mt-1 italic", styles.muted)}>{venue.landmark}</p>}
                    <a href={view.preview ? undefined : venue.directionsUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-3 min-h-11", styles.link)}>
                      Itinéraire
                      <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.5} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --------------------------------------------- PROGRAMME -- */}
          {programs.map((s) => (
            <section key={s.id} className="pc-inview mb-20 text-center">
              <Heading kicker="Au fil de la journée" title={s.title} />
              <Program section={s} />
            </section>
          ))}
        </div>

        {/* ------------------------------------------------ PORTRAIT -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview relative mb-20 px-5 pt-4">
            <div className="relative mx-auto aspect-[3/4] w-[78%] overflow-hidden rounded-[50%] bg-[var(--ro-blush)]">
              <div className="pc-parallax absolute inset-0">
                <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 78vw, 340px" className="object-cover" />
              </div>
            </div>
            <Spray className="pointer-events-none absolute bottom-12 left-1 w-[140px] text-[var(--ro-flower)]" />
            <Spray className="pointer-events-none absolute -top-2 right-0 w-[120px] rotate-180 text-[var(--ro-flower)]" />
            <figcaption className={cn(serif, "mt-8 text-center text-[16px] italic text-[var(--ro-ink-2)]")}>{event.hostParts.join(" & ")}</figcaption>
          </figure>
        )}

        {/* ------------------------------------------------- REPONSE -- */}
        <div className={cn(arch, "pc-inview mx-3 px-6 pb-12 pt-16")}>
          <RsvpBlock
            view={view}
            rsvpForm={rsvpForm}
            rsvpStyle={rsvpStyle}
            styles={styles}
            button={button}
            title={
              <>
                <Bloom className="mx-auto size-9 text-[var(--ro-flower)]" />
                <p className={cn(caps, "mt-4 text-[10px] text-[var(--ro-accent-text)]")}>R.S.V.P.</p>
                <h2 className={cn(styles.heading, "mt-2 text-[34px]")}>Votre réponse</h2>
              </>
            }
          />
        </div>

        {/* ------------------------------------------- INFORMATIONS -- */}
        <div className="px-5 pt-20">
          {infos.map((s, i) => (
            <section key={s.id} className="pc-inview mb-16 text-center">
              <Heading kicker={i === 0 ? "À savoir" : undefined} title={s.title} />
              <SectionBody section={s} styles={styles} />
            </section>
          ))}

          <footer className="relative mt-8 pb-4 text-center">
            <Bloom className="mx-auto size-10 text-[var(--ro-flower)]" />
            <p className={cn(serif, "mt-4 text-[30px] italic leading-none")}>Merci</p>
            <p className={cn(caps, "mt-3 text-[10px] text-[var(--ro-ink-2)]")}>
              {event.hostParts.join(" & ")} · {starts.day} {starts.month} {starts.year}
            </p>
          </footer>
        </div>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="ro-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="bg-[color-mix(in_srgb,var(--ro-bg)_90%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

function Heading({ kicker, title }: { kicker?: string; title: string | null }) {
  return (
    <header className="mb-9">
      <span aria-hidden className="mx-auto flex items-center justify-center gap-3 text-[var(--ro-flower)]">
        <span className="h-px w-8 bg-current" />
        <Bloom className="size-6" />
        <span className="h-px w-8 bg-current" />
      </span>
      {kicker && <p className={cn(caps, "mt-4 text-[10px] text-[var(--ro-accent-text)]")}>{kicker}</p>}
      {title && <h2 className={cn(styles.heading, "mt-2 [overflow-wrap:anywhere]")}>{title}</h2>}
    </header>
  );
}

/** Le mois en grille, le jour entoure d un trait de plume. */
function Calendar({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  const m = Number(monthNumber(starts.month));
  const y = Number(starts.year);
  const day = Number(starts.day);
  if (!Number.isFinite(m) || !Number.isFinite(y)) return null;
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)];
  return (
    <div className="mx-auto max-w-[320px]">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden>
        <p className={cn(serif, "text-[22px] italic")}>
          {starts.month} {starts.year}
        </p>
        <div className="mt-5 grid grid-cols-7 gap-y-1.5 border-t border-[var(--ro-line)] pt-4">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className={cn(caps, "pb-2 text-[10px] tracking-[0.1em] text-[var(--ro-ink-2)]")}>
              {d}
            </span>
          ))}
          {cells.map((c, i) => (
            <span key={i} className={cn("relative flex h-9 items-center justify-center text-[15px] tabular-nums", serif, c === day ? "font-semibold text-[var(--ro-accent-text)]" : "text-[var(--ro-ink)]")}>
              {c}
              {c === day && <Loop className="absolute left-1/2 top-1/2 w-[46px] -translate-x-1/2 -translate-y-1/2 text-[var(--ro-accent)]" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Programme centre : l heure en italique, le libelle dessous, un point entre deux. */
function Program({ section }: { section: InvitationSection }) {
  if (section.kind !== "program") return null;
  return (
    <ol className="mx-auto max-w-[320px]">
      {section.data.items.map((item, i) => (
        <li key={i} className="flex flex-col items-center">
          {i > 0 && <span aria-hidden className="my-4 size-1 rounded-full bg-[var(--ro-flower)]" />}
          <span className={cn(serif, "whitespace-nowrap text-[22px] italic leading-none tabular-nums text-[var(--ro-accent-text)]")}>{item.time.replace(":", " h ")}</span>
          <span className={cn("mt-2 [overflow-wrap:anywhere] [text-wrap:balance]", styles.body)}>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}
