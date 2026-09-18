import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, ThemeShell, delay, salutation, type SectionStyles } from "../../shared";
import { spaceGrotesk } from "../fonts";

/**
 * LAUNCH - produit en heros, la date comme un compte a rebours.
 *
 * Le parti pris : le premier ecran est construit comme une page de
 * lancement. Le visuel (photo) en haut, coupe net ; dessous, un CHIFFRE
 * enorme - le nombre de jours restants, « J-86 » - et le titre en Space
 * Grotesk. La couleur d accent ne sert qu au chiffre, au bouton et aux
 * barres de section : une couleur vive, une seule (§12.2).
 *
 * Passe le jour J, le chiffre laisse la place a la date. Sans photo, une
 * grille de points fine remplace le visuel.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FAFAFA", ink: "#0A0A0A", ink2: "#5C5C5C", line: "#E4E4E4" },
  noir: { bg: "#0A0A0A", ink: "#FAFAFA", ink2: "#A3A3A3", line: "#262626" },
};

/** [aplat, texte d accent sur le fond, texte sur aplat] par variante */
const ACCENTS: Record<string, { blanc: [string, string, string]; noir: [string, string, string] }> = {
  electrique: { blanc: ["#2B5CFF", "#1F47CC", "#FFFFFF"], noir: ["#2B5CFF", "#7F9CFF", "#FFFFFF"] },
  orange: { blanc: ["#E04A22", "#B93A18", "#FFFFFF"], noir: ["#F2542D", "#FF8C6B", "#1A0A05"] },
  vert: { blanc: ["#0E8A55", "#0B7046", "#FFFFFF"], noir: ["#12B76A", "#4ADE96", "#04200F"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "noir";
  const [acc, accentText, onAccent] = (ACCENTS[accent] ?? ACCENTS.electrique!)[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent };
}

const mono = "text-[11px] font-semibold uppercase tracking-[0.18em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-lg bg-[var(--la-accent)] px-6 text-[15px] font-bold text-[var(--la-on-accent)] [font-family:var(--inv-space)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--la-accent)]";

const styles: SectionStyles = {
  heading: "text-[24px] font-bold leading-tight tracking-[-0.02em] [font-family:var(--inv-space)]",
  body: "text-[16px] leading-relaxed text-[var(--la-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--la-ink-2)]",
  label: cn(mono, "text-[var(--la-accent-text)]"),
  rule: "divide-[var(--la-line)] border-[var(--la-line)]",
  emphasis: "text-[20px] font-bold leading-[1.25] [font-family:var(--inv-space)]",
  link: "rounded-md border border-[var(--la-ink)] px-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--la-ink)] hover:text-[var(--la-bg)]",
};

const DOTS: React.CSSProperties = { backgroundImage: "radial-gradient(var(--la-line) 1.2px, transparent 1.2px)", backgroundSize: "18px 18px" };

export function Launch({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "noir";
  const showCountdown = theme.settings.countdown && event.daysLeft !== null && event.daysLeft > 0;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(spaceGrotesk.variable, "bg-[var(--la-bg)] text-[var(--la-ink)]")}
      vars={{ "--la-bg": p.bg, "--la-ink": p.ink, "--la-ink-2": p.ink2, "--la-line": p.line, "--la-accent": p.accent, "--la-accent-text": p.accentText, "--la-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#1A1A1A" : "#ECECEC", "--env-fold": dark ? "#151515" : "#E4E4E4", "--env-flap": dark ? "#222222" : "#DCDCDC", "--env-edge": dark ? "#363636" : "#C4C4C4",
        "--env-card": "#FAFAFA", "--env-card-ink": "#0A0A0A", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-space)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accentText, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--inv-space)" }}
      styles={styles}
      button={button}
      heroCtaId="la-hero-cta"
      dockClassName="border-t border-[var(--la-line)] bg-[var(--la-bg)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[100svh] flex-col pb-6">
          <div className="relative -mx-5 aspect-[4/3] max-h-[44svh] overflow-hidden bg-[var(--la-line)]" style={event.heroImageUrl ? undefined : DOTS}>
            {event.heroImageUrl && <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="100vw" className="object-cover" />}
            <span className={cn(mono, "absolute left-5 top-[max(16px,env(safe-area-inset-top))] rounded-md bg-[var(--la-bg)] px-2.5 py-1.5 text-[var(--la-ink)]")}>{event.hosts}</span>
          </div>
          <div className="flex flex-1 flex-col justify-center py-7">
            {event.updatedNote && <p className={cn(mono, "pc-fade mb-4 text-[var(--la-accent-text)]")}>{event.updatedNote}</p>}
            {dear && (
              <p className="pc-fade mb-3 text-[15px] text-[var(--la-ink-2)]" style={delay(0)}>
                {dear},
              </p>
            )}
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            {showCountdown ? (
              <p aria-hidden className="text-[clamp(72px,22vw,104px)] font-bold leading-[0.85] tracking-[-0.05em] text-[var(--la-accent-text)] [font-family:var(--inv-space)]">
                J-{event.daysLeft}
              </p>
            ) : (
              <p aria-hidden className="text-[clamp(40px,12vw,56px)] font-bold leading-[0.95] tracking-[-0.04em] text-[var(--la-accent-text)] [font-family:var(--inv-space)]">
                {starts.day} {starts.month}
              </p>
            )}
            <h1 className="mt-5 text-[clamp(28px,8vw,36px)] font-bold leading-[1.05] tracking-[-0.03em] [font-family:var(--inv-space)] [overflow-wrap:anywhere] [text-wrap:balance]">{event.title}</h1>
            <p aria-hidden className={cn(mono, "pc-fade mt-4 text-[var(--la-ink-2)]")} style={delay(200)}>
              {starts.weekday} {starts.day} {starts.month} {starts.year} · {starts.time}
            </p>
          </div>
          <HeroCta view={view} id="la-hero-cta" button={button} noteClassName="text-[var(--la-ink-2)]" />
        </header>
      }
      section={({ key, index, title, children }) => (
        <section key={key} className="pc-inview mt-12">
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden className="h-1 w-8 bg-[var(--la-accent)]" />
            <span className={cn(mono, "text-[var(--la-ink-2)]")}>{String(index + 1).padStart(2, "0")}</span>
          </div>
          {title ? <h2 className={cn(styles.heading, "mb-5 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="mt-12 border-t-4 border-[var(--la-accent)] pt-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[28px]")}>Réserver ma place</h2>}
      footer={
        <footer className={cn(mono, "mt-16 flex items-center justify-between border-t border-[var(--la-line)] pt-4 text-[10px] text-[var(--la-ink-2)]")}>
          <span className="truncate">{event.hosts}</span>
          <span className="shrink-0 tabular-nums">
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </span>
        </footer>
      }
    />
  );
}
