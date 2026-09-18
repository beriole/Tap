import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, ThemeShell, countdownText, delay, salutation, type SectionStyles } from "../../shared";
import { libreBaskerville } from "../fonts";

/**
 * GALA - luxe sombre, le billet en main.
 *
 * Le parti pris : le premier ecran est un BILLET. Un carton sombre a bord
 * dore, deux encoches rondes sur les cotes et un talon detachable en
 * pointilles, qui porte la date et la mention « Invitation personnelle ».
 * Ce n est pas un QR (il arrive apres la confirmation, page /t) : c est la
 * promesse du billet.
 *
 * Serif classique (Libre Baskerville), or mat, capitales espacees. La photo,
 * si elle existe, est cadree dans un liseré dore. Les sections sont centrees,
 * ouvertes par un fleuron.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line">> = {
  noir: { bg: "#0E0C0B", card: "#171412", ink: "#F3EBDD", ink2: "#B5AA99", line: "#2C2723" },
  prune: { bg: "#1E1119", card: "#281822", ink: "#F5E9EC", ink2: "#C1ACB4", line: "#3B2531" },
};

/** [or (>= 4,5:1 sur le fond), texte sur or] */
const ACCENTS: Record<string, [string, string]> = {
  or: ["#D4B067", "#1A1407"],
  champagne: ["#E4D2A6", "#1A1407"],
  argent: ["#C9CCD3", "#111318"],
};

function palette(variant: string, accent: string): Palette {
  const [acc, onAccent] = ACCENTS[accent] ?? ACCENTS.or!;
  return { ...(VARIANTS[variant] ?? VARIANTS.noir!), accent: acc, onAccent };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Soirée",
  CORPORATE: "Gala",
  MEMORIAL: "Hommage",
  OTHER: "Soirée",
};

const caps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--ga-accent)] px-6 text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--ga-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ga-accent)]";

const styles: SectionStyles = {
  heading: "text-[26px] leading-tight [font-family:var(--inv-baskerville)]",
  body: "text-[16px] leading-relaxed text-[var(--ga-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ga-ink-2)]",
  label: cn(caps, "text-[var(--ga-accent)]"),
  rule: "divide-[var(--ga-line)] border-[var(--ga-line)]",
  emphasis: "text-[21px] leading-[1.25] [font-family:var(--inv-baskerville)]",
  link: "border-b border-[var(--ga-accent)] text-[12px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[var(--ga-accent)]",
};

/** Les encoches du billet : deux disques de la couleur du fond, a cheval sur le bord. */
const NOTCH = "absolute top-[62%] size-7 -translate-y-1/2 rounded-full bg-[var(--ga-bg)] ring-1 ring-[var(--ga-accent)]";

export function Gala({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark
      mainClassName={cn(libreBaskerville.variable, "bg-[var(--ga-bg)] text-[var(--ga-ink)]")}
      vars={{ "--ga-bg": p.bg, "--ga-card": p.card, "--ga-ink": p.ink, "--ga-ink-2": p.ink2, "--ga-line": p.line, "--ga-accent": p.accent, "--ga-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#221D1A", "--env-fold": "#1C1815", "--env-flap": "#2B2521", "--env-edge": "#443B34",
        "--env-card": "#F3EBDD", "--env-card-ink": "#1A1407", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-baskerville)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#F0A39C", "--rsvp-font": "var(--inv-baskerville)" }}
      styles={styles}
      button={button}
      heroCtaId="ga-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--ga-line)] bg-[var(--ga-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[calc(100svh-32px)] flex-col justify-center py-8">
          {/* Le billet */}
          <div className="relative rounded-[6px] border border-[var(--ga-accent)] bg-[var(--ga-card)] text-center">
            <span aria-hidden className={cn(NOTCH, "-left-3.5")} />
            <span aria-hidden className={cn(NOTCH, "-right-3.5")} />
            <div className="px-6 pb-8 pt-9">
              <p className={cn(caps, "text-[10px] text-[var(--ga-accent)]")}>{KIND[event.type]}</p>
              {event.updatedNote && <p className={cn(caps, "pc-fade mt-3 text-[10px] text-[var(--ga-ink-2)]")}>{event.updatedNote}</p>}
              {dear && (
                <p className="pc-fade mt-5 text-[14px] italic text-[var(--ga-ink-2)] [font-family:var(--inv-baskerville)]" style={delay(0)}>
                  {dear}
                </p>
              )}
              <h1 className="mt-4 text-[clamp(28px,8vw,36px)] leading-[1.1] [font-family:var(--inv-baskerville)] [overflow-wrap:anywhere] [text-wrap:balance]">{event.title}</h1>
              <p className={cn(caps, "pc-fade mt-5 text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")} style={delay(120)}>
                {event.hosts}
              </p>
            </div>
            {/* Talon : pointilles, date */}
            <div className="mx-4 border-t border-dashed border-[var(--ga-accent)]" />
            <div className="px-6 pb-7 pt-6">
              <p className="sr-only">
                {starts.long}, {starts.time}
              </p>
              <div aria-hidden className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <span className={cn(caps, "text-right text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")}>
                  {starts.weekday}
                  <br />
                  {starts.time}
                </span>
                <span className="text-[clamp(48px,14vw,64px)] leading-none tabular-nums text-[var(--ga-accent)] [font-family:var(--inv-baskerville)]">{starts.day}</span>
                <span className={cn(caps, "text-left text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")}>
                  {starts.month}
                  <br />
                  {starts.year}
                </span>
              </div>
              {theme.settings.countdown && event.daysLeft !== null && (
                <p className="pc-fade mt-3 text-[13px] italic text-[var(--ga-ink-2)] [font-family:var(--inv-baskerville)]" style={delay(560)}>
                  {countdownText(event.daysLeft)}
                </p>
              )}
              <p className={cn(caps, "mt-4 text-[9px] text-[var(--ga-accent)]")}>Invitation personnelle</p>
            </div>
          </div>
          <HeroCta view={view} id="ga-hero-cta" button={button} className="mt-6" noteClassName="text-center text-[var(--ga-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-14 mt-4 border border-[var(--ga-accent)] p-1.5">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--ga-card)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14 text-center">
          <span aria-hidden className="mx-auto flex items-center justify-center gap-2 text-[var(--ga-accent)]">
            <span className="h-px w-6 bg-current" />
            <span className="size-1.5 rotate-45 bg-current" />
            <span className="h-px w-6 bg-current" />
          </span>
          {title ? <h2 className={cn(styles.heading, "mb-7 mt-4 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-7" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="border-t border-[var(--ga-accent)] pt-10"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[28px]")}>Confirmer votre présence</h2>}
      footer={
        <footer className="mt-20 text-center">
          <p className={cn(caps, "text-[10px] text-[var(--ga-accent)]")}>{event.hosts}</p>
          <p className={cn(caps, "mt-2 text-[10px] text-[var(--ga-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
