import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, NAME_SCALE, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { greatVibes, playfair } from "../fonts";

/**
 * ROMANTIC - poudre et calligraphie.
 *
 * Le parti pris : la calligraphie est LIMITEE a un seul mot par ecran - "Ensemble"
 * au-dessus des noms, "Merci" au pied - jamais un paragraphe (cahier §13).
 * Les noms sont en Playfair italique ; le corps reste en Geist.
 *
 * La signature : une branche fleurie dessinee au trait (SVG en ligne, une
 * couleur) qui descend du coin superieur et revient, renversee, en bas de la
 * page. Entre les deux, du papier poudre et beaucoup d air.
 *
 * Les sections sont centrees, separees par un petit bouton de fleur.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  poudre: { bg: "#F8EEEA", paper: "#FDF7F4", ink: "#3A2A2E", ink2: "#7A6368", line: "#EBD9D4" },
  bordeaux: { bg: "#3B1F26", paper: "#46272F", ink: "#F8EEEA", ink2: "#D3B9BE", line: "#5A3540" },
};

/** [aplat / trait, texte d accent, texte sur aplat] par variante */
const ACCENTS: Record<string, { poudre: [string, string, string]; bordeaux: [string, string, string] }> = {
  rose: { poudre: ["#9F4E5A", "#9A4C58", "#FFFFFF"], bordeaux: ["#E29AA6", "#F0BAC3", "#3B1F26"] },
  peche: { poudre: ["#A55B39", "#A55B39", "#FFFFFF"], bordeaux: ["#E8A886", "#F2C1A8", "#3B1F26"] },
  mauve: { poudre: ["#75587C", "#75587C", "#FFFFFF"], bordeaux: ["#C9AFD1", "#DCC8E2", "#3B1F26"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "poudre") as "poudre" | "bordeaux";
  const [acc, accentText, onAccent] = (ACCENTS[accent] ?? ACCENTS.rose!)[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent };
}

const SCRIPT: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Ensemble",
  BIRTHDAY: "Célébrons",
  CORPORATE: "Bienvenue",
  MEMORIAL: "Souvenir",
  OTHER: "Bienvenue",
};

const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--ro-accent)] px-6 text-[14px] font-medium text-[var(--ro-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ro-accent)]";

const styles: SectionStyles = {
  heading: "text-[30px] italic leading-tight [font-family:var(--inv-playfair)]",
  body: "text-[16px] leading-relaxed text-[var(--ro-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ro-ink-2)]",
  label: "text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--ro-accent-text)]",
  rule: "divide-[var(--ro-line)] border-[var(--ro-line)]",
  emphasis: "text-[22px] leading-[1.2] [font-family:var(--inv-playfair)]",
  link: "border-b border-[var(--ro-accent)] text-[13px] font-medium tracking-[0.04em] transition-colors hover:text-[var(--ro-accent-text)]",
};

export function Romantic({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "bordeaux";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(playfair.variable, greatVibes.variable, "bg-[var(--ro-bg)] text-[var(--ro-ink)]")}
      vars={{ "--ro-bg": p.bg, "--ro-paper": p.paper, "--ro-ink": p.ink, "--ro-ink-2": p.ink2, "--ro-line": p.line, "--ro-accent": p.accent, "--ro-accent-text": p.accentText, "--ro-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#4A2A33" : "#F0DDD7", "--env-fold": dark ? "#42252D" : "#EAD3CC", "--env-flap": dark ? "#55343E" : "#E3C8C0", "--env-edge": dark ? "#6B4550" : "#D1B0A7",
        "--env-card": "#FDF7F4", "--env-card-ink": "#3A2A2E", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-playfair)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accentText, "--rsvp-error": dark ? "#F0A39C" : "#A8342D", "--rsvp-font": "var(--inv-playfair)" }}
      styles={styles}
      button={button}
      heroCtaId="ro-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[var(--ro-bg)]/92 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
      before={<Branch className="pointer-events-none absolute right-[-30px] top-[-10px] h-[220px] w-auto text-[var(--ro-accent)] opacity-70" />}
      hero={
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col items-center justify-center py-10 text-center">
          {event.updatedNote && <p className="pc-fade mb-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--ro-accent-text)]">{event.updatedNote}</p>}
          {dear && (
            <p className="pc-fade mb-5 text-[15px] italic text-[var(--ro-ink-2)] [font-family:var(--inv-playfair)]" style={delay(0)}>
              Pour {dear}
            </p>
          )}
          {/* Le seul mot calligraphie du premier ecran. */}
          <p className="pc-fade text-[clamp(40px,11vw,52px)] leading-none text-[var(--ro-accent-text)] [font-family:var(--inv-script)]" style={delay(80)}>
            {SCRIPT[event.type]}
          </p>
          <h1 className="mt-5 italic [font-family:var(--inv-playfair)]">
            <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), NAME_SCALE)} lineClassName="leading-[1.02]" separator={<span className="my-1 block text-[22px] not-italic text-[var(--ro-accent-text)]">&amp;</span>} />
          </h1>
          <div className="mt-8 w-full">
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <div aria-hidden className="flex items-center justify-center gap-3 text-[var(--ro-accent)]">
              <span className="pc-draw h-px w-10 bg-current" style={{ ...delay(300), transformOrigin: "right" }} />
              <Bud className="size-4" />
              <span className="pc-draw h-px w-10 bg-current" style={delay(300)} />
            </div>
            <p aria-hidden className="mt-4 text-[clamp(20px,5.8vw,24px)] leading-tight [font-family:var(--inv-playfair)]">
              {starts.weekday} {starts.day} {starts.month} {starts.year}
            </p>
            <p aria-hidden className="pc-fade mt-1 text-[15px] italic text-[var(--ro-ink-2)] [font-family:var(--inv-playfair)]" style={delay(480)}>
              à {starts.time}
            </p>
          </div>
          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-4 text-[13.5px] font-medium text-[var(--ro-accent-text)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}
          <HeroCta view={view} id="ro-hero-cta" button={button} className="mt-9 max-w-[320px]" noteClassName="text-[var(--ro-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-16 mt-4">
          <div className="relative mx-auto aspect-[4/5] w-[86%] overflow-hidden rounded-t-[999px] rounded-b-[24px] bg-[var(--ro-paper)] ring-8 ring-[var(--ro-paper)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 86vw, 400px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16 text-center">
          <Bud className="mx-auto size-4 text-[var(--ro-accent)]" />
          {title ? <h2 className={cn(styles.heading, "mb-8 mt-4 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-8" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pc-inview rounded-[28px] bg-[var(--ro-paper)] px-5 py-9"
      rsvpTitle={
        <>
          <p className="text-[clamp(34px,9vw,42px)] leading-none text-[var(--ro-accent-text)] [font-family:var(--inv-script)]">Répondre</p>
          <h2 className={cn(styles.heading, "mt-2 text-[22px]")}>Votre réponse</h2>
        </>
      }
      footer={
        <footer className="relative mt-20 text-center">
          <Branch className="pointer-events-none absolute left-[-40px] top-[-30px] h-[160px] w-auto rotate-180 text-[var(--ro-accent)] opacity-60" />
          <p className="relative text-[clamp(34px,9vw,42px)] leading-none text-[var(--ro-accent-text)] [font-family:var(--inv-script)]">Merci</p>
          <p className="relative mt-3 text-[13px] text-[var(--ro-ink-2)]">
            {event.hostParts.join(" & ")} · {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}

/** Une branche fleurie au trait : tige, cinq feuilles, trois boutons. */
function Branch({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 160 220" fill="none" className={className} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M150 5C120 60 95 120 70 215" />
      <path d="M128 46c-18-2-30 8-34 22 16 2 28-8 34-22Z" />
      <path d="M118 78c-16-8-30-4-38 6 14 8 28 4 38-6Z" />
      <path d="M105 112c-18 0-30 10-32 24 16 0 28-10 32-24Z" />
      <path d="M96 140c-16-6-30 0-36 12 14 6 28 0 36-12Z" />
      <path d="M84 176c-14-2-26 6-30 18 14 2 26-6 30-18Z" />
      <circle cx="140" cy="28" r="6" />
      <circle cx="118" cy="98" r="5" />
      <circle cx="100" cy="160" r="4" />
    </svg>
  );
}

/** Un bouton de fleur, quatre petales. */
function Bud({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.2">
      <path d="M8 2c2 2 2 5 0 6-2-1-2-4 0-6ZM8 14c-2-2-2-5 0-6 2 1 2 4 0 6ZM2 8c2-2 5-2 6 0-1 2-4 2-6 0ZM14 8c-2 2-5 2-6 0 1-2 4-2 6 0Z" />
    </svg>
  );
}
