import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { editorialDisplay } from "./font";

/**
 * EDITORIAL - couverture de magazine.
 *
 * Le parti pris : tout est aligne a GAUCHE, sur une marge unique, comme une
 * page de magazine. Aucun ornement, aucun centrage : la composition tient par
 * les tailles et les filets noirs.
 *
 * La signature est la MANCHETTE : les deux prenoms en serif geante, l un en
 * romain, l autre en italique, qui occupent la largeur de l ecran ; sous
 * eux, un filet epais et la date en chiffres "12.12.26" a la taille d un
 * numero de parution. Une ligne de metadonnees en capitales court en haut de
 * page (INVITATION · MARIAGE · N° du jour).
 *
 * Les sections sont numerotees 01, 02, 03 en capitales grasses, separees par
 * un filet epais. Le bouton est un rectangle plein, texte en capitales.
 *
 * Deux variantes : blanc (papier) et noir (encre). Trois accents : un rouge,
 * un cobalt, un jaune citron - une seule couleur vive par page, utilisee sur
 * le numero et le filet du bouton, jamais sur les textes.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; accent: string; onInk: string };

const VARIANTS: Record<string, Omit<Palette, "accent">> = {
  blanc: { bg: "#FAFAF7", paper: "#F0EFEA", ink: "#141414", ink2: "#5C5C58", line: "#141414", onInk: "#FAFAF7" },
  noir: { bg: "#111111", paper: "#1C1C1C", ink: "#F5F5F0", ink2: "#A9A9A4", line: "#F5F5F0", onInk: "#111111" },
};

/**
 * L accent porte du texte (numeros, date) : il doit tenir 4,5:1 sur le papier
 * ET sur l encre, donc une valeur par variante. Le citron pur (#E5D400) ne
 * tient pas sur du blanc ; sur papier il devient une moutarde.
 */
const ACCENTS: Record<string, { blanc: string; noir: string }> = {
  rouge: { blanc: "#C7301F", noir: "#FF6A5B" },
  cobalt: { blanc: "#2A48D9", noir: "#7A8CFF" },
  citron: { blanc: "#8A6D00", noir: "#F5DA3B" },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "noir";
  return { ...VARIANTS[v]!, accent: (ACCENTS[accent] ?? ACCENTS.rouge!)[v] };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Réception",
  MEMORIAL: "Hommage",
  OTHER: "Événement",
};

const caps = "text-[11px] font-semibold uppercase tracking-[0.2em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/** Les noms occupent la largeur : plus courts, plus gros. */
function nameSize(longest: number): string {
  if (longest <= 6) return "text-[clamp(72px,24vw,104px)]";
  if (longest <= 9) return "text-[clamp(58px,18vw,80px)]";
  if (longest <= 13) return "text-[clamp(44px,13vw,60px)]";
  if (longest <= 18) return "text-[clamp(36px,10vw,46px)]";
  return "text-[clamp(30px,8vw,38px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-between gap-3 border-2 border-[var(--ed-ink)] bg-[var(--ed-ink)] px-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--ed-on-ink)] transition-[transform,opacity] duration-150 after:content-['→'] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ed-accent)]";

const styles: SectionStyles = {
  heading: "text-[38px] leading-[1] [font-family:var(--ed-display)]",
  body: "text-[16px] leading-relaxed text-[var(--ed-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ed-ink-2)]",
  label: cn(caps, "text-[var(--ed-ink-2)]"),
  rule: "divide-[var(--ed-ink)]/20 border-[var(--ed-ink)]/20",
  emphasis: "text-[26px] leading-[1.1] [font-family:var(--ed-display)]",
  link: cn(caps, "border-b-2 border-[var(--ed-accent)] text-[12px] transition-colors hover:text-[var(--ed-ink-2)]"),
};

export function Editorial({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);
  const dark = theme.settings.variant === "noir";

  const style = {
    "--ed-bg": p.bg,
    "--ed-paper": p.paper,
    "--ed-ink": p.ink,
    "--ed-ink-2": p.ink2,
    "--ed-accent": p.accent,
    "--ed-on-ink": p.onInk,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": dark ? "#2A2A2A" : "#DDDCD6",
    "--env-paper": dark ? "#1C1C1C" : "#ECEBE5",
    "--env-fold": dark ? "#171717" : "#E4E3DC",
    "--env-flap": dark ? "#242424" : "#DEDDD5",
    "--env-edge": dark ? "#333333" : "#C9C8C0",
    "--env-card": "#FAFAF7",
    "--env-card-ink": "#141414",
    "--env-liner": p.accent,
    "--env-seal": p.accent,
    "--env-seal-ink": "#FAFAF7",
    "--env-font": "var(--ed-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.bg,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": dark ? "#2E2E2E" : "#DAD9D2",
    "--rsvp-rule": p.ink,
    "--rsvp-accent": p.ink2,
    "--rsvp-error": dark ? "#F0A39C" : "#B3261E",
    "--rsvp-font": "var(--ed-display)",
  } as React.CSSProperties;

  const blocks: { key: string; title: string | null; body: React.ReactNode }[] = [];
  if (venues.length > 0) blocks.push({ key: "venues", title: venues.length > 1 ? "Les lieux" : "Le lieu", body: <VenueList venues={venues} styles={styles} preview={view.preview} align="left" /> });
  for (const section of sections) blocks.push({ key: section.id, title: section.title, body: <SectionBody section={section} styles={styles} align="left" /> });

  return (
    <main
      style={style}
      className={cn(
        editorialDisplay.variable,
        "min-h-dvh bg-[var(--ed-bg)] font-[family-name:var(--app-font-sans)] text-[var(--ed-ink)] antialiased [color-scheme:light]",
        dark && "[color-scheme:dark]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={monogram(view)} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words px-5 pb-28 pt-[max(14px,env(safe-area-inset-top))]">
        {/* --------------------------------------------- PREMIER ECRAN -- */}
        <header className="flex min-h-[calc(100svh-28px)] flex-col">
          <p className={cn(caps, "flex items-center justify-between gap-3 border-b-2 border-[var(--ed-ink)] pb-3 text-[10.5px]")}>
            <span>Invitation</span>
            <span>{KIND[event.type]}</span>
            <span className="tabular-nums">
              N° {event.starts.day}
            </span>
          </p>
          {event.updatedNote && <p className={cn(caps, "pc-fade mt-3 text-[10px] text-[var(--ed-accent)]")}>{event.updatedNote}</p>}

          <div className="flex flex-1 flex-col justify-center py-8">
            {dear && (
              <p className={cn(caps, "pc-fade mb-5 text-[var(--ed-ink-2)]")} style={delay(0)}>
                Pour {dear}
              </p>
            )}
            <h1 className="[font-family:var(--ed-display)]">
              {event.hostParts.length === 2 ? (
                <>
                  <span className={cn("block leading-[0.88] tracking-[-0.02em] [overflow-wrap:anywhere]", nameSize(longest))}>{event.hostParts[0]}</span>
                  <span className={cn("block leading-[0.88] tracking-[-0.02em] italic [overflow-wrap:anywhere]", nameSize(longest))}>
                    <span className="mr-[0.15em] text-[0.55em] not-italic text-[var(--ed-accent)]">&amp;</span>
                    {event.hostParts[1]}
                  </span>
                </>
              ) : (
                <span className={cn("block leading-[0.92] tracking-[-0.02em] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>{event.hostParts[0]}</span>
              )}
            </h1>

            <Masthead view={view} />

            {theme.settings.countdown && event.daysLeft !== null && (
              <p className={cn(caps, "pc-fade mt-4 text-[var(--ed-ink-2)]")} style={delay(560)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
          </div>

          <div id="ed-hero-cta" data-hero-cta className="w-full">
            <a href="#rsvp" className={button}>
              {ctaLabel(view)}
            </a>
            {rsvp.deadline && !rsvp.closed && (
              <p className="mt-3 text-[12.5px] text-[var(--ed-ink-2)]">
                Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
              </p>
            )}
          </div>
        </header>

        {/* --------------------------------------------------- PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview -mx-5 mt-12">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--ed-paper)]">
              <Image src={event.heroImageUrl} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
            <figcaption className={cn(caps, "px-5 pt-3 text-[10px] text-[var(--ed-ink-2)]")}>
              {event.hosts} — {event.starts.year}
            </figcaption>
          </figure>
        )}

        <div className="mt-14">
          {blocks.map((block, i) => (
            <section key={block.key} className="pc-inview border-t-2 border-[var(--ed-ink)] py-9">
              <p className="text-[13px] font-semibold tabular-nums tracking-[0.1em] text-[var(--ed-accent)]">{String(i + 1).padStart(2, "0")}</p>
              {block.title ? <h2 className={cn(styles.heading, "mb-7 mt-2 [overflow-wrap:anywhere]")}>{block.title}</h2> : <div className="mb-7" />}
              {block.body}
            </section>
          ))}
        </div>

        {/* -------------------------------------------------- REPONSE -- */}
        <div className="border-t-2 border-[var(--ed-ink)] pt-9">
          <RsvpBlock
            view={view}
            rsvpForm={rsvpForm}
            rsvpStyle={rsvpStyle}
            styles={styles}
            button={button}
            align="left"
            title={
              <>
                <p className="text-[13px] font-semibold tabular-nums tracking-[0.1em] text-[var(--ed-accent)]">{String(blocks.length + 1).padStart(2, "0")}</p>
                <h2 className={cn(styles.heading, "mt-2 text-[44px] italic")}>Votre réponse</h2>
              </>
            }
          />
        </div>

        <footer className={cn(caps, "mt-20 flex items-center justify-between border-t-2 border-[var(--ed-ink)] pt-4 text-[10px] text-[var(--ed-ink-2)]")}>
          <span>{event.hostParts.join(" & ")}</span>
          <span className="tabular-nums">
            {event.starts.day}.{event.starts.month.slice(0, 3)}.{event.starts.year}
          </span>
        </footer>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="ed-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t-2 border-[var(--ed-ink)] bg-[var(--ed-bg)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[420px]")}
        />
      )}
    </main>
  );
}

/** Filet epais, puis la date en numero de parution : 12.12 / 2026 / samedi 14 h. */
function Masthead({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  const month = starts.iso.slice(5, 7);
  return (
    <div className="mt-7 border-t-[6px] border-[var(--ed-ink)] pt-4">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="grid grid-cols-[auto_1fr] items-end gap-4">
        <span className="pc-fade text-[clamp(56px,17vw,76px)] leading-[0.85] tracking-[-0.03em] tabular-nums text-[var(--ed-accent)] [font-family:var(--ed-display)]" style={delay(200)}>
          {starts.day}.{month}
        </span>
        <span className={cn(caps, "pc-fade pb-1 text-[var(--ed-ink)]")} style={delay(320)}>
          <span className="block text-[18px] tracking-[-0.01em] [font-family:var(--ed-display)]">{starts.year}</span>
          <span className="mt-1 block text-[10.5px] leading-[1.6] text-[var(--ed-ink-2)]">
            {starts.weekday}
            <br />
            {starts.time}
          </span>
        </span>
      </div>
    </div>
  );
}
