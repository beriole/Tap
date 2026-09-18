import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, NAME_SCALE, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { ebGaramond } from "../fonts";

/**
 * SERENITY - de la lumiere, une photo, l essentiel.
 *
 * Le parti pris : rien ne doit demander d effort. Le fond est une aube - un
 * degrade vertical tres doux, du blanc vers un gris chaud - et la photo, si
 * elle existe, est un disque au centre du premier ecran, comme un portrait
 * pose sur une table. Le nom en EB Garamond, la date, le lieu ; pas de
 * compte a rebours (on ne compte pas les jours avant un adieu, le reglage
 * est ignore), pas d enveloppe animee non plus : la page s ouvre, simplement.
 *
 * Les textes d accroche sont ceux du recueillement ; le bouton dit
 * « Confirmer ma présence », jamais « Répondre à l’invitation ».
 */

type Palette = { bg: string; bg2: string; ink: string; ink2: string; line: string; accent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "bg2" | "ink" | "ink2" | "line">> = {
  aube: { bg: "#FDFCFA", bg2: "#EEEBE5", ink: "#2A2C33", ink2: "#66696F", line: "#E0DDD6" },
  crepuscule: { bg: "#2A2C33", bg2: "#1F2126", ink: "#F1EFEA", ink2: "#B4B2AC", line: "#41444C" },
};

const ACCENTS: Record<string, { aube: string; crepuscule: string }> = {
  gris: { aube: "#5F6268", crepuscule: "#C0C2C8" },
  olive: { aube: "#5F6A4C", crepuscule: "#B5C29C" },
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

const caps = "text-[11px] font-medium uppercase tracking-[0.28em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full border border-[var(--se-ink)] px-6 text-[14px] font-medium text-[var(--se-ink)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--se-ink)] hover:text-[var(--se-bg)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--se-ink)]";

const styles: SectionStyles = {
  heading: "text-[26px] leading-tight [font-family:var(--inv-garamond)]",
  body: "text-[17px] leading-relaxed text-[var(--se-ink)] [font-family:var(--inv-garamond)]",
  muted: "text-[16px] leading-relaxed text-[var(--se-ink-2)] [font-family:var(--inv-garamond)]",
  label: cn(caps, "text-[var(--se-accent)]"),
  rule: "divide-[var(--se-line)] border-[var(--se-line)]",
  emphasis: "text-[22px] leading-[1.25] [font-family:var(--inv-garamond)]",
  link: "border-b border-[var(--se-ink)] text-[13px] font-medium tracking-[0.04em] transition-colors hover:text-[var(--se-accent)]",
};

export function Serenity({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "crepuscule";
  // Pas d enveloppe pour un hommage : la page s ouvre simplement.
  const quiet = { ...view, envelope: false };

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(ebGaramond.variable, "bg-[var(--se-bg-2)] text-[var(--se-ink)]")}
      vars={{ "--se-bg": p.bg, "--se-bg-2": p.bg2, "--se-ink": p.ink, "--se-ink-2": p.ink2, "--se-line": p.line, "--se-accent": p.accent }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": dark ? "#F0A39C" : "#A8342D", "--rsvp-font": "var(--inv-garamond)" }}
      styles={styles}
      button={button}
      heroCtaId="se-hero-cta"
      containerClassName="px-7 pt-[max(20px,env(safe-area-inset-top))]"
      dockClassName="bg-[var(--se-bg)]/92 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
      dockLabel="Confirmer ma présence"
      before={<div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, var(--se-bg) 0%, var(--se-bg-2) 100%)" }} />}
      hero={
        <header className="flex min-h-[calc(100svh-40px)] flex-col items-center justify-center py-10 text-center">
          {event.heroImageUrl && (
            <div className="relative mb-8 size-[clamp(140px,38vw,180px)] overflow-hidden rounded-full ring-1 ring-[var(--se-line)]">
              <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="180px" className="object-cover" />
            </div>
          )}
          {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[10px] text-[var(--se-accent)]")}>{event.updatedNote}</p>}
          <p className={cn(caps, "pc-fade text-[var(--se-accent)]")} style={delay(80)}>
            {EYEBROW[event.type]}
          </p>
          <h1 className="mt-5 [font-family:var(--inv-garamond)]">
            <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), NAME_SCALE)} lineClassName="leading-[1.05]" separator={<span className="block text-[20px] italic leading-[1.8] text-[var(--se-ink-2)]">&amp;</span>} />
          </h1>
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <p aria-hidden className="mt-7 text-[clamp(19px,5.4vw,22px)] leading-relaxed [font-family:var(--inv-garamond)]">
            {starts.weekday} {starts.day} {starts.month} {starts.year}
            <br />
            <span className="text-[var(--se-ink-2)]">{starts.time}</span>
          </p>
          {dear && (
            <p className="pc-fade mt-6 max-w-[300px] text-[16px] italic leading-relaxed text-[var(--se-ink-2)] [font-family:var(--inv-garamond)]" style={delay(300)}>
              {dear}, votre présence nous serait précieuse.
            </p>
          )}
          <HeroCta view={quiet} id="se-hero-cta" button={button} label="Confirmer ma présence" className="mt-9 max-w-[300px]" noteClassName="text-[var(--se-ink-2)]" />
        </header>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14 text-center">
          <span aria-hidden className="mx-auto block h-px w-8 bg-[var(--se-line)]" />
          {title ? <h2 className={cn(styles.heading, "mb-7 mt-5 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-7" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="border-t border-[var(--se-line)] pt-10"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[28px]")}>Votre présence</h2>}
      footer={
        <footer className="mt-20 text-center">
          <p className="text-[18px] italic [font-family:var(--inv-garamond)]">{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-3 text-[10px] text-[var(--se-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
