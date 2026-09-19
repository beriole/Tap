import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { ebGaramond } from "../fonts";

/**
 * SERENITY - de la lumiere, un portrait, l essentiel.
 *
 * Le parti pris : le PORTRAIT EN MEDAILLON. Au centre du premier ecran, la
 * photographie dans un disque, cerclee d un filet tres fin decolle de
 * quelques pixels - comme un medaillon qu on ouvre - et posee dans un halo
 * de lumiere. Le fond est une aube : un degrade vertical tres doux, du blanc
 * vers un gris chaud. Sans photo, le medaillon garde sa place et porte les
 * initiales, en italique : la composition ne s effondre jamais.
 *
 * Le nom en EB Garamond, sans graisse ni capitales ; la date, le lieu, une
 * phrase. Pas de compte a rebours (on ne compte pas les jours avant un adieu,
 * le reglage est ignore), pas d enveloppe animee : la page s ouvre,
 * simplement. Le petit cercle du medaillon revient, a 7 px, au-dessus de
 * chaque rubrique - la seule ornementation de la page.
 *
 * Le bouton dit « Confirmer ma présence », jamais « Répondre à l’invitation ».
 */

type Palette = { bg: string; bg2: string; ink: string; ink2: string; line: string; accent: string; halo: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "bg2" | "ink" | "ink2" | "line" | "halo">> = {
  aube: { bg: "#FDFCFA", bg2: "#EEEBE5", ink: "#2A2C33", ink2: "#606369", line: "#DDD9D1", halo: "#FFFFFF" },
  crepuscule: { bg: "#2C2E35", bg2: "#1D1F24", ink: "#F1EFEA", ink2: "#B4B2AC", line: "#454850", halo: "#4A4C54" },
};

const ACCENTS: Record<string, { aube: string; crepuscule: string }> = {
  gris: { aube: "#5F6268", crepuscule: "#C0C2C8" },
  olive: { aube: "#5A6548", crepuscule: "#B5C29C" },
  bleu: { aube: "#4F6279", crepuscule: "#A9BBD0" },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "aube") as "aube" | "crepuscule";
  return { ...VARIANTS[v]!, accent: (ACCENTS[accent] ?? ACCENTS.gris!)[v] };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Un moment ensemble",
  CORPORATE: "Invitation",
  MEMORIAL: "En mémoire de",
  OTHER: "Un moment ensemble",
};

const INVITE: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "votre présence nous serait précieuse.",
  BIRTHDAY: "votre présence nous serait précieuse.",
  CORPORATE: "votre présence nous serait précieuse.",
  MEMORIAL: "votre présence à nos côtés nous sera précieuse.",
  OTHER: "votre présence nous serait précieuse.",
};

const serif = "[font-family:var(--inv-garamond)]";
const caps = "text-[10.5px] font-medium uppercase tracking-[0.32em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full border border-[var(--se-ink)] px-6 text-[14px] font-medium tracking-[0.02em] text-[var(--se-ink)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--se-ink)] hover:text-[var(--se-bg)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--se-ink)]";

const styles: SectionStyles = {
  heading: cn(serif, "text-[30px] font-normal italic leading-tight"),
  body: cn(serif, "text-[18px] leading-relaxed text-[var(--se-ink)]"),
  muted: cn(serif, "text-[16.5px] leading-relaxed text-[var(--se-ink-2)]"),
  label: cn(caps, "text-[var(--se-accent)]"),
  rule: "divide-[var(--se-line)] border-[var(--se-line)]",
  emphasis: cn(serif, "text-[22px] leading-[1.25]"),
  link: "border-b border-[var(--se-ink)] text-[13px] font-medium tracking-[0.04em] transition-colors hover:text-[var(--se-accent)]",
};

/** Le petit cercle du medaillon : le seul ornement de la page. */
function Ring({ className }: { className?: string }) {
  return <span aria-hidden className={cn("mx-auto block size-[7px] rounded-full border border-[var(--se-accent)]", className)} />;
}

/** Initiales du nom, pour le medaillon sans photo : « Marie Ngo Bell » -> « MB ». */
function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "";
  const a = words[0]!.charAt(0);
  const b = words.length > 1 ? words[words.length - 1]!.charAt(0) : "";
  return (a + b).toUpperCase();
}

export function Serenity({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "crepuscule";
  const first = venues[0];
  // Pas d enveloppe pour un hommage : la page s ouvre simplement.
  const quiet = { ...view, envelope: false };
  const mono = event.hostParts.length === 2 ? `${event.hostParts[0]!.charAt(0)}&${event.hostParts[1]!.charAt(0)}` : initials(event.hostParts[0] ?? "");

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(ebGaramond.variable, "bg-[var(--se-bg-2)] text-[var(--se-ink)]")}
      vars={{ "--se-bg": p.bg, "--se-bg-2": p.bg2, "--se-ink": p.ink, "--se-ink-2": p.ink2, "--se-line": p.line, "--se-accent": p.accent, "--se-halo": p.halo }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": dark ? "#F0A39C" : "#A8342D", "--rsvp-font": "var(--inv-garamond)" }}
      styles={styles}
      button={button}
      heroCtaId="se-hero-cta"
      containerClassName="px-7 pt-[max(12px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--se-bg-2)_88%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      dockLabel="Confirmer ma présence"
      before={<div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, var(--se-bg) 0%, var(--se-bg) 18%, var(--se-bg-2) 100%)" }} />}
      venuesTitle={(n) => (n > 1 ? "Où nous retrouver" : "Le lieu")}
      hero={
        <header className="relative flex min-h-[calc(100svh-12px)] flex-col items-center justify-center py-8 text-center">
          {/* Le halo : une lumiere douce derriere le portrait, sans un trait dessine. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[8%] size-[min(120vw,520px)] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, var(--se-halo) 0%, color-mix(in srgb, var(--se-halo) 50%, transparent) 30%, transparent 64%)" }}
          />

          {/* Le medaillon : le portrait, et un filet decolle de quelques pixels. */}
          <div className="pc-fade relative" style={delay(0)}>
            <span aria-hidden className="absolute -inset-[9px] rounded-full border border-[var(--se-line)]" />
            <span aria-hidden className="absolute -inset-[9px] rounded-full border border-[var(--se-accent)] opacity-40 [clip-path:inset(0_0_55%_0)]" />
            <div className="relative size-[clamp(132px,38vw,172px)] overflow-hidden rounded-full bg-[var(--se-bg-2)]">
              {event.heroImageUrl ? (
                <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="172px" className="pc-settle object-cover saturate-[0.85]" />
              ) : (
                <span aria-hidden className={cn(serif, "absolute inset-0 flex items-center justify-center text-[clamp(40px,12vw,54px)] italic tracking-[0.02em] text-[var(--se-ink-2)]")}>
                  {mono}
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-10 w-full">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-4 text-[10px] text-[var(--se-accent)]")}>{event.updatedNote}</p>}
            <p className={cn(caps, "pc-fade text-[var(--se-accent)]")} style={delay(120)}>
              {EYEBROW[event.type]}
            </p>
            <h1 className={cn(serif, "pc-rise mt-4 font-normal tracking-[-0.01em]")} style={delay(200)}>
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(46px,13.5vw,58px)]", "text-[clamp(40px,11.5vw,50px)]", "text-[clamp(32px,9.4vw,42px)]", "text-[clamp(26px,7.4vw,32px)]"])}
                lineClassName="leading-[1.04]"
                separator={<span className="block text-[20px] italic leading-[1.7] text-[var(--se-ink-2)]">&amp;</span>}
              />
            </h1>
            <span aria-hidden className="pc-draw mx-auto mt-6 block h-px w-10 bg-[var(--se-accent)] opacity-60" style={{ ...delay(420), transformOrigin: "center" }} />
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <p aria-hidden className={cn(serif, "pc-fade mt-5 text-[19px] leading-[1.5] first-letter:uppercase")} style={delay(360)}>
              {starts.weekday} {starts.day} {starts.month} {starts.year}
              <span className="block text-[17px] text-[var(--se-ink-2)]">
                {starts.time}
                {first && (
                  <>
                    <span className="mx-2">·</span>
                    <span className="italic [overflow-wrap:anywhere]">{first.name}</span>
                  </>
                )}
              </span>
            </p>
            {dear && (
              <p className={cn(serif, "pc-fade mx-auto mt-5 max-w-[290px] text-[16.5px] italic leading-relaxed text-[var(--se-ink-2)]")} style={delay(480)}>
                {dear}, {INVITE[event.type]}
              </p>
            )}
          </div>
          <HeroCta view={quiet} id="se-hero-cta" button={button} label="Confirmer ma présence" className="pc-fade relative mt-8 max-w-[290px]" noteClassName="text-[var(--se-ink-2)]" />
        </header>
      }
      word={(text) => (
        <section className="pc-inview pb-16 pt-6 text-center">
          <Ring />
          <p className={cn(serif, "mx-auto mt-7 max-w-[20rem] whitespace-pre-line text-[clamp(21px,5.8vw,24px)] italic leading-[1.5] [text-wrap:pretty]")}>{text}</p>
        </section>
      )}
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16 text-center">
          <Ring />
          {title ? <h2 className={cn(styles.heading, "mb-8 mt-5 [overflow-wrap:anywhere] [text-wrap:balance]")}>{title}</h2> : <div className="mb-8" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pt-4"
      rsvpTitle={
        <>
          <Ring />
          <h2 className={cn(styles.heading, "mt-5 text-[32px] leading-tight")}>Votre présence</h2>
        </>
      }
      footer={
        <footer className="mt-24 text-center">
          <span aria-hidden className="mx-auto block h-10 w-px bg-[var(--se-line)]" />
          <p className={cn(serif, "mt-6 text-[20px] italic [overflow-wrap:anywhere]")}>{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-3 text-[10px] text-[var(--se-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
