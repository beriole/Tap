import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { africanLuxuryDisplay } from "./font";

/**
 * AFRICAN LUXURY - contemporain.
 *
 * Le parti pris : les references graphiques du continent, tenues comme une
 * identite de studio d Accra ou de Lagos - pas comme un folklore. Aucune
 * bande zigzag, aucun motif charge. Deux gestes seulement :
 *  - le SOLEIL : un grand disque d accent, franc, qui deborde du bord droit
 *    derriere les noms - la forme pleine des affiches contemporaines ;
 *  - la TRAME : un tissage a filets fins (lignes croisees a 8 % d opacite,
 *    en degrades CSS), posee en bandeau discret ; on la devine, on ne la
 *    lit pas.
 *
 * Les noms sont en serif ronde et dense (DM Serif Display), fer a gauche,
 * tres grands. La date est un bloc compose : le quantieme en grand, le reste
 * en capitales serrees, cale a droite. Les rubriques sont ouvertes, sans
 * cadre, chacune annoncee par un carre d accent.
 *
 * Couleurs chaudes et franches - terre cuite, ocre, indigo - mais UNE masse
 * de couleur par ecran : le soleil, puis le bouton. Jamais les deux cote a
 * cote.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string; weave: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  terre: { bg: "#F5E8D3", paper: "#FBF3E7", ink: "#24160F", ink2: "#6B5343", line: "#E1CFB4" },
  ebene: { bg: "#17100B", paper: "#22170F", ink: "#F6E9D6", ink2: "#C3AE98", line: "#3A2A1F" },
};

/** [aplat, texte d accent (terre / ebene), texte sur aplat, trame] - texte sur aplat >= 4,5:1. */
const ACCENTS: Record<string, { terre: [string, string, string, string]; ebene: [string, string, string, string] }> = {
  ocre: { terre: ["#C4792C", "#8F5615", "#24160F", "#24160F"], ebene: ["#D9923F", "#E8AE66", "#1B120D", "#F6E9D6"] },
  indigo: { terre: ["#2E3F8F", "#26346F", "#FFFFFF", "#2E3F8F"], ebene: ["#6F82DC", "#9AA8EC", "#0F1330", "#9AA8EC"] },
  cuivre: { terre: ["#A8543A", "#82402C", "#FFF7EA", "#A8543A"], ebene: ["#C9714F", "#E09374", "#1B120D", "#E09374"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "terre") as "terre" | "ebene";
  const base = VARIANTS[v]!;
  const [acc, accentText, onAccent, weave] = (ACCENTS[accent] ?? ACCENTS.ocre!)[v];
  return { ...base, accent: acc, accentText, onAccent, weave };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Vous invitent à célébrer leur union",
  BIRTHDAY: "Vous invite à célébrer",
  CORPORATE: "Vous invite",
  MEMORIAL: "En mémoire de",
  OTHER: "Vous invite",
};

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Deux familles, une seule table. Nous serions honorés de vous y voir.",
  BIRTHDAY: "Venez fêter avec nous, comme à la maison.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const caps = "text-[11px] font-semibold uppercase tracking-[0.24em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(60px,18vw,80px)]";
  if (longest <= 12) return "text-[clamp(46px,14vw,62px)]";
  if (longest <= 18) return "text-[clamp(36px,10.5vw,46px)]";
  return "text-[clamp(28px,8vw,36px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-[3px] bg-[var(--al-accent)] px-6 text-[12.5px] font-bold uppercase tracking-[0.2em] text-[var(--al-on-accent)] transition-[transform,opacity] duration-150 hover:opacity-92 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--al-accent)]";

const styles: SectionStyles = {
  heading: "text-[32px] leading-[1.05] [font-family:var(--al-display)]",
  body: "text-[16px] leading-relaxed text-[var(--al-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--al-ink-2)]",
  label: cn(caps, "text-[var(--al-accent-text)]"),
  rule: "divide-[var(--al-line)] border-[var(--al-line)]",
  emphasis: "text-[23px] leading-[1.15] [font-family:var(--al-display)]",
  link: "border-b-2 border-[var(--al-accent)] text-[12px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[var(--al-accent-text)]",
};

/**
 * La trame : deux jeux de filets croises a 45 degres, en degrades CSS.
 * Assez fine pour qu on la sente, pas assez pour qu on la lise.
 */
const WEAVE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--al-weave) 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, var(--al-weave) 0 1px, transparent 1px 9px)",
  opacity: 0.1,
};

function Weave({ className }: { className?: string }) {
  return <span aria-hidden className={cn("pointer-events-none block", className)} style={WEAVE} />;
}

export function AfricanLuxury({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);
  const seal = monogram(view);
  const dark = theme.settings.variant === "ebene";
  const { starts } = event;

  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : null;
  const rest = sections.filter((s) => s !== wordSection);

  const style = {
    "--al-bg": p.bg,
    "--al-paper": p.paper,
    "--al-ink": p.ink,
    "--al-ink-2": p.ink2,
    "--al-line": p.line,
    "--al-accent": p.accent,
    "--al-accent-text": p.accentText,
    "--al-on-accent": p.onAccent,
    "--al-weave": p.weave,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": dark ? "#2C1F16" : "#E9D6B8",
    "--env-fold": dark ? "#251A13" : "#E0CBA9",
    "--env-flap": dark ? "#36271D" : "#D6BE98",
    "--env-edge": dark ? "#4A3728" : "#C4A87E",
    "--env-card": "#FBF3E7",
    "--env-card-ink": "#24160F",
    "--env-liner": p.accent,
    "--env-seal": p.accent,
    "--env-seal-ink": p.onAccent,
    "--env-font": "var(--al-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.bg,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.line,
    "--rsvp-rule": p.accent,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": dark ? "#F0A39C" : "#A8342D",
    "--rsvp-font": "var(--al-display)",
  } as React.CSSProperties;

  const blocks: { key: string; title: string | null; body: React.ReactNode }[] = [];
  if (venues.length > 0) {
    blocks.push({ key: "venues", title: venues.length > 1 ? "Les lieux" : "Le lieu", body: <VenueList venues={venues} styles={styles} preview={view.preview} align="left" /> });
  }
  for (const s of rest) blocks.push({ key: s.id, title: s.title, body: <SectionBody section={s} styles={styles} align="left" /> });

  return (
    <main
      style={style}
      className={cn(
        africanLuxuryDisplay.variable,
        "min-h-dvh overflow-x-clip bg-[var(--al-bg)] font-[family-name:var(--app-font-sans)] text-[var(--al-ink)] antialiased",
        dark ? "[color-scheme:dark]" : "[color-scheme:light]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={seal} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        {/* --------------------------------------------- L OUVERTURE -- */}
        <header className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-6 pb-8 pt-[max(16px,env(safe-area-inset-top))]">
          {/* Le soleil : la seule masse de couleur du premier ecran. */}
          <span
            aria-hidden
            className="pc-settle pointer-events-none absolute -right-[24vw] top-[7%] size-[min(74vw,320px)] rounded-full bg-[var(--al-accent)]"
            style={delay(60)}
          />
          <Weave className="pointer-events-none absolute inset-x-0 top-0 h-[92px]" />

          <div className="relative flex items-center justify-between">
            <span aria-hidden className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--al-ink)] text-[13px] font-bold leading-none [font-family:var(--al-display)]">
              {seal}
            </span>
            {dear && (
              <p className="pc-fade max-w-[62%] text-right text-[16px] italic leading-tight text-[var(--al-ink-2)] [font-family:var(--al-display)]" style={delay(0)}>
                Pour {dear}
              </p>
            )}
          </div>

          <div className="relative pt-16">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[10px] text-[var(--al-accent-text)]")}>{event.updatedNote}</p>}
            <h1 className="[font-family:var(--al-display)]">
              {event.hostParts.length === 2 ? (
                <>
                  <span className={cn("block leading-[0.9] tracking-[-0.02em] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                  <span className="pc-fade my-1 block text-[clamp(28px,8vw,38px)] italic leading-none text-[var(--al-accent-text)]" style={delay(200)}>
                    &amp;
                  </span>
                  <span className={cn("block leading-[0.9] tracking-[-0.02em] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[1]}</span>
                </>
              ) : (
                <span className={cn("block leading-[0.95] tracking-[-0.02em] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
              )}
            </h1>
            <p className={cn(caps, "pc-fade mt-6 max-w-[280px] leading-[1.9] text-[var(--al-ink-2)]")} style={delay(120)}>
              {EYEBROW[event.type]}
            </p>
          </div>

          <div className="relative">
            <div className="flex items-end justify-between gap-4 border-t-2 border-[var(--al-ink)] pt-5">
              <p className="sr-only">
                {starts.long}, {starts.time}
              </p>
              <p aria-hidden className={cn(caps, "leading-[1.9] text-[var(--al-ink-2)]")}>
                {starts.weekday}
                <br />
                {starts.time}
                {theme.settings.countdown && event.daysLeft !== null && (
                  <>
                    <br />
                    <span className="text-[var(--al-accent-text)]">{countdownText(event.daysLeft)}</span>
                  </>
                )}
              </p>
              <p aria-hidden className="flex items-baseline gap-2 [font-family:var(--al-display)]">
                <span className="text-[clamp(60px,18vw,76px)] leading-[0.85] tabular-nums">{starts.day}</span>
                <span className={cn(caps, "leading-[1.6]")}>
                  {starts.month.slice(0, 3)}
                  <br />
                  {starts.year}
                </span>
              </p>
            </div>
            <div id="al-hero-cta" data-hero-cta className="mt-6">
              <a href="#rsvp" className={button}>
                {ctaLabel(view)}
              </a>
              {rsvp.deadline && !rsvp.closed && (
                <p className="mt-3 text-[12.5px] text-[var(--al-ink-2)]">
                  Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------- LE MOT -- */}
        <section className="pc-inview px-6 pb-14 pt-10">
          <span aria-hidden className="mb-6 block size-3 bg-[var(--al-accent)]" />
          <p className="max-w-[20rem] whitespace-pre-line text-[clamp(24px,6.8vw,30px)] leading-[1.3] [font-family:var(--al-display)] [text-wrap:pretty]">
            {word ?? WELCOME[event.type]}
          </p>
        </section>

        {/* ----------------------------------------------------- PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview relative mb-16 pl-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--al-paper)]">
              <div className="pc-parallax absolute inset-0">
                <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
              </div>
            </div>
            {/* Le soleil revient, plus petit, sur le coin de la photographie. */}
            <span aria-hidden className="absolute -bottom-6 left-0 size-[92px] rounded-full bg-[var(--al-accent)]" />
            <Weave className="absolute -bottom-6 left-0 size-[92px] rounded-full" />
          </figure>
        )}

        <div className="px-6">
          {blocks.map((block) => (
            <section key={block.key} className="pc-inview mb-16">
              <div className="mb-6 flex items-center gap-3">
                <span aria-hidden className="size-2.5 shrink-0 bg-[var(--al-accent)]" />
                {block.title && <h2 className={cn(styles.heading, "[overflow-wrap:anywhere]")}>{block.title}</h2>}
              </div>
              {block.body}
            </section>
          ))}

          {/* --------------------------------------------------- REPONSE -- */}
          <div className="relative border-t-2 border-[var(--al-ink)] pt-10">
            <RsvpBlock
              view={view}
              rsvpForm={rsvpForm}
              rsvpStyle={rsvpStyle}
              styles={styles}
              button={button}
              align="left"
              title={<h2 className={cn(styles.heading, "text-[36px]")}>Votre réponse</h2>}
            />
          </div>

          <footer className="relative mt-20 flex items-center justify-between">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-[var(--al-accent)] text-[14px] font-bold leading-none text-[var(--al-on-accent)] [font-family:var(--al-display)]">
              {seal}
            </span>
            <p className={cn(caps, "text-right text-[10px] text-[var(--al-ink-2)]")}>
              {event.hostParts.join(" & ")}
              <br />
              {starts.day} {starts.month} {starts.year}
            </p>
          </footer>
        </div>
        <Weave className="mt-10 h-[56px] w-full" />
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="al-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="bg-[color-mix(in_srgb,var(--al-bg)_88%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}
