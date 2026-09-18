import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { midnightGoldDisplay } from "./font";

/**
 * MIDNIGHT GOLD - carton de gala.
 *
 * Le parti pris : une carte sombre a lisere d or, comme celles que l on pose
 * sur une nappe noire. La page entiere est le carton ; le premier ecran est
 * encadre par un double filet d or qui ne se referme qu apres le bouton.
 *
 * La signature est le SCEAU : le monogramme dans un cercle d or, pose sur le
 * cadre, qui revient en pied de page. La date est une ligne gravee sous les
 * noms, le jour en chiffre de titrage entre deux filets. Les sections sont
 * numerotees en chiffres romains, alignees a gauche sur un filet : on lit un
 * programme de soiree, pas un site.
 *
 * L or ne remplit jamais une surface, sauf le bouton : c est la seule masse
 * claire de la page, donc la seule chose que l oeil cherche.
 *
 * Pas de variante claire : une garalde en graisse 300 ne tient pas sur du
 * blanc. Les variantes sont trois nuits (bleu, noir, emeraude).
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  minuit: { bg: "#0F1521", paper: "#161D2B", ink: "#F4EEE0", ink2: "#B3ACA0", line: "#28303F" },
  encre: { bg: "#121212", paper: "#1A1A1A", ink: "#F3EFE6", ink2: "#B0ABA2", line: "#2C2C2C" },
  emeraude: { bg: "#0E221E", paper: "#132C27", ink: "#F1EFE3", ink2: "#AEB5A7", line: "#22403A" },
};

/** [filet, texte d accent, texte sur bouton] */
const ACCENTS: Record<string, [string, string, string]> = {
  or: ["#C9A75A", "#E0C57C", "#1A1407"],
  cuivre: ["#C1845A", "#E2A57A", "#1D120A"],
  argent: ["#B9BDC6", "#DADDE3", "#111318"],
};

function palette(variant: string, accent: string): Palette {
  const base = VARIANTS[variant] ?? VARIANTS.minuit!;
  const [rule, accentText, onAccent] = ACCENTS[accent] ?? ACCENTS.or!;
  return { ...base, rule, accentText, onAccent };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Ont l’honneur de vous convier à leur mariage",
  BIRTHDAY: "Vous convie à célébrer",
  CORPORATE: "Vous prie de lui faire l’honneur de votre présence",
  MEMORIAL: "En souvenir de",
  OTHER: "Vous convie",
};

const caps = "text-[11px] font-medium uppercase tracking-[0.32em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(56px,17vw,74px)]";
  if (longest <= 12) return "text-[clamp(44px,13vw,60px)]";
  if (longest <= 18) return "text-[clamp(36px,10vw,46px)]";
  return "text-[clamp(30px,8vw,38px)]";
}

const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--mg-rule)] px-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-[var(--mg-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mg-rule)]";

const styles: SectionStyles = {
  heading: "text-[30px] font-light leading-tight [font-family:var(--mg-display)]",
  body: "text-[16px] leading-relaxed text-[var(--mg-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mg-ink-2)]",
  label: cn(caps, "text-[var(--mg-accent)]"),
  rule: "divide-[var(--mg-line)] border-[var(--mg-line)]",
  emphasis: "text-[23px] font-normal leading-[1.15] [font-family:var(--mg-display)]",
  link: "border-b border-[var(--mg-rule)] text-[13px] font-medium uppercase tracking-[0.16em] transition-colors hover:text-[var(--mg-accent)]",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function MidnightGold({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);
  const seal = monogram(view);

  const style = {
    "--mg-bg": p.bg,
    "--mg-paper": p.paper,
    "--mg-ink": p.ink,
    "--mg-ink-2": p.ink2,
    "--mg-line": p.line,
    "--mg-rule": p.rule,
    "--mg-accent": p.accentText,
    "--mg-on-accent": p.onAccent,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": p.paper,
    "--env-fold": p.bg,
    "--env-flap": p.line,
    "--env-edge": p.rule,
    "--env-card": "#F4EEE0",
    "--env-card-ink": "#1A1407",
    "--env-liner": p.rule,
    "--env-seal": p.rule,
    "--env-seal-ink": p.onAccent,
    "--env-font": "var(--mg-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.bg,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.line,
    "--rsvp-rule": p.rule,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": "#F0A39C",
    "--rsvp-font": "var(--mg-display)",
  } as React.CSSProperties;

  // Sections numerotees I, II, III... dans l ordre d affichage.
  const blocks: { key: string; title: string | null; body: React.ReactNode }[] = [];
  if (venues.length > 0) {
    blocks.push({ key: "venues", title: venues.length > 1 ? "Les lieux" : "Le lieu", body: <VenueList venues={venues} styles={styles} preview={view.preview} align="left" /> });
  }
  for (const section of sections) blocks.push({ key: section.id, title: section.title, body: <SectionBody section={section} styles={styles} align="left" /> });

  return (
    <main
      style={style}
      className={cn(midnightGoldDisplay.variable, "min-h-dvh bg-[var(--mg-bg)] font-[family-name:var(--app-font-sans)] text-[var(--mg-ink)] antialiased [color-scheme:dark]")}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear} monogram={seal} />
        </div>
      )}

      <div className="mx-auto w-full max-w-[460px] break-words px-5 pb-28 pt-[max(16px,env(safe-area-inset-top))]">
        {/* --------------------------------------------- PREMIER ECRAN -- */}
        {/* Double filet : bordure + outline decalee, un seul element. */}
        <header className="relative mt-7 flex min-h-[calc(100svh-60px)] flex-col items-center justify-center border border-[var(--mg-rule)] px-5 py-12 text-center outline outline-1 outline-offset-[3px] outline-[var(--mg-line)]">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--mg-rule)] bg-[var(--mg-bg)] text-[18px] leading-none text-[var(--mg-accent)] [font-family:var(--mg-display)]"
          >
            {seal}
          </span>

          {event.updatedNote && <p className={cn(caps, "pc-fade mb-6 text-[10px] text-[var(--mg-accent)]")}>{event.updatedNote}</p>}

          {dear && (
            <p className="pc-fade mb-6 text-[17px] italic text-[var(--mg-ink-2)] [font-family:var(--mg-display)]" style={delay(0)}>
              {dear},
            </p>
          )}

          <h1 className="font-light [font-family:var(--mg-display)]">
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn("block leading-[0.95] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                <span className="pc-fade my-1 block text-[30px] italic leading-none text-[var(--mg-accent)]" style={delay(200)}>
                  &amp;
                </span>
                <span className={cn("block leading-[0.95] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[1]}</span>
              </>
            ) : (
              <span className={cn("block leading-[1] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
            )}
          </h1>

          <p className={cn(caps, "pc-fade mt-7 max-w-[300px] text-[10.5px] leading-[1.9] text-[var(--mg-ink-2)]")} style={delay(120)}>
            {EYEBROW[event.type]}
          </p>

          <DateLine view={view} />

          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-3 text-[16px] italic text-[var(--mg-accent)] [font-family:var(--mg-display)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}

          <div id="mg-hero-cta" data-hero-cta className="mt-9 w-full max-w-[300px]">
            <a href="#rsvp" className={button}>
              {ctaLabel(view)}
            </a>
            {rsvp.deadline && !rsvp.closed && (
              <p className="mt-3 text-[12.5px] text-[var(--mg-ink-2)]">
                Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
              </p>
            )}
          </div>
        </header>

        {/* --------------------------------------------------- PHOTO -- */}
        {event.heroImageUrl ? (
          <figure className="pc-inview mb-16 mt-10 border border-[var(--mg-line)] p-2">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--mg-paper)]">
              <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
          </figure>
        ) : (
          <div className="mt-16" />
        )}

        {blocks.map((block, i) => (
          <section key={block.key} className="pc-inview mb-16 border-l border-[var(--mg-line)] pl-5">
            <p className={cn(caps, "text-[var(--mg-accent)]")}>{ROMAN[i] ?? String(i + 1)}</p>
            {block.title ? <h2 className={cn(styles.heading, "mb-7 mt-2 [overflow-wrap:anywhere]")}>{block.title}</h2> : <div className="mb-7" />}
            {block.body}
          </section>
        ))}

        {/* -------------------------------------------------- REPONSE -- */}
        <div className="border-t border-[var(--mg-rule)] pt-12">
          <RsvpBlock
            view={view}
            rsvpForm={rsvpForm}
            rsvpStyle={rsvpStyle}
            styles={styles}
            button={button}
            title={<h2 className={cn(styles.heading, "text-[34px] italic")}>Votre réponse</h2>}
          />
        </div>

        <footer className="mt-24 flex flex-col items-center text-center">
          <span aria-hidden className="flex size-14 items-center justify-center rounded-full border border-[var(--mg-rule)] text-[18px] leading-none text-[var(--mg-accent)] [font-family:var(--mg-display)]">
            {seal}
          </span>
          <p className={cn(caps, "mt-4 text-[10px] text-[var(--mg-ink-2)]")}>
            {event.starts.day} {event.starts.month} {event.starts.year}
          </p>
        </footer>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="mg-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--mg-line)] bg-[var(--mg-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

/** ——— 12 ——— puis SAMEDI · DÉCEMBRE 2026, puis l heure en italique. */
function DateLine({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  return (
    <div className="mt-8 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="flex items-center justify-center gap-4">
        <span className="pc-draw h-px flex-1 bg-[var(--mg-rule)]" style={{ ...delay(300), transformOrigin: "right" }} />
        <span className="text-[clamp(56px,16vw,72px)] font-light leading-[0.9] tabular-nums text-[var(--mg-accent)] [font-family:var(--mg-display)]">{starts.day}</span>
        <span className="pc-draw h-px flex-1 bg-[var(--mg-rule)]" style={delay(300)} />
      </div>
      <p aria-hidden className={cn(caps, "mt-4 text-[var(--mg-ink)]")}>
        {starts.weekday} · {starts.month} {starts.year}
      </p>
      <p aria-hidden className="pc-fade mt-2 text-[16px] italic text-[var(--mg-ink-2)] [font-family:var(--mg-display)]" style={delay(480)}>
        {starts.time.replace(" h 00", " heures")}
      </p>
    </div>
  );
}
