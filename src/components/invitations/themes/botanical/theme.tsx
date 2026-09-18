import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { botanicalDisplay } from "./font";

/**
 * BOTANICAL - jardin de papier.
 *
 * Le parti pris : un faire-part champetre, aquarelle et feuillages, mais sans
 * une seule image decorative a telecharger. Les feuilles sont dessinees en
 * SVG en ligne (quelques centaines d octets), les fonds sont des aplats.
 *
 * La signature est l ARCHE : la photo du couple, ou a defaut un bouquet de
 * feuilles, dans une fenetre en plein cintre au sommet du premier ecran -
 * comme une allee de jardin. En dessous, les noms en serif douce (Fraunces,
 * axe SOFT), la date sur une tige, le bouton en galet arrondi.
 *
 * Les sections sont des cartes de papier posees sur le fond, angles ronds,
 * texte aligne a gauche : on feuillette un carnet, on ne descend pas une
 * colonne. Une petite feuille marque chaque titre.
 *
 * Deux variantes : creme (fond clair) et mousse (vert profond, le meme jardin
 * a la tombee du jour).
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string; onAccent: string; leaf: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  creme: { bg: "#F7F3EA", paper: "#FFFDF8", ink: "#27302A", ink2: "#66705F", line: "#E3DECF" },
  mousse: { bg: "#1F2A22", paper: "#28352C", ink: "#F1EEE4", ink2: "#B6BDAE", line: "#3A473C" },
};

/** [filet et bouton, texte d accent (clair / sombre), texte sur bouton, feuille] - bouton >= 4,5:1 (axe). */
const ACCENTS: Record<string, { creme: [string, string, string, string]; mousse: [string, string, string, string] }> = {
  olive: { creme: ["#5E6E40", "#4E5C36", "#FFFFFF", "#8A9A67"], mousse: ["#9FB07A", "#B9C79A", "#1F2A22", "#8A9A67"] },
  terracotta: { creme: ["#A5573C", "#864330", "#FFFFFF", "#C88A73"], mousse: ["#D48A6E", "#E3A68F", "#1F2A22", "#C88A73"] },
  lavande: { creme: ["#6B5F8E", "#584D7A", "#FFFFFF", "#A497C4"], mousse: ["#AFA2D0", "#C5BADF", "#1F2A22", "#A497C4"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "creme") as "creme" | "mousse";
  const base = VARIANTS[v]!;
  const [rule, accentText, onAccent, leaf] = (ACCENTS[accent] ?? ACCENTS.olive!)[v];
  return { ...base, rule, accentText, onAccent, leaf };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "se marient",
  BIRTHDAY: "vous invite à fêter",
  CORPORATE: "vous invite",
  MEMORIAL: "en mémoire de",
  OTHER: "vous invite",
};

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(44px,13vw,58px)]";
  if (longest <= 12) return "text-[clamp(36px,11vw,50px)]";
  if (longest <= 18) return "text-[clamp(30px,9vw,40px)]";
  return "text-[clamp(26px,7.5vw,34px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--bt-rule)] px-6 text-[15px] font-medium text-[var(--bt-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--bt-rule)]";

const styles: SectionStyles = {
  heading: "text-[30px] italic leading-tight [font-family:var(--bt-display)] [font-variation-settings:'SOFT'_100]",
  body: "text-[16px] leading-relaxed text-[var(--bt-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--bt-ink-2)]",
  label: "text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--bt-accent)]",
  rule: "divide-[var(--bt-line)] border-[var(--bt-line)]",
  emphasis: "text-[22px] leading-[1.2] [font-family:var(--bt-display)] [font-variation-settings:'SOFT'_100]",
  link: "rounded-full border border-[var(--bt-rule)] px-4 text-[13px] font-medium text-[var(--bt-accent)] transition-colors hover:bg-[var(--bt-rule)] hover:text-[var(--bt-on-accent)]",
};

export function Botanical({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);

  const style = {
    "--bt-bg": p.bg,
    "--bt-paper": p.paper,
    "--bt-ink": p.ink,
    "--bt-ink-2": p.ink2,
    "--bt-line": p.line,
    "--bt-rule": p.rule,
    "--bt-accent": p.accentText,
    "--bt-on-accent": p.onAccent,
    "--bt-leaf": p.leaf,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": theme.settings.variant === "mousse" ? "#2E3B31" : "#E9E2D0",
    "--env-fold": theme.settings.variant === "mousse" ? "#28352C" : "#E1D9C4",
    "--env-flap": theme.settings.variant === "mousse" ? "#37463A" : "#DAD1BA",
    "--env-edge": theme.settings.variant === "mousse" ? "#4A5A4C" : "#C8BEA3",
    "--env-card": "#FFFDF8",
    "--env-card-ink": "#27302A",
    "--env-liner": p.leaf,
    "--env-seal": p.rule,
    "--env-seal-ink": p.onAccent,
    "--env-font": "var(--bt-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.paper,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.line,
    "--rsvp-rule": p.rule,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": theme.settings.variant === "mousse" ? "#F0A39C" : "#A8342D",
    "--rsvp-font": "var(--bt-display)",
  } as React.CSSProperties;

  return (
    <main
      style={style}
      className={cn(
        botanicalDisplay.variable,
        "min-h-dvh bg-[var(--bt-bg)] font-[family-name:var(--app-font-sans)] text-[var(--bt-ink)] antialiased [color-scheme:light]",
        theme.settings.variant === "mousse" && "[color-scheme:dark]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear} monogram={monogram(view)} />
        </div>
      )}

      <div className="mx-auto w-full max-w-[460px] break-words px-5 pb-28 pt-[max(16px,env(safe-area-inset-top))]">
        {/* --------------------------------------------- PREMIER ECRAN -- */}
        <header className="flex min-h-[calc(100svh-32px)] flex-col items-center justify-center py-4 text-center">
          <Arch view={view} />

          {event.updatedNote && <p className="pc-fade mt-5 text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--bt-accent)]">{event.updatedNote}</p>}

          {dear && (
            <p className="pc-fade mt-5 text-[16px] italic text-[var(--bt-ink-2)] [font-family:var(--bt-display)]" style={delay(0)}>
              Pour {dear}
            </p>
          )}

          <h1 className={cn("mt-3 font-normal [font-family:var(--bt-display)] [font-variation-settings:'SOFT'_100]", !dear && "mt-7")}>
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn("block leading-[1] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                <span className="block text-[22px] italic leading-[1.25] text-[var(--bt-accent)]">et</span>
                <span className={cn("block leading-[1] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[1]}</span>
              </>
            ) : (
              <span className={cn("block leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
            )}
          </h1>
          <p className="pc-fade mt-2 text-[19px] italic text-[var(--bt-ink-2)] [font-family:var(--bt-display)]" style={delay(120)}>
            {EYEBROW[event.type]}
          </p>

          <Stem view={view} />

          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-2 text-[14px] font-medium text-[var(--bt-accent)]" style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}

          <div id="bt-hero-cta" data-hero-cta className="mt-6 w-full max-w-[320px]">
            <a href="#rsvp" className={button}>
              {ctaLabel(view)}
            </a>
            {rsvp.deadline && !rsvp.closed && (
              <p className="mt-3 text-[12.5px] text-[var(--bt-ink-2)]">
                Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
              </p>
            )}
          </div>
        </header>

        <div className="mt-10 space-y-5">
          {venues.length > 0 && (
            <Card title={venues.length > 1 ? "Les lieux" : "Le lieu"}>
              <VenueList venues={venues} styles={styles} preview={view.preview} align="left" />
            </Card>
          )}

          {sections.map((section) => (
            <Card key={section.id} title={section.title}>
              <SectionBody section={section} styles={styles} align="left" />
            </Card>
          ))}

          {/* ------------------------------------------------ REPONSE -- */}
          <div className="pc-inview rounded-[28px] bg-[var(--bt-paper)] px-5 py-9 shadow-[0_1px_0_var(--bt-line)]">
            <RsvpBlock
              view={view}
              rsvpForm={rsvpForm}
              rsvpStyle={rsvpStyle}
              styles={styles}
              button={button}
              title={
                <>
                  <Leaf className="mx-auto h-7 w-auto text-[var(--bt-leaf)]" />
                  <h2 className={cn(styles.heading, "mt-3 text-[32px]")}>Votre réponse</h2>
                </>
              }
            />
          </div>
        </div>

        <footer className="mt-20 text-center">
          <Leaf className="mx-auto h-6 w-auto text-[var(--bt-leaf)]" />
          <p className="mt-3 text-[20px] italic [font-family:var(--bt-display)]">{event.hostParts.join(" et ")}</p>
          <p className="mt-1 text-[13px] text-[var(--bt-ink-2)]">
            {event.starts.day} {event.starts.month} {event.starts.year}
          </p>
        </footer>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="bt-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="bg-[var(--bt-bg)]/95 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
          buttonClassName={cn(button, "mx-auto max-w-[412px] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]")}
        />
      )}
    </main>
  );
}

/** Fenetre en plein cintre : la photo si elle existe, sinon un bouquet dessine. */
function Arch({ view }: { view: InvitationView }) {
  const { event } = view;
  // Hauteur bornee a l ecran : sur un 360x640, l arche laisse la place aux noms et au bouton.
  return (
    <div className="relative aspect-[4/5] h-[clamp(150px,22svh,300px)] overflow-hidden rounded-t-full rounded-b-[28px] bg-[var(--bt-paper)] ring-1 ring-[var(--bt-line)]">
      {event.heroImageUrl ? (
        <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="280px" className="object-cover" />
      ) : (
        <div className="flex h-full items-end justify-center pb-6">
          <Bouquet />
        </div>
      )}
    </div>
  );
}

/** ——✿—— samedi 12 décembre 2026 · 14 h 00 */
function Stem({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  return (
    <div className="mt-5 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="flex items-center justify-center gap-3 text-[var(--bt-leaf)]">
        <span className="pc-draw h-px w-12 bg-current" style={{ ...delay(300), transformOrigin: "right" }} />
        <Leaf className="h-5 w-auto" />
        <span className="pc-draw h-px w-12 bg-current" style={delay(300)} />
      </div>
      <p aria-hidden className="mt-3 text-[clamp(21px,6vw,26px)] leading-tight [font-family:var(--bt-display)] [font-variation-settings:'SOFT'_100]">
        {starts.weekday} {starts.day} {starts.month} {starts.year}
      </p>
      <p aria-hidden className="pc-fade mt-0.5 text-[14px] text-[var(--bt-ink-2)]" style={delay(480)}>
        à {starts.time}
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <section className="pc-inview rounded-[28px] bg-[var(--bt-paper)] px-5 py-7 shadow-[0_1px_0_var(--bt-line)]">
      {title && (
        <h2 className={cn(styles.heading, "mb-6 flex items-center gap-2.5 [overflow-wrap:anywhere]")}>
          <Leaf className="h-5 w-auto shrink-0 text-[var(--bt-leaf)]" />
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/** Une feuille d olivier, deux courbes. */
function Leaf({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 21C6 12 12 6 21 3c-1 9-7 15-16 17" />
      <path d="M5 19c4-4 8-8 13-13" />
    </svg>
  );
}

/** Bouquet de sept tiges, trace en SVG : aucune image a telecharger. */
function Bouquet() {
  return (
    <svg aria-hidden viewBox="0 0 200 220" fill="none" className="h-[70%] w-auto text-[var(--bt-leaf)]" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M100 215V70" />
      <path d="M100 150c-25-10-45-35-50-70 25 5 45 30 50 70Z" />
      <path d="M100 150c25-10 45-35 50-70-25 5-45 30-50 70Z" />
      <path d="M100 105c-18-8-32-28-35-55 18 4 32 25 35 55Z" />
      <path d="M100 105c18-8 32-28 35-55-18 4-32 25-35 55Z" />
      <path d="M100 70c-10-6-18-18-20-35 10 3 18 16 20 35Z" />
      <path d="M100 70c10-6 18-18 20-35-10 3-18 16-20 35Z" />
      <path d="M100 215c-20 0-36-6-46-18M100 215c20 0 36-6 46-18" opacity="0.6" />
    </svg>
  );
}
