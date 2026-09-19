import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, ThemeShell, delay, salutation, type SectionStyles } from "../../shared";
import { monthNumber, shortMonth } from "../../stationery";
import { spaceGrotesk } from "../fonts";

/**
 * LAUNCH - produit en heros, la date comme un compte a rebours.
 *
 * Le parti pris : une page de keynote. En haut, la marque de l organisateur
 * et un signal « Lancement » ; puis le visuel du produit, pose en tuile
 * arrondie ; puis le CHIFFRE - « J-28 » en Space Grotesk tres serre, le seul
 * aplat de couleur de l ecran avec le bouton - et, dessous, une REGLE de
 * graduations qui se remplit jusqu au jour J : on voit le temps passer.
 *
 * Passe le jour J (ou compte a rebours coupe), le chiffre devient la date
 * « 15.10 ». Sans photo, la tuile devient une trame de points ou le chiffre
 * se detache en creux : la page reste une affiche, jamais un trou.
 *
 * Les rubriques sont des « specs » numerotees 01/03, alignees a gauche ; la
 * reponse s ouvre sur un trait d accent epais, comme une barre de progression
 * arrivee au bout.
 */

type Palette = { bg: string; tile: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "tile" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FAFAFA", tile: "#EFEFEF", ink: "#0A0A0A", ink2: "#5C5C5C", line: "#E4E4E4" },
  noir: { bg: "#0A0A0A", tile: "#161616", ink: "#FAFAFA", ink2: "#A3A3A3", line: "#262626" },
};

/** [aplat, texte d accent sur le fond, texte sur aplat] par variante */
const ACCENTS: Record<string, { blanc: [string, string, string]; noir: [string, string, string] }> = {
  electrique: { blanc: ["#2B5CFF", "#1F47CC", "#FFFFFF"], noir: ["#2B5CFF", "#7F9CFF", "#FFFFFF"] },
  orange: { blanc: ["#C43E1B", "#B93A18", "#FFFFFF"], noir: ["#F2542D", "#FF8C6B", "#1A0A05"] },
  vert: { blanc: ["#0B7A4B", "#0B7046", "#FFFFFF"], noir: ["#12B76A", "#4ADE96", "#04200F"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "noir";
  const [acc, accentText, onAccent] = (ACCENTS[accent] ?? ACCENTS.electrique!)[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Le grand jour",
  BIRTHDAY: "Save the date",
  CORPORATE: "Lancement",
  MEMORIAL: "Hommage",
  OTHER: "Save the date",
};

const display = "[font-family:var(--inv-space)]";
const mono = "text-[11px] font-semibold uppercase tracking-[0.16em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[var(--la-accent)] px-6 text-[15px] font-bold tracking-[-0.01em] text-[var(--la-on-accent)] [font-family:var(--inv-space)] transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--la-accent)]";

const styles: SectionStyles = {
  heading: cn(display, "text-[28px] font-bold leading-[1.05] tracking-[-0.035em]"),
  body: "text-[16px] leading-relaxed text-[var(--la-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--la-ink-2)]",
  label: cn(mono, "text-[var(--la-accent-text)]"),
  rule: "divide-[var(--la-line)] border-[var(--la-line)]",
  emphasis: cn(display, "text-[20px] font-bold leading-[1.2] tracking-[-0.02em]"),
  link: "rounded-full border border-[var(--la-ink)] px-4 text-[13px] font-bold transition-colors hover:bg-[var(--la-ink)] hover:text-[var(--la-bg)]",
};

const DOTS: React.CSSProperties = {
  backgroundImage: "radial-gradient(color-mix(in srgb, var(--la-ink) 16%, transparent) 1.2px, transparent 1.3px)",
  backgroundSize: "14px 14px",
};

/** Nombre de graduations de la regle : une par jour, 30 au plus. */
const TICKS = 30;

/** La regle du compte a rebours : les jours passes en gris, ceux qui restent en accent, le jour J plus haut. */
function Ruler({ daysLeft, label }: { daysLeft: number | null; label: string }) {
  const left = daysLeft === null ? 0 : Math.min(daysLeft, TICKS - 1);
  return (
    <div aria-hidden className="w-full">
      <div className="flex h-5 items-end justify-between">
        {Array.from({ length: TICKS }, (_, i) => {
          const last = i === TICKS - 1;
          const ahead = i >= TICKS - 1 - left;
          return (
            <span
              key={i}
              className={cn("pc-rise w-[2px] rounded-full", last ? "h-5 bg-[var(--la-accent)]" : i % 5 === 0 ? "h-3" : "h-2", !last && (ahead ? "bg-[color-mix(in_srgb,var(--la-accent)_55%,transparent)]" : "bg-[var(--la-line)]"))}
              style={delay(240 + i * 12)}
            />
          );
        })}
      </div>
      <div className={cn(mono, "mt-2 flex justify-between text-[10px] text-[var(--la-ink-2)]")}>
        <span>Aujourd’hui</span>
        <span className="text-[var(--la-accent-text)]">{label}</span>
      </div>
    </div>
  );
}

export function Launch({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "noir";
  const showCountdown = theme.settings.countdown && event.daysLeft !== null && event.daysLeft > 0;
  const first = venues[0];
  const stamp = `${starts.day}.${monthNumber(starts.month)}`;
  const long = event.title.length > 44;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(spaceGrotesk.variable, "bg-[var(--la-bg)] text-[var(--la-ink)]")}
      vars={{ "--la-bg": p.bg, "--la-tile": p.tile, "--la-ink": p.ink, "--la-ink-2": p.ink2, "--la-line": p.line, "--la-accent": p.accent, "--la-accent-text": p.accentText, "--la-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#1A1A1A" : "#ECECEC", "--env-fold": dark ? "#151515" : "#E4E4E4", "--env-flap": dark ? "#222222" : "#DCDCDC", "--env-edge": dark ? "#363636" : "#C4C4C4",
        "--env-card": "#FAFAFA", "--env-card-ink": "#0A0A0A", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-space)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accentText, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--inv-space)" }}
      styles={styles}
      button={button}
      heroCtaId="la-hero-cta"
      containerClassName="pt-[max(12px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--la-bg)_90%,transparent)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-12px)] flex-col pb-6">
          {/* Barre de marque : l organisateur, et le signal du lancement. */}
          <div className="flex items-center justify-between gap-4 py-2">
            <span className={cn(display, "min-w-0 truncate text-[15px] font-bold tracking-[-0.02em]")}>{event.hosts}</span>
            <span className={cn(mono, "flex shrink-0 items-center gap-2 text-[10px] text-[var(--la-ink-2)]")}>
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--la-accent)] opacity-60 motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-[var(--la-accent)]" />
              </span>
              {KIND[event.type]}
            </span>
          </div>

          {/* Le produit en tuile ; sans visuel, une trame ou la date se lit en creux. */}
          <div className="pc-lift relative mt-3 h-[min(26svh,230px)] overflow-hidden rounded-[22px] bg-[var(--la-tile)]" style={event.heroImageUrl ? delay(40) : { ...DOTS, ...delay(40) }}>
            {event.heroImageUrl ? (
              <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="(max-width: 460px) 100vw, 460px" className="pc-settle object-cover" />
            ) : (
              <span aria-hidden className={cn(display, "absolute -bottom-[0.18em] -right-[0.04em] text-[clamp(110px,36vw,160px)] font-bold leading-none tracking-[-0.07em] text-[color-mix(in_srgb,var(--la-ink)_7%,transparent)]")}>{stamp}</span>
            )}
            <span className={cn(mono, "absolute bottom-3 left-3 rounded-full bg-[var(--la-bg)] px-3 py-1.5 text-[10px] tabular-nums text-[var(--la-ink)]")}>
              {stamp}.{starts.year.slice(2)} · {starts.time}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center pt-5">
            {event.updatedNote && <p className={cn(mono, "pc-fade mb-3 text-[10px] text-[var(--la-accent-text)]")}>{event.updatedNote}</p>}
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <div aria-hidden className="flex items-end justify-between gap-4">
              <p className={cn(display, "pc-rise font-bold leading-[0.78] tracking-[-0.06em] text-[var(--la-accent-text)]", showCountdown ? "text-[clamp(76px,23vw,108px)]" : "text-[clamp(64px,20vw,92px)]")} style={delay(120)}>
                {showCountdown ? (
                  <>
                    <span className="text-[0.62em] tracking-[-0.04em]">J-</span>
                    {event.daysLeft}
                  </>
                ) : (
                  stamp
                )}
              </p>
              <p className={cn(mono, "pb-1 text-right text-[10px] leading-[1.7] text-[var(--la-ink-2)]")}>
                {starts.weekday}
                <br />
                {starts.day} {shortMonth(starts.month)} {starts.year}
              </p>
            </div>
            {showCountdown && (
              <div className="mt-4">
                <Ruler daysLeft={event.daysLeft} label={`Jour J · ${stamp}`} />
              </div>
            )}
            {dear && (
              <p className="pc-fade mt-5 text-[14px] text-[var(--la-ink-2)]" style={delay(300)}>
                Pour {dear}
              </p>
            )}
            <h1
              className={cn(
                display,
                "font-bold leading-[1.02] tracking-[-0.035em] [overflow-wrap:anywhere] [text-wrap:balance]",
                dear ? "mt-1.5" : "mt-6",
                long ? "text-[clamp(24px,6.8vw,30px)]" : "text-[clamp(28px,8.2vw,36px)]",
              )}
            >
              {event.title}
            </h1>
            {first && <p className="pc-fade mt-2 truncate text-[14px] text-[var(--la-ink-2)]" style={delay(360)}>{first.name}</p>}
          </div>
          <HeroCta view={view} id="la-hero-cta" button={button} className="pt-4" noteClassName="text-center text-[var(--la-ink-2)]" />
        </header>
      }
      photo={null}
      section={({ key, index, title, children }) => (
        <section key={key} className="pc-inview mt-14">
          <div className={cn(mono, "mb-4 flex items-center gap-3 text-[10.5px] tabular-nums")}>
            <span className="text-[var(--la-accent-text)]">{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden className="h-px flex-1 bg-[var(--la-line)]" />
          </div>
          {title ? <h2 className={cn(styles.heading, "mb-6 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="relative mt-16 pt-9 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-full before:bg-[var(--la-accent)]"
      rsvpTitle={
        <>
          <p className={cn(mono, "mb-3 text-[10.5px] text-[var(--la-accent-text)]")}>{showCountdown ? `J-${event.daysLeft} · ${stamp}` : stamp}</p>
          <h2 className={cn(styles.heading, "text-[34px] leading-[1.05]")}>Réserver ma place</h2>
        </>
      }
      footer={
        <footer className={cn(mono, "mt-16 flex items-center justify-between gap-4 border-t border-[var(--la-line)] pt-4 text-[10px] text-[var(--la-ink-2)]")}>
          <span className="truncate">{event.hosts}</span>
          <span className="shrink-0 tabular-nums">
            {stamp}.{starts.year}
          </span>
        </footer>
      }
    />
  );
}
