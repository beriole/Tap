import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { africanLuxuryDisplay } from "./font";

/**
 * AFRICAN LUXURY - etoffe tissee.
 *
 * Le parti pris : la page est une piece de tissu. Deux BANDES tissees
 * (motif geometrique en degrades CSS, zero image) bordent la page en haut et
 * en bas ; entre elles, l invitation sur un fond terre ou ebene.
 *
 * La signature est le MEDAILLON : un disque a double cercle, monogramme au
 * centre, pose sur la bande du haut. Les noms sont en serif ronde et dense
 * (DM Serif Display), la date dans un ruban tisse plus etroit, le jour en
 * grand. Chaque titre de section est souligne d un court trait de motif.
 *
 * Les couleurs sont chaudes et franches : terre cuite, ocre, indigo. Le motif
 * ne porte jamais de texte - il encadre, il ne se lit pas. Le contraste
 * texte / fond est tenu par les aplats, jamais par les bandes.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string; weave: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  terre: { bg: "#F6E9D6", paper: "#FBF3E7", ink: "#2A1A12", ink2: "#6E5646", line: "#E4D2B8" },
  ebene: { bg: "#1B120D", paper: "#251A13", ink: "#F6E9D6", ink2: "#C5B09A", line: "#3D2C21" },
};

/** [aplat, texte d accent (terre / ebene), texte sur aplat, seconde couleur du tissage] */
const ACCENTS: Record<string, { terre: [string, string, string, string]; ebene: [string, string, string, string] }> = {
  ocre: { terre: ["#C0782E", "#8F5615", "#FFF7EA", "#2A1A12"], ebene: ["#D9923F", "#E8AE66", "#1B120D", "#F6E9D6"] },
  indigo: { terre: ["#2E3F8F", "#26346F", "#FFFFFF", "#C0782E"], ebene: ["#5A6FD1", "#8C9CE6", "#0F1330", "#D9923F"] },
  cuivre: { terre: ["#A8543A", "#82402C", "#FFF7EA", "#2A1A12"], ebene: ["#C9714F", "#E09374", "#1B120D", "#F6E9D6"] },
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

const caps = "text-[11px] font-semibold uppercase tracking-[0.26em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(50px,15vw,66px)]";
  if (longest <= 12) return "text-[clamp(40px,12vw,54px)]";
  if (longest <= 18) return "text-[clamp(32px,9.5vw,42px)]";
  return "text-[clamp(27px,7.5vw,34px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-[4px] bg-[var(--al-accent)] px-6 text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--al-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--al-accent)]";

const styles: SectionStyles = {
  heading: "text-[30px] leading-tight [font-family:var(--al-display)]",
  body: "text-[16px] leading-relaxed text-[var(--al-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--al-ink-2)]",
  label: cn(caps, "text-[var(--al-accent-text)]"),
  rule: "divide-[var(--al-line)] border-[var(--al-line)]",
  emphasis: "text-[23px] leading-[1.15] [font-family:var(--al-display)]",
  link: "border-b-2 border-[var(--al-accent)] text-[13px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[var(--al-accent-text)]",
};

/**
 * Le tissage : triangles alternes sur deux rangs, en degrades lineaires
 * repetes. Deux couleurs seulement, celles de l accent, pour rester une
 * bordure et non un tableau.
 */
const WEAVE: React.CSSProperties = {
  backgroundColor: "var(--al-accent)",
  backgroundImage:
    "linear-gradient(135deg, var(--al-weave) 25%, transparent 25%), linear-gradient(225deg, var(--al-weave) 25%, transparent 25%), linear-gradient(45deg, var(--al-weave) 25%, transparent 25%), linear-gradient(315deg, var(--al-weave) 25%, transparent 25%)",
  backgroundPosition: "12px 0, 12px 0, 0 0, 0 0",
  backgroundSize: "24px 24px",
};

export function AfricanLuxury({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);
  const seal = monogram(view);
  const dark = theme.settings.variant === "ebene";

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
    "--env-card-ink": "#2A1A12",
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

  return (
    <main
      style={style}
      className={cn(
        africanLuxuryDisplay.variable,
        "min-h-dvh bg-[var(--al-bg)] font-[family-name:var(--app-font-sans)] text-[var(--al-ink)] antialiased [color-scheme:light]",
        dark && "[color-scheme:dark]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear} monogram={seal} />
        </div>
      )}

      {/* Bande du haut, et le medaillon pose dessus. */}
      <div className="relative">
        <div aria-hidden className="h-14 w-full pt-[env(safe-area-inset-top)]" style={WEAVE} />
        <span
          aria-hidden
          className="absolute left-1/2 top-14 flex size-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[var(--al-bg)] bg-[var(--al-accent)] text-[24px] leading-none text-[var(--al-on-accent)] outline outline-2 outline-[var(--al-accent)] [font-family:var(--al-display)]"
        >
          {seal}
        </span>
      </div>

      <div className="mx-auto w-full max-w-[460px] break-words px-6 pb-24">
        {/* --------------------------------------------- PREMIER ECRAN -- */}
        <header className="flex min-h-[calc(100svh-56px)] flex-col items-center justify-center pb-10 pt-16 text-center">
          {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[10px] text-[var(--al-accent-text)]")}>{event.updatedNote}</p>}

          {dear && (
            <p className="pc-fade mb-5 text-[18px] italic text-[var(--al-ink-2)] [font-family:var(--al-display)]" style={delay(0)}>
              Chers {dear}
            </p>
          )}

          <h1 className="[font-family:var(--al-display)]">
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn("block leading-[1] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                <span className="pc-fade my-1.5 flex items-center justify-center gap-3" style={delay(200)}>
                  <span aria-hidden className="h-[3px] w-8 bg-[var(--al-accent)]" />
                  <span className="text-[26px] italic leading-none text-[var(--al-accent-text)]">&amp;</span>
                  <span aria-hidden className="h-[3px] w-8 bg-[var(--al-accent)]" />
                </span>
                <span className={cn("block leading-[1] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[1]}</span>
              </>
            ) : (
              <span className={cn("block leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
            )}
          </h1>

          <p className={cn(caps, "pc-fade mt-6 max-w-[300px] text-[10.5px] leading-[1.9] text-[var(--al-ink-2)]")} style={delay(120)}>
            {EYEBROW[event.type]}
          </p>

          <Ribbon view={view} />

          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-4 text-[17px] italic text-[var(--al-accent-text)] [font-family:var(--al-display)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}

          <div id="al-hero-cta" data-hero-cta className="mt-8 w-full max-w-[320px]">
            <a href="#rsvp" className={button}>
              {ctaLabel(view)}
            </a>
            {rsvp.deadline && !rsvp.closed && (
              <p className="mt-3 text-[12.5px] text-[var(--al-ink-2)]">
                Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
              </p>
            )}
          </div>
        </header>

        {/* --------------------------------------------------- PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview mb-16 rounded-t-[140px] p-1.5" style={WEAVE}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[134px] bg-[var(--al-paper)]">
              <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
          </figure>
        )}

        {venues.length > 0 && (
          <Section title={venues.length > 1 ? "Les lieux" : "Le lieu"}>
            <VenueList venues={venues} styles={styles} preview={view.preview} />
          </Section>
        )}

        {sections.map((section) => (
          <Section key={section.id} title={section.title}>
            <SectionBody section={section} styles={styles} />
          </Section>
        ))}

        {/* -------------------------------------------------- REPONSE -- */}
        <RsvpBlock
          view={view}
          rsvpForm={rsvpForm}
          rsvpStyle={rsvpStyle}
          styles={styles}
          button={button}
          title={
            <>
              <Stitch />
              <h2 className={cn(styles.heading, "mt-5 text-[34px]")}>Votre réponse</h2>
            </>
          }
        />

        <footer className="mt-20 flex flex-col items-center text-center">
          <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-[var(--al-accent)] text-[18px] leading-none text-[var(--al-on-accent)] [font-family:var(--al-display)]">
            {seal}
          </span>
          <p className={cn(caps, "mt-4 text-[10px] text-[var(--al-ink-2)]")}>
            {event.starts.day} {event.starts.month} {event.starts.year}
          </p>
        </footer>
      </div>

      <div aria-hidden className="h-10 w-full" style={WEAVE} />

      {!rsvp.closed && (
        <RsvpDock
          heroId="al-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--al-line)] bg-[var(--al-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

/** Le ruban : jour en grand sur un fond d accent, entoure de deux fils tisses. */
function Ribbon({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  return (
    <div className="mt-8 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="pc-draw h-2 w-full" style={{ ...WEAVE, ...delay(300), transformOrigin: "right" }} />
        <span className="flex min-w-[84px] flex-col items-center rounded-[4px] bg-[var(--al-accent)] px-4 py-2 text-[var(--al-on-accent)]">
          <span className="text-[clamp(44px,13vw,56px)] leading-[0.95] tabular-nums [font-family:var(--al-display)]">{starts.day}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{starts.month} {starts.year}</span>
        </span>
        <span className="pc-draw h-2 w-full" style={{ ...WEAVE, ...delay(300) }} />
      </div>
      <p aria-hidden className={cn(caps, "mt-4 text-[var(--al-ink)]")}>
        {starts.weekday} · {starts.time}
      </p>
    </div>
  );
}

function Stitch() {
  return <span aria-hidden className="mx-auto block h-2 w-16" style={WEAVE} />;
}

function Section({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <section className="pc-inview mb-16 text-center">
      <Stitch />
      {title ? <h2 className={cn(styles.heading, "mb-8 mt-5 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-8" />}
      {children}
    </section>
  );
}
