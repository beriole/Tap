import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationSection, InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { HeroCta, RsvpBlock, SectionBody, countdownText, delay, monogram, salutation, type SectionStyles } from "../../shared";
import { cityOf } from "../../stationery";
import { editorialDisplay } from "./font";

/**
 * ROMANTIC EDITORIAL - le numero special.
 *
 * Le parti pris : l invitation est un magazine dont les maries font la une.
 * Le premier ecran est une COUVERTURE : la photographie a fond perdu, la
 * manchette en capitales, les prenoms en serif geante (romain, puis italique)
 * posee sur l image, et une "edition personnelle" au nom de l invite - comme
 * l etiquette d abonne d un vrai magazine.
 *
 * La suite se feuillette : chaque rubrique ouvre sur un folio (rubrique a
 * gauche, numero de page a droite, filet noir), puis une composition
 * asymetrique differente - edito en lettrine, quantieme monumental avec le
 * mois en colonne verticale, adresses numerotees, deroule en tableau, page
 * photo avec citation en exergue, RSVP en encart, colophon en pied.
 *
 * Instrument Serif pour tout ce qui se lit comme un titre, Geist pour le
 * reste. Une seule couleur vive, rare : l esperluette, les numeros, un filet.
 * Les variables restent en --ed-* (verifie par l audit).
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; accent: string; onInk: string; bright: string };

const VARIANTS: Record<string, Omit<Palette, "accent" | "bright">> = {
  blanc: { bg: "#FAF8F4", paper: "#EFEBE3", ink: "#151312", ink2: "#5B5651", onInk: "#FAF8F4" },
  noir: { bg: "#100F0E", paper: "#1B1918", ink: "#F4F1EB", ink2: "#ABA59D", onInk: "#100F0E" },
};

/**
 * L accent porte du texte : il doit tenir 4,5:1 sur le papier ET sur l encre,
 * donc une valeur par variante. Sur la photo (voile sombre), c est toujours la
 * valeur claire qui sert.
 */
const ACCENTS: Record<string, { blanc: string; noir: string }> = {
  rouge: { blanc: "#C0301F", noir: "#FF6A5B" },
  cobalt: { blanc: "#2A48D9", noir: "#8594FF" },
  citron: { blanc: "#7E6400", noir: "#F5DA3B" },
};

function palette(variant: string, accent: string): Palette & { dark: boolean } {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "noir";
  const a = ACCENTS[accent] ?? ACCENTS.rouge!;
  return { ...VARIANTS[v]!, accent: a[v], bright: a.noir, dark: v === "noir" };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Réception",
  MEMORIAL: "Hommage",
  OTHER: "Événement",
};

const COVER_LINE: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Ils se marient",
  BIRTHDAY: "Vous êtes invité",
  CORPORATE: "Invitation",
  MEMORIAL: "En mémoire de",
  OTHER: "Invitation",
};

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous avons écrit cette histoire à deux. Nous aimerions en tourner la plus belle page avec vous, entourés de ceux qui comptent.",
  BIRTHDAY: "Une année de plus, et l’envie de la fêter avec vous.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const caps = "text-[11px] font-semibold uppercase tracking-[0.2em]";
const serif = "[font-family:var(--ed-display)]";

/** Les noms occupent la largeur : plus courts, plus gros. */
function nameSize(longest: number): string {
  if (longest <= 6) return "text-[clamp(76px,25vw,112px)]";
  if (longest <= 9) return "text-[clamp(60px,19vw,86px)]";
  if (longest <= 13) return "text-[clamp(46px,14vw,64px)]";
  if (longest <= 18) return "text-[clamp(36px,10.5vw,48px)]";
  return "text-[clamp(30px,8.4vw,40px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-between gap-3 bg-[var(--ed-ink)] px-5 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[var(--ed-on-ink)] transition-[transform,opacity] duration-150 after:content-['→'] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ed-accent)]";

/** Sur la photo : papier blanc, encre noire, quelle que soit la variante. */
const coverButton =
  "flex min-h-[54px] w-full items-center justify-between gap-3 bg-[#FAF8F4] px-5 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-[#151312] transition-[transform,opacity] duration-150 after:content-['→'] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

const styles: SectionStyles = {
  heading: cn(serif, "text-[44px] leading-[0.95] tracking-[-0.01em]"),
  body: "text-[16px] leading-relaxed text-[var(--ed-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ed-ink-2)]",
  label: cn(caps, "text-[var(--ed-ink-2)]"),
  rule: "divide-[color-mix(in_srgb,var(--ed-ink)_18%,transparent)] border-[color-mix(in_srgb,var(--ed-ink)_18%,transparent)]",
  emphasis: cn(serif, "text-[25px] leading-[1.1]"),
  link: cn(caps, "inline-flex items-center gap-1.5 text-[11px] underline decoration-[var(--ed-accent)] decoration-2 underline-offset-[6px] transition-opacity hover:opacity-70"),
};

export function Editorial({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const city = cityOf(view);
  const photo = event.heroImageUrl;
  const longest = Math.max(...event.hostParts.map((h) => h.length));

  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : WELCOME[event.type];
  const programs = sections.filter((s) => s.kind === "program");
  const infos = sections.filter((s) => s !== wordSection && s.kind !== "program");

  // Le folio : chaque rubrique prend le numero de page suivant.
  let page = 1;
  const folio = () => String(++page).padStart(2, "0");

  const style = {
    "--ed-bg": p.bg,
    "--ed-paper": p.paper,
    "--ed-ink": p.ink,
    "--ed-ink-2": p.ink2,
    "--ed-accent": p.accent,
    "--ed-on-ink": p.onInk,
    "--ed-bright": p.bright,
  } as React.CSSProperties;

  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.dark ? "#2A2A2A" : "#DDDAD2",
    "--env-paper": p.dark ? "#1C1B1A" : "#ECE8E0",
    "--env-fold": p.dark ? "#171615" : "#E4DFD6",
    "--env-flap": p.dark ? "#252322" : "#DDD8CE",
    "--env-edge": p.dark ? "#353331" : "#C8C2B6",
    "--env-card": "#FAF8F4",
    "--env-card-ink": "#151312",
    "--env-liner": p.accent,
    "--env-seal": p.dark ? p.bright : p.accent,
    "--env-seal-ink": p.dark ? "#100F0E" : "#FAF8F4",
    "--env-font": "var(--ed-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.paper,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.dark ? "#34312E" : "#D5D0C6",
    "--rsvp-rule": p.ink,
    "--rsvp-accent": p.ink2,
    "--rsvp-error": p.dark ? "#F0A39C" : "#B3261E",
    "--rsvp-font": "var(--ed-display)",
  } as React.CSSProperties;

  // Couleurs de la couverture : blanc sur la photo voilee, encre sinon.
  const cover = photo
    ? ({ "--cv-ink": "#FFFFFF", "--cv-ink-2": "#EDE9E2", "--cv-accent": p.bright, "--cv-rule": "rgba(255,255,255,0.7)" } as React.CSSProperties)
    : ({ "--cv-ink": "var(--ed-ink)", "--cv-ink-2": "var(--ed-ink-2)", "--cv-accent": "var(--ed-accent)", "--cv-rule": "var(--ed-ink)" } as React.CSSProperties);

  return (
    <main
      style={style}
      className={cn(
        editorialDisplay.variable,
        "relative min-h-dvh overflow-x-clip bg-[var(--ed-bg)] font-[family-name:var(--app-font-sans)] text-[var(--ed-ink)] antialiased",
        p.dark ? "[color-scheme:dark]" : "[color-scheme:light]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={monogram(view)} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        {/* ------------------------------------------------ COUVERTURE -- */}
        <header style={cover} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden px-5 pb-6 pt-[max(14px,env(safe-area-inset-top))] text-[var(--cv-ink)]">
          {photo ? (
            <>
              <div className="pc-settle absolute inset-0 -z-20">
                <Image src={photo} alt={event.hosts} fill priority sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
              </div>
              {/* Voile : haut et bas assombris, le milieu garde l image. */}
              <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,9,8,0.62)_0%,rgba(10,9,8,0.18)_24%,rgba(10,9,8,0.1)_40%,rgba(10,9,8,0.55)_62%,rgba(10,9,8,0.86)_100%)]" />
            </>
          ) : (
            <svg aria-hidden viewBox="0 0 100 100" className="absolute -right-10 top-[12%] -z-10 h-[62%] w-auto text-[var(--ed-accent)] opacity-[0.12]">
              <text x="50" y="84" textAnchor="middle" fontSize="110" fontStyle="italic" fill="currentColor" style={{ fontFamily: "var(--ed-display)" }}>
                &amp;
              </text>
            </svg>
          )}

          <p className={cn(caps, "flex items-center justify-between gap-3 border-b border-[var(--cv-rule)] pb-2.5 text-[10.5px]")}>
            <span>Numéro spécial</span>
            <span className="hidden min-[380px]:inline">{KIND[event.type]}</span>
            <span className="tabular-nums">
              {starts.month.slice(0, 1).toUpperCase() + starts.month.slice(1)} {starts.year}
            </span>
          </p>

          {(dear || event.updatedNote) && (
            <div className="pc-fade ml-auto mt-4 max-w-[74%] text-right" style={delay(0)}>
              {dear && (
                <>
                  <p className={cn(caps, "text-[10px] text-[var(--cv-ink-2)]")}>Édition personnelle</p>
                  <p className={cn(serif, "mt-1 text-[20px] italic leading-[1.15] [text-wrap:balance]")}>Pour {dear}</p>
                </>
              )}
              {event.updatedNote && <p className={cn(caps, "mt-2 text-[10px] text-[var(--cv-accent)]")}>{event.updatedNote}</p>}
            </div>
          )}

          <div className="min-h-8 flex-1" />

          <p className={cn(caps, "pc-fade text-[var(--cv-ink-2)]")} style={delay(80)}>
            {COVER_LINE[event.type]}
          </p>
          <h1 className={cn(serif, "mt-2 tracking-[-0.03em]")}>
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn(nameSize(longest), "block leading-[0.86] [overflow-wrap:anywhere]")}>{event.hostParts[0]}</span>
                <span className={cn(nameSize(longest), "block pl-[0.35em] italic leading-[0.92] [overflow-wrap:anywhere]")}>
                  <span className="mr-[0.08em] text-[var(--cv-accent)]">&amp;</span>
                  {event.hostParts[1]}
                </span>
              </>
            ) : (
              <span className={cn(nameSize(longest), "block leading-[0.92] [overflow-wrap:anywhere] [text-wrap:balance]")}>{event.hostParts[0]}</span>
            )}
          </h1>
          <p className={cn(serif, "mt-4 border-t border-[var(--cv-rule)] pt-3 text-[clamp(19px,5.4vw,22px)] italic leading-snug")}>
            {starts.weekday} {starts.day} {starts.month} {starts.year}, {starts.time}
            {city && <span className="not-italic text-[var(--cv-ink-2)]"> — {city}</span>}
          </p>

          <HeroCta view={view} id="ed-hero-cta" button={photo ? coverButton : button} className="mt-5" noteClassName="text-[var(--cv-ink-2)]" />
        </header>

        <div className="px-5">
          {/* ------------------------------------------------- EDITO -- */}
          <section className="pc-inview pt-14">
            <Folio kicker="Édito" n={folio()} />
            <p className={cn(serif, "mt-8 whitespace-pre-line text-[clamp(23px,6.4vw,27px)] leading-[1.32] [text-wrap:pretty] first-letter:float-left first-letter:mr-2 first-letter:mt-[0.08em] first-letter:text-[3.4em] first-letter:leading-[0.8] first-letter:text-[var(--ed-accent)]")}>
              {word}
            </p>
            {event.type === "WEDDING" && (
              <p className={cn(serif, "mt-6 text-right text-[20px] italic text-[var(--ed-ink-2)]")}>
                <span aria-hidden className="mr-3 inline-block h-px w-8 translate-y-[-6px] bg-[var(--ed-accent)]" />
                {event.hostParts.join(" & ")}
              </p>
            )}
          </section>

          {/* -------------------------------------------------- DATE -- */}
          <section className="pc-inview pt-20">
            <Folio kicker="La date" n={folio()} />
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <div aria-hidden className="mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
              <span className={cn(serif, "text-[clamp(150px,50vw,220px)] leading-[0.78] tracking-[-0.05em] tabular-nums")}>{starts.day}</span>
              <span className={cn(caps, "pb-2 text-[13px] tracking-[0.34em] [writing-mode:vertical-rl] rotate-180")}>
                {starts.month} {starts.year}
              </span>
            </div>
            <div aria-hidden className="mt-6 grid auto-cols-fr grid-flow-col divide-x divide-[color-mix(in_srgb,var(--ed-ink)_25%,transparent)] border-y border-[var(--ed-ink)]">
              <span className="py-3 pr-3">
                <span className={cn(caps, "block text-[9.5px] text-[var(--ed-ink-2)]")}>Jour</span>
                <span className={cn(serif, "mt-1 block text-[22px] italic")}>{starts.weekday}</span>
              </span>
              <span className="px-3 py-3">
                <span className={cn(caps, "block text-[9.5px] text-[var(--ed-ink-2)]")}>Heure</span>
                <span className={cn(serif, "mt-1 block whitespace-nowrap text-[22px]")}>{starts.time}</span>
              </span>
              {theme.settings.countdown && event.daysLeft !== null && (
                <span className="py-3 pl-3">
                  <span className={cn(caps, "block text-[9.5px] text-[var(--ed-ink-2)]")}>Décompte</span>
                  <span className={cn(serif, "mt-1 block text-[22px] text-[var(--ed-accent)]")}>{countdownText(event.daysLeft).replace("Dans ", "J-").replace(" jours", "")}</span>
                </span>
              )}
            </div>
          </section>

          {/* ------------------------------------------------- LIEUX -- */}
          {venues.length > 0 && (
            <section className="pc-inview pt-20">
              <Folio kicker="Adresses" n={folio()} />
              <h2 className={cn(styles.heading, "mt-6")}>{venues.length > 1 ? "Les lieux" : "Le lieu"}</h2>
              <ol className="mt-9 space-y-10">
                {venues.map((venue, i) => (
                  <li key={`${venue.label}-${venue.name}`} className="grid grid-cols-[2.6rem_1fr] gap-x-2">
                    <span aria-hidden className={cn(serif, "text-[34px] italic leading-[0.8] text-[var(--ed-accent)]")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className={styles.label}>
                        {venue.label}
                        {venue.time && <span className="text-[var(--ed-ink)]"> · {venue.time}</span>}
                      </p>
                      <p className={cn(serif, "mt-2 text-[28px] leading-[1.05] [overflow-wrap:anywhere]")}>{venue.name}</p>
                      <p className={cn("mt-2.5", styles.muted)}>{venue.address}</p>
                      {venue.landmark && <p className={cn("mt-1 italic", styles.muted)}>{venue.landmark}</p>}
                      <a href={view.preview ? undefined : venue.directionsUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-3 min-h-11", styles.link)}>
                        Itinéraire
                        <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ---------------------------------------------- DEROULE -- */}
          {programs.map((s) => (
            <section key={s.id} className="pc-inview pt-20">
              <Folio kicker="Le déroulé" n={folio()} />
              {s.title && <h2 className={cn(styles.heading, "mt-6 [overflow-wrap:anywhere]")}>{s.title}</h2>}
              <Program section={s} />
            </section>
          ))}
        </div>

        {/* ------------------------------------------ PAGE PHOTOGRAPHIE -- */}
        {photo && (
          <figure className="pc-inview relative mt-20">
            <div className="relative ml-auto aspect-[3/4] w-[84%] overflow-hidden bg-[var(--ed-paper)]">
              <div className="pc-parallax absolute inset-0">
                <Image src={photo} alt="" fill sizes="(max-width: 460px) 84vw, 390px" className="object-cover object-[55%_40%]" />
              </div>
            </div>
            {event.type === "WEDDING" && (
              <blockquote className={cn(serif, "absolute bottom-10 left-0 max-w-[62%] bg-[var(--ed-bg)] py-4 pl-5 pr-5 text-[clamp(28px,8vw,36px)] italic leading-[1.02]")}>
                <span className="text-[var(--ed-accent)]">«</span> Le plus beau des oui. <span className="text-[var(--ed-accent)]">»</span>
              </blockquote>
            )}
            <figcaption className={cn(caps, "mt-3 px-5 text-right text-[9.5px] text-[var(--ed-ink-2)]")}>
              {event.hostParts.join(" & ")} — {starts.year}
            </figcaption>
          </figure>
        )}

        {/* --------------------------------------------------- RSVP -- */}
        <div className="pc-inview mt-20 bg-[var(--ed-paper)] px-5 pb-14 pt-10">
          <RsvpBlock
            view={view}
            rsvpForm={rsvpForm}
            rsvpStyle={rsvpStyle}
            styles={styles}
            button={button}
            align="left"
            title={
              <>
                <Folio kicker="RSVP" n={folio()} />
                <h2 className={cn(styles.heading, "mt-6 text-[clamp(42px,12vw,54px)] italic")}>
                  Répondez, <span className="text-[var(--ed-accent)]">s’il vous plaît</span>
                </h2>
              </>
            }
          />
        </div>

        {/* ----------------------------------------------- PRATIQUE -- */}
        <div className="px-5">
          {infos.map((s) => (
            <section key={s.id} className="pc-inview pt-20">
              <Folio kicker="Pratique" n={folio()} />
              {s.title && <h2 className={cn(styles.heading, "mb-8 mt-6 [overflow-wrap:anywhere]")}>{s.title}</h2>}
              <div className={cn(!s.title && "mt-8")}>
                <SectionBody section={s} styles={styles} align="left" />
              </div>
            </section>
          ))}

          <footer className="mt-24 border-t-2 border-[var(--ed-ink)] pt-4">
            <div className={cn(caps, "grid grid-cols-2 gap-4 text-[9.5px] leading-[1.9] text-[var(--ed-ink-2)]")}>
              <p>
                Colophon
                <br />
                <span className="text-[var(--ed-ink)]">Édité par {event.hostParts.join(" & ")}</span>
              </p>
              <p className="text-right tabular-nums">
                {city ?? KIND[event.type]}
                <br />
                <span className="text-[var(--ed-ink)]">
                  {starts.day}.{starts.iso.slice(5, 7)}.{starts.year}
                </span>
              </p>
            </div>
            <p className={cn(serif, "mt-8 text-[clamp(44px,13vw,60px)] italic leading-none tracking-[-0.02em]")}>Fin.</p>
          </footer>
        </div>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="ed-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--ed-ink)] bg-[var(--ed-bg)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[420px]")}
        />
      )}
    </main>
  );
}

/** Folio : rubrique a gauche, numero de page a droite, filet d encre. */
function Folio({ kicker, n }: { kicker: string; n: string }) {
  return (
    <p className={cn(caps, "flex items-baseline justify-between gap-4 border-t border-[var(--ed-ink)] pt-3 text-[10.5px]")}>
      <span>{kicker}</span>
      <span className="tabular-nums text-[var(--ed-accent)]">p. {n}</span>
    </p>
  );
}

/** Le deroule en tableau : l heure en titrage, le libelle en texte courant. */
function Program({ section }: { section: InvitationSection }) {
  if (section.kind !== "program") return null;
  return (
    <ol className="mt-8 border-b border-[color-mix(in_srgb,var(--ed-ink)_18%,transparent)]">
      {section.data.items.map((item, i) => (
        <li key={i} className="grid grid-cols-[6.2rem_1fr] items-baseline gap-3 border-t border-[color-mix(in_srgb,var(--ed-ink)_18%,transparent)] py-4">
          <span className={cn(serif, "whitespace-nowrap text-[26px] leading-none tabular-nums")}>{item.time.replace(":", " h ")}</span>
          <span className={cn("[overflow-wrap:anywhere]", styles.body)}>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}
