import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { EYEBROW_BY_TYPE, HeroCta, HostNames, NAME_SCALE, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";

/**
 * PEARL - presque rien.
 *
 * Le parti pris : aucune police de titrage, aucun ornement. Geist en graisse
 * legere, tres grand, tres espace ; un fond blanc chaud ; et LA signature : une
 * perle - un disque de lumiere en degrade radial, pose derriere les noms, qui
 * donne au premier ecran sa profondeur sans un seul trait dessine.
 *
 * Les sections sont posees sur des panneaux blancs translucides (une couche
 * de blanc a 60 % sur le fond, un filet de gris perle) : la "transparence
 * legere" du cahier, sans flou couteux. Tout est centre, tout est calme.
 */

type Palette = { bg: string; panel: string; ink: string; ink2: string; line: string; accent: string; pearl: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "panel" | "ink" | "ink2" | "line" | "pearl">> = {
  perle: { bg: "#F7F5F1", panel: "rgba(255,255,255,0.62)", ink: "#26272B", ink2: "#66686E", line: "#E3E0DA", pearl: "#FFFFFF" },
  brume: { bg: "#E6E4DF", panel: "rgba(255,255,255,0.5)", ink: "#26272B", ink2: "#5E6066", line: "#D3D0C9", pearl: "#F7F5F1" },
};

/** Texte d accent : 4,5:1 sur les DEUX fonds, donc calibre sur le plus sombre (brume). */
const ACCENTS: Record<string, string> = { argent: "#63646A", rose: "#7C534E", bleu: "#5C6673" };

function palette(variant: string, accent: string): Palette {
  return { ...(VARIANTS[variant] ?? VARIANTS.perle!), accent: ACCENTS[accent] ?? ACCENTS.argent! };
}

const caps = "text-[11px] font-medium uppercase tracking-[0.34em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--pl-ink)] px-6 text-[14px] font-medium tracking-[0.02em] text-[var(--pl-bg)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pl-ink)]";

const styles: SectionStyles = {
  heading: "text-[26px] font-light leading-tight tracking-[-0.01em]",
  body: "text-[16px] leading-relaxed text-[var(--pl-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--pl-ink-2)]",
  label: cn(caps, "text-[var(--pl-accent)]"),
  rule: "divide-[var(--pl-line)] border-[var(--pl-line)]",
  emphasis: "text-[21px] font-light leading-[1.2]",
  link: "border-b border-[var(--pl-ink)] text-[13px] font-medium tracking-[0.04em] transition-colors hover:text-[var(--pl-accent)]",
};

export function Pearl({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      mainClassName="bg-[var(--pl-bg)] text-[var(--pl-ink)]"
      vars={{ "--pl-bg": p.bg, "--pl-panel": p.panel, "--pl-ink": p.ink, "--pl-ink-2": p.ink2, "--pl-line": p.line, "--pl-accent": p.accent, "--pl-pearl": p.pearl }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#EFECE6", "--env-fold": "#E8E4DD", "--env-flap": "#E2DED6", "--env-edge": "#CFCAC1",
        "--env-card": "#FFFFFF", "--env-card-ink": p.ink, "--env-liner": p.line, "--env-seal": p.ink, "--env-seal-ink": p.bg, "--env-font": "var(--app-font-sans)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="pl-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[var(--pl-bg)]/90 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
      hero={
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col items-center justify-center py-10 text-center">
          {/* La perle : un disque de lumiere, derriere les noms. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[38%] size-[min(78vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle at 42% 38%, var(--pl-pearl) 0%, color-mix(in srgb, var(--pl-pearl) 55%, transparent) 45%, transparent 72%)" }}
          />
          {event.updatedNote && <p className={cn(caps, "pc-fade relative mb-6 text-[10px] text-[var(--pl-accent)]")}>{event.updatedNote}</p>}
          {dear && (
            <p className="pc-fade relative mb-7 text-[14px] text-[var(--pl-ink-2)]" style={delay(0)}>
              {dear}
            </p>
          )}
          <p className={cn(caps, "pc-fade relative text-[var(--pl-accent)]")} style={delay(80)}>
            {EYEBROW_BY_TYPE[event.type]}
          </p>
          <h1 className="relative mt-8 font-light tracking-[-0.03em]">
            <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), NAME_SCALE)} lineClassName="leading-[0.98]" separator={<span className="my-3 block text-[15px] font-normal tracking-[0.34em] text-[var(--pl-accent)]">&amp;</span>} />
          </h1>
          <div className="relative mt-9 w-full">
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <p aria-hidden className="text-[clamp(20px,5.8vw,24px)] font-light tracking-[0.02em]">
              {starts.weekday} {starts.day} {starts.month} {starts.year}
            </p>
            <p aria-hidden className={cn(caps, "pc-fade mt-3 text-[var(--pl-ink-2)]")} style={delay(400)}>
              {starts.time}
            </p>
          </div>
          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade relative mt-4 text-[13.5px] text-[var(--pl-accent)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}
          <HeroCta view={view} id="pl-hero-cta" button={button} className="relative mt-10 max-w-[300px]" noteClassName="text-[var(--pl-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-14 mt-6 overflow-hidden rounded-[32px] bg-[var(--pl-panel)] p-2 ring-1 ring-[var(--pl-line)]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-6 rounded-[28px] bg-[var(--pl-panel)] px-6 py-8 text-center ring-1 ring-[var(--pl-line)]">
          {title ? <h2 className={cn(styles.heading, "mb-7 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-2" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pc-inview mt-6 rounded-[28px] bg-[var(--pl-panel)] px-6 py-9 ring-1 ring-[var(--pl-line)]"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[28px]")}>Votre réponse</h2>}
      footer={
        <footer className="mt-20 text-center">
          <p className="text-[15px] font-light tracking-[0.02em]">{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-2 text-[10px] text-[var(--pl-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
