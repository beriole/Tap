import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { midnightGoldDisplay } from "./font";

/**
 * MIDNIGHT GOLD - Black tie.
 *
 * Le parti pris : la nuit, et presque rien dedans. Pas de carton encadre d or
 * - ce cadre-la se voit sur tous les modeles du marche. Ici, la page est noire
 * du bord au bord, la composition flotte, et l or ne sert qu a SIGNALER :
 * un filet, un chiffre, une heure, un mot. Jamais un aplat, jamais un cadre.
 *
 * Trois signatures :
 *  - le sceau suspendu a un filet vertical, en haut de la page - comme le
 *    cachet d un carton qu on tiendrait par un ruban ;
 *  - la date ecrite 12.12.26, en tres larges approches, sous les noms ;
 *  - le programme de la soiree en chiffres romains, cales sur un filet, sans
 *    boite ni fond.
 *
 * Le bouton est un filet d or, pas un pave : sur une page noire, une masse
 * claire ecrase tout ce qui l entoure.
 *
 * Pas de variante claire : une garalde en graisse 300 ne tient pas sur du
 * blanc. Les variantes sont trois nuits (bleu, noir, emeraude).
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  minuit: { bg: "#0B111C", paper: "#121A27", ink: "#F4EEE0", ink2: "#ACA79C", line: "#232B3A" },
  encre: { bg: "#0C0C0C", paper: "#161616", ink: "#F3EFE6", ink2: "#A9A59C", line: "#262626" },
  emeraude: { bg: "#0A1D19", paper: "#102723", ink: "#F1EFE3", ink2: "#A6AE9F", line: "#1D3832" },
};

/** [filet, texte d accent, texte sur or plein] */
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

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Il y a des soirées qu’on ne raconte pas : on les vit. Nous aimerions que vous soyez là pour celle-là.",
  BIRTHDAY: "Nous serions heureux de vous compter parmi nous pour cette soirée.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence nous accompagne.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const caps = "text-[11px] font-medium uppercase tracking-[0.32em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(58px,18vw,80px)]";
  if (longest <= 12) return "text-[clamp(46px,13.5vw,62px)]";
  if (longest <= 18) return "text-[clamp(36px,10vw,48px)]";
  return "text-[clamp(30px,8vw,38px)]";
}

/** Le bouton : un filet d or. La seule masse pleine de la page est la photo. */
const button =
  "flex min-h-[54px] w-full items-center justify-center border border-[var(--mg-rule)] bg-transparent px-6 text-[12px] font-medium uppercase tracking-[0.28em] text-[var(--mg-accent)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--mg-rule)] hover:text-[var(--mg-on-accent)] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mg-rule)]";

const styles: SectionStyles = {
  heading: "text-[30px] font-light leading-tight [font-family:var(--mg-display)]",
  body: "text-[16px] leading-relaxed text-[var(--mg-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mg-ink-2)]",
  label: cn(caps, "text-[var(--mg-accent)]"),
  rule: "divide-[var(--mg-line)] border-[var(--mg-line)]",
  emphasis: "text-[23px] font-normal leading-[1.15] [font-family:var(--mg-display)]",
  link: "border-b border-[var(--mg-rule)] text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:text-[var(--mg-accent)]",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function MidnightGold({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);
  const seal = monogram(view);

  // Le premier texte libre sans titre devient le mot, compose seul sur sa page.
  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : null;
  const rest = sections.filter((s) => s !== wordSection);

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

  // Rubriques numerotees I, II, III... dans l ordre d affichage.
  const blocks: { key: string; title: string | null; body: React.ReactNode }[] = [];
  if (venues.length > 0) {
    blocks.push({
      key: "venues",
      title: venues.length > 1 ? "Les lieux" : "Le lieu",
      body: <VenueList venues={venues} styles={styles} preview={view.preview} align="left" />,
    });
  }
  for (const section of rest) blocks.push({ key: section.id, title: section.title, body: <SectionBody section={section} styles={styles} align="left" /> });

  return (
    <main
      style={style}
      className={cn(
        midnightGoldDisplay.variable,
        "min-h-dvh overflow-x-clip bg-[var(--mg-bg)] font-[family-name:var(--app-font-sans)] text-[var(--mg-ink)] antialiased [color-scheme:dark]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={seal} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        {/* --------------------------------------------- L OUVERTURE -- */}
        <header className="flex min-h-[100svh] flex-col items-center justify-center px-6 pb-10 pt-[max(16px,env(safe-area-inset-top))] text-center">
          {/* Le sceau, suspendu a son filet. */}
          <span aria-hidden className="mb-7 flex flex-col items-center">
            <span className="pc-draw h-10 w-px bg-[var(--mg-rule)] opacity-70" style={{ transformOrigin: "top" }} />
            <span className="mt-3 flex size-12 items-center justify-center rounded-full border border-[var(--mg-rule)] text-[15px] leading-none text-[var(--mg-accent)] [font-family:var(--mg-display)]">
              {seal}
            </span>
          </span>

          {event.updatedNote && <p className={cn(caps, "pc-fade mb-6 text-[10px] text-[var(--mg-accent)]")}>{event.updatedNote}</p>}

          {dear && (
            <p className="pc-fade mb-6 text-[17px] italic text-[var(--mg-ink-2)] [font-family:var(--mg-display)]" style={delay(0)}>
              Pour {dear}
            </p>
          )}

          <h1 className="font-light [font-family:var(--mg-display)]">
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn("block leading-[0.94] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                <span className="pc-fade my-1 block text-[28px] italic leading-none text-[var(--mg-accent)]" style={delay(200)}>
                  &amp;
                </span>
                <span className={cn("block leading-[0.94] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[1]}</span>
              </>
            ) : (
              <span className={cn("block leading-[1] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
            )}
          </h1>

          <DateLine view={view} />

          <p className={cn(caps, "pc-fade mt-6 max-w-[290px] text-[10px] leading-[2] text-[var(--mg-ink-2)]")} style={delay(120)}>
            {EYEBROW[event.type]}
          </p>

          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-2 text-[15px] italic text-[var(--mg-accent)] [font-family:var(--mg-display)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}

          <div id="mg-hero-cta" data-hero-cta className="mt-8 w-full max-w-[300px]">
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

        {/* ------------------------------------------------- LE MOT -- */}
        <section className="pc-inview px-8 pb-16 text-center">
          <span aria-hidden className="mx-auto mb-8 block h-10 w-px bg-[var(--mg-line)]" />
          <p className="mx-auto max-w-[19rem] whitespace-pre-line text-[clamp(19px,5.4vw,23px)] font-light italic leading-[1.6] [font-family:var(--mg-display)] [text-wrap:pretty]">
            {word ?? WELCOME[event.type]}
          </p>
        </section>

        {/* --------------------------------------------------- PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview relative mb-16">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--mg-paper)]">
              <div className="pc-parallax absolute inset-0">
                <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
              </div>
              {/* La photographie se fond dans la nuit, en haut comme en bas. */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, var(--mg-bg) 0%, transparent 18%, transparent 78%, var(--mg-bg) 100%)" }}
              />
            </div>
          </figure>
        )}

        <div className="px-6">
          {blocks.map((block, i) => (
            <section key={block.key} className="pc-inview mb-16">
              <div className="mb-6 flex items-center gap-4">
                <span className={cn(caps, "text-[10px] text-[var(--mg-accent)]")}>{ROMAN[i] ?? String(i + 1)}</span>
                <span aria-hidden className="h-px flex-1 bg-[var(--mg-line)]" />
              </div>
              {block.title && <h2 className={cn(styles.heading, "mb-8 [overflow-wrap:anywhere]")}>{block.title}</h2>}
              {block.body}
            </section>
          ))}

          {/* -------------------------------------------------- REPONSE -- */}
          <div className="pt-6">
            <RsvpBlock
              view={view}
              rsvpForm={rsvpForm}
              rsvpStyle={rsvpStyle}
              styles={styles}
              button={button}
              align="left"
              title={
                <>
                  <span aria-hidden className="mb-6 block h-px w-full bg-[var(--mg-rule)] opacity-60" />
                  <h2 className={cn(styles.heading, "text-[34px] italic")}>Votre réponse</h2>
                </>
              }
            />
          </div>

          <footer className="mt-24 flex flex-col items-center text-center">
            <span
              aria-hidden
              className="flex size-14 items-center justify-center rounded-full border border-[var(--mg-rule)] text-[18px] leading-none text-[var(--mg-accent)] [font-family:var(--mg-display)]"
            >
              {seal}
            </span>
            <p className={cn(caps, "mt-4 text-[10px] text-[var(--mg-ink-2)]")}>
              {event.starts.day} {event.starts.month} {event.starts.year}
            </p>
          </footer>
        </div>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="mg-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--mg-line)] bg-[color-mix(in_srgb,var(--mg-bg)_88%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

/** 12.12.26 en tres larges approches, entre deux filets, puis l heure. */
function DateLine({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  const iso = starts.iso.slice(0, 10).split("-");
  const compact = `${starts.day}.${iso[1] ?? ""}.${starts.year.slice(2)}`;
  return (
    <div className="mt-9 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="flex items-center justify-center gap-4">
        <span className="pc-draw h-px flex-1 bg-[var(--mg-line)]" style={{ ...delay(300), transformOrigin: "right" }} />
        <span className="text-[clamp(22px,6.4vw,28px)] font-light leading-none tracking-[0.22em] tabular-nums text-[var(--mg-accent)] [font-family:var(--mg-display)]">
          {compact}
        </span>
        <span className="pc-draw h-px flex-1 bg-[var(--mg-line)]" style={delay(300)} />
      </div>
      <p aria-hidden className={cn(caps, "mt-4 text-[10.5px] text-[var(--mg-ink)]")}>
        {starts.weekday} · {starts.time.replace(" h 00", " heures")}
      </p>
    </div>
  );
}
