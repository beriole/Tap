import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationSection, InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { HeroCta, RsvpBlock, SectionBody, countdownText, delay, monogram, salutation, type SectionStyles } from "../../shared";
import { cityOf } from "../../stationery";
import { Anemone, Bouquet, Branch, Fern, Sprig, Wreath } from "./flora";
import { botanicalDisplay } from "./font";

/**
 * BOTANICAL CONTEMPORARY - un herbier au trait.
 *
 * Le parti pris : un carnet de botaniste plutot qu un faire-part champetre.
 * Aucune carte, aucun cadre a ombre : du papier, une serif molle en graisse
 * legere (Fraunces, axe SOFT), et des planches dessinees au trait fin -
 * saule, eucalyptus, fougere, anemone - calculees en SVG (flora.tsx).
 *
 * Trois signatures :
 *  - LA FEUILLE : photo et encart de reponse ont la forme d une feuille (deux
 *    angles opposes tres arrondis, deux angles vifs) ;
 *  - LA TIGE : un trait vertical court le long de la page ; chaque rubrique y
 *    pousse comme un rameau, et le programme s y accroche en bourgeons ;
 *  - LA COURONNE : le quantieme de la date pose au creux d une couronne ouverte.
 *
 * Premier ecran asymetrique : la branche se dessine a gauche et deborde sur
 * la photo, les noms s alignent a gauche, la date se lit comme une phrase
 * ("se marient le samedi 12 decembre").
 *
 * Parcours : ouverture -> mot des maries -> date -> lieux -> programme ->
 * photographie -> reponse -> informations pratiques.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string; onAccent: string; leaf: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "paper" | "ink" | "ink2" | "line">> = {
  creme: { bg: "#F5F2E9", paper: "#EAE6D8", ink: "#232A24", ink2: "#566052", line: "#DCD7C6" },
  mousse: { bg: "#1C2620", paper: "#25322A", ink: "#EFEDE3", ink2: "#B4BCAD", line: "#35443A" },
};

/** [aplat du bouton, texte d accent, texte sur bouton, trait des dessins] - chaque texte >= 4,5:1. */
const ACCENTS: Record<string, { creme: [string, string, string, string]; mousse: [string, string, string, string] }> = {
  olive: { creme: ["#55653A", "#4A5832", "#FFFFFF", "#7D8D5B"], mousse: ["#A7B882", "#B9C79A", "#1C2620", "#93A472"] },
  terracotta: { creme: ["#9A4F35", "#86432D", "#FFFFFF", "#B57A62"], mousse: ["#D9937A", "#E3A68F", "#1C2620", "#C98A72"] },
  lavande: { creme: ["#655A88", "#564B78", "#FFFFFF", "#9083B3"], mousse: ["#B3A7D3", "#C5BADF", "#1C2620", "#A497C4"] },
};

function palette(variant: string, accent: string): Palette & { dark: boolean } {
  const v = (VARIANTS[variant] ? variant : "creme") as "creme" | "mousse";
  const [rule, accentText, onAccent, leaf] = (ACCENTS[accent] ?? ACCENTS.olive!)[v];
  return { ...VARIANTS[v]!, rule, accentText, onAccent, leaf, dark: v === "mousse" };
}

/** Le verbe qui relie les noms a la date : la date se lit comme une phrase. */
function verb(view: InvitationView): string {
  switch (view.event.type) {
    case "WEDDING":
      return view.event.hostParts.length > 1 ? "se marient le" : "se marie le";
    case "MEMORIAL":
      return "Hommage, le";
    default:
      return "vous invite le";
  }
}

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Il y a des jours qui poussent lentement, comme un jardin. Celui-ci, nous voulons le vivre entourés de ceux qui nous sont chers.",
  BIRTHDAY: "Une année de plus, et l’envie de la fêter avec vous, simplement.",
  CORPORATE: "Nous serions heureux de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const display = "[font-family:var(--bt-display)] [font-variation-settings:'SOFT'_100]";
const caps = "text-[11px] font-semibold uppercase tracking-[0.22em]";

/** Noms en graisse legere : plus courts, plus grands. */
function nameSize(longest: number): string {
  if (longest <= 7) return "text-[clamp(54px,16vw,72px)]";
  if (longest <= 10) return "text-[clamp(44px,13vw,58px)]";
  if (longest <= 15) return "text-[clamp(34px,10vw,46px)]";
  if (longest <= 22) return "text-[clamp(28px,8vw,36px)]";
  return "text-[clamp(25px,7vw,32px)]";
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--bt-rule)] px-6 text-[15px] font-medium text-[var(--bt-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--bt-rule)]";

const styles: SectionStyles = {
  heading: cn(display, "text-[30px] font-light italic leading-[1.1]"),
  body: "text-[16px] leading-relaxed text-[var(--bt-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--bt-ink-2)]",
  label: cn(caps, "text-[var(--bt-accent)]"),
  rule: "divide-[var(--bt-line)] border-[var(--bt-line)]",
  emphasis: cn(display, "text-[22px] leading-[1.2]"),
  link: "inline-flex items-center gap-1.5 underline decoration-[var(--bt-rule)] decoration-1 underline-offset-[6px] text-[13px] font-medium text-[var(--bt-accent)] transition-opacity hover:opacity-70",
};

/** Le trait se dessine a l ouverture ; il attend sous le pli (voir globals.css). */
const DRAW_CSS =
  ".bt-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:bt-draw 1.8s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*45ms + 150ms)}@keyframes bt-draw{to{stroke-dashoffset:0}}[data-sealed] .bt-draw{animation-play-state:paused}";

export function Botanical({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const city = cityOf(view);
  const longest = Math.max(...event.hostParts.map((h) => h.length));

  // Le premier texte libre sans titre devient le mot des maries ; les
  // programmes suivent les lieux ; tout le reste part dans les informations.
  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : WELCOME[event.type];
  const programs = sections.filter((s) => s.kind === "program");
  const infos = sections.filter((s) => s !== wordSection && s.kind !== "program");

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
    "--env-paper": p.dark ? "#2B382F" : "#E6E0CE",
    "--env-fold": p.dark ? "#25322A" : "#DED7C2",
    "--env-flap": p.dark ? "#334237" : "#D7CFB7",
    "--env-edge": p.dark ? "#475848" : "#C4BA9E",
    "--env-card": "#FBF9F2",
    "--env-card-ink": "#232A24",
    "--env-liner": p.leaf,
    "--env-seal": p.rule,
    "--env-seal-ink": p.onAccent,
    "--env-font": "var(--bt-display)",
  } as React.CSSProperties;

  const rsvpStyle = {
    "--rsvp-bg": p.paper,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.dark ? "#3E4E43" : "#D2CCB8",
    "--rsvp-rule": p.rule,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": p.dark ? "#F0A39C" : "#A8342D",
    "--rsvp-font": "var(--bt-display)",
  } as React.CSSProperties;

  return (
    <main
      style={style}
      className={cn(
        botanicalDisplay.variable,
        "relative min-h-dvh overflow-x-clip bg-[var(--bt-bg)] font-[family-name:var(--app-font-sans)] text-[var(--bt-ink)] antialiased",
        p.dark ? "[color-scheme:dark]" : "[color-scheme:light]",
      )}
    >
      <style>{DRAW_CSS}</style>
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={monogram(view)} hosts={event.hosts} />
        </div>
      )}

      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        {/* ------------------------------------------------ OUVERTURE -- */}
        <header className="flex min-h-[100svh] flex-col px-5 pb-6 pt-[max(18px,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-5">
            {dear ? (
              <p className={cn(display, "pc-fade max-w-[78%] text-[16px] italic leading-snug text-[var(--bt-ink-2)] [text-wrap:balance]")} style={delay(0)}>
                <span className="sr-only">Invitation </span>Pour {dear}
              </p>
            ) : (
              <span />
            )}
            <p aria-hidden className={cn(display, "shrink-0 text-[15px] italic leading-snug text-[var(--bt-accent)]")}>
              {monogram(view)}
            </p>
          </div>
          {event.updatedNote && <p className={cn(caps, "pc-fade mt-2 text-[10px] text-[var(--bt-accent)]")}>{event.updatedNote}</p>}

          {/* La branche pousse a gauche et deborde sur la feuille-photo. */}
          <div className="relative mt-4 flex justify-end">
            <Branch draw className="pointer-events-none absolute -bottom-6 left-[-6px] z-10 h-[116%] w-auto text-[var(--bt-leaf)]" />
            <div className="pc-fade relative h-[clamp(170px,31svh,330px)] w-[68%] overflow-hidden rounded-bl-[10px] rounded-br-[96px] rounded-tl-[96px] rounded-tr-[10px] bg-[var(--bt-paper)]" style={delay(60)}>
              {event.heroImageUrl ? (
                <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="(max-width: 460px) 68vw, 310px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Anemone className="h-[78%] w-auto text-[var(--bt-leaf)]" />
                </div>
              )}
            </div>
          </div>

          <h1 className={cn(display, "mt-7 font-light tracking-[-0.025em]")}>
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn(nameSize(longest), "block leading-[0.95] [overflow-wrap:anywhere]")}>{event.hostParts[0]}</span>
                <span className={cn(nameSize(longest), "block pl-[0.7em] leading-[1] [overflow-wrap:anywhere]")}>
                  <span className="mr-[0.22em] italic text-[var(--bt-accent)]">&amp;</span>
                  {event.hostParts[1]}
                </span>
              </>
            ) : (
              <span className={cn(nameSize(longest), "block leading-[1] [overflow-wrap:anywhere] [text-wrap:balance]")}>{event.hostParts[0]}</span>
            )}
          </h1>

          <p className={cn(display, "mt-4 text-[clamp(19px,5.4vw,22px)] leading-snug")}>
            <span className="italic text-[var(--bt-ink-2)]">{verb(view)} </span>
            {starts.weekday} {starts.day} {starts.month} {starts.year}
          </p>
          <p className={cn(caps, "mt-2 text-[var(--bt-ink-2)]")}>
            {starts.time}
            {city && <span> · {city}</span>}
            {theme.settings.countdown && event.daysLeft !== null && <span className="text-[var(--bt-accent)]"> · {countdownText(event.daysLeft)}</span>}
          </p>

          <div className="min-h-6 flex-1" />
          <HeroCta view={view} id="bt-hero-cta" button={button} className="max-w-[360px]" noteClassName="pl-1 text-[var(--bt-ink-2)]" />
        </header>

        {/* ---------------------------------------------------- LE MOT -- */}
        <section className="pc-inview px-5 pb-16 pt-14">
          <Anemone className="ml-auto mr-1 h-[150px] w-auto text-[var(--bt-leaf)]" />
          <p className={cn(display, "-mt-12 max-w-[18.5rem] whitespace-pre-line text-[clamp(22px,6vw,26px)] font-light italic leading-[1.45] [text-wrap:pretty]")}>{word}</p>
          {event.type === "WEDDING" && <p className={cn(caps, "mt-6 text-[var(--bt-ink-2)]")}>— {event.hostParts.join(" & ")}</p>}
        </section>

        {/* ------------------------------------------ LA TIGE : jour, lieux, programme -- */}
        <StemColumn>
          <Rubric label="Réservez la date" title="Le jour">
            <div className="relative mx-auto w-[min(250px,100%)]">
              <Wreath className="w-full text-[var(--bt-leaf)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-3 text-center">
                <p className="sr-only">
                  {starts.long}, {starts.time}
                </p>
                <p aria-hidden className={cn(display, "text-[76px] font-light leading-[0.9] tabular-nums")}>{starts.day}</p>
                <p aria-hidden className={cn(display, "mt-1 text-[20px] italic")}>
                  {starts.month} {starts.year}
                </p>
              </div>
            </div>
            <p aria-hidden className={cn(caps, "mt-5 text-center text-[var(--bt-ink-2)]")}>
              {starts.weekday} · {starts.time}
            </p>
            {theme.settings.countdown && event.daysLeft !== null && <p className={cn(display, "mt-2 text-center text-[17px] italic text-[var(--bt-accent)]")}>{countdownText(event.daysLeft)}</p>}
          </Rubric>

          {venues.length > 0 && (
            <Rubric label={venues.length > 1 ? `${venues.length} adresses` : "L’adresse"} title={venues.length > 1 ? "Les lieux" : "Le lieu"}>
              <ul className="space-y-10">
                {venues.map((venue) => (
                  <li key={`${venue.label}-${venue.name}`} className="relative">
                    <Bud />
                    <p className={styles.label}>
                      {venue.label}
                      {venue.time && <span className="font-medium tracking-[0.12em] text-[var(--bt-ink-2)]"> · {venue.time}</span>}
                    </p>
                    <p className={cn(display, "mt-2 text-[24px] leading-[1.15] [overflow-wrap:anywhere]")}>{venue.name}</p>
                    <p className={cn("mt-2", styles.muted)}>{venue.address}</p>
                    {venue.landmark && <p className={cn("mt-1 italic", styles.muted)}>{venue.landmark}</p>}
                    <a href={view.preview ? undefined : venue.directionsUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-4 min-h-11", styles.link)}>
                      Itinéraire
                      <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.5} />
                    </a>
                  </li>
                ))}
              </ul>
            </Rubric>
          )}

          {programs.map((s) => (
            <Rubric key={s.id} label="Au fil de la journée" title={s.title}>
              <Program section={s} />
            </Rubric>
          ))}
        </StemColumn>

        {/* ---------------------------------------------- PHOTOGRAPHIE -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview relative mb-20 px-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-bl-[12px] rounded-br-[140px] rounded-tl-[140px] rounded-tr-[12px] bg-[var(--bt-paper)]">
              <div className="pc-parallax absolute inset-0">
                <Image src={event.heroImageUrl} alt="" fill sizes="(max-width: 460px) 92vw, 420px" className="object-cover object-[50%_30%]" />
              </div>
            </div>
            <Fern className="pointer-events-none absolute -top-20 right-0 h-[270px] w-auto text-[var(--bt-leaf)]" />
            <figcaption className={cn(display, "mt-4 text-right text-[16px] italic text-[var(--bt-ink-2)]")}>
              {event.hostParts.join(" & ")}, {starts.year}
            </figcaption>
          </figure>
        )}

        {/* --------------------------------------------------- REPONSE -- */}
        <div className="pc-inview mx-3 rounded-bl-[14px] rounded-br-[72px] rounded-tl-[72px] rounded-tr-[14px] bg-[var(--bt-paper)] px-6 pb-12 pt-11">
          <RsvpBlock
            view={view}
            rsvpForm={rsvpForm}
            rsvpStyle={rsvpStyle}
            styles={styles}
            button={button}
            align="left"
            title={
              <>
                <Sprig className="h-8 w-auto text-[var(--bt-leaf)]" />
                <h2 className={cn(styles.heading, "mt-3 text-[36px]")}>Votre réponse</h2>
              </>
            }
          />
        </div>

        {/* ------------------------------------ INFORMATIONS PRATIQUES -- */}
        {infos.length > 0 && (
          <div className="mt-20">
            <StemColumn>
              {infos.map((s, i) => (
                <Rubric key={s.id} label={i === 0 ? "À savoir" : undefined} title={s.title}>
                  <SectionBody section={s} styles={styles} align="left" />
                </Rubric>
              ))}
            </StemColumn>
          </div>
        )}

        <footer className="mt-20 px-5 text-center">
          <Bouquet className="mx-auto h-[92px] w-auto text-[var(--bt-leaf)]" />
          <p className={cn(display, "mt-4 text-[24px] font-light italic")}>{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-2 text-[10.5px] text-[var(--bt-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="bt-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="bg-[color-mix(in_srgb,var(--bt-bg)_92%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

/** La tige : un trait vertical, les rubriques y poussent en rameaux. */
function StemColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-5 pl-10">
      <span aria-hidden className="absolute bottom-10 left-[11px] top-2 w-px bg-[color-mix(in_srgb,var(--bt-leaf)_55%,transparent)]" />
      {children}
    </div>
  );
}

function Rubric({ label, title, children }: { label?: string; title: string | null; children: React.ReactNode }) {
  return (
    <section className="pc-inview relative pb-20">
      <Sprig className="absolute -left-[31px] top-[-6px] h-7 w-auto text-[var(--bt-leaf)]" />
      {label && <p className={cn(styles.label, "text-[10.5px]")}>{label}</p>}
      {title && <h2 className={cn(styles.heading, "mt-1.5 [overflow-wrap:anywhere]")}>{title}</h2>}
      <div className={cn(title || label ? "mt-8" : "mt-10")}>{children}</div>
    </section>
  );
}

/** Un bourgeon pose sur la tige, a hauteur de la ligne. */
function Bud() {
  return <span aria-hidden className="absolute -left-[34px] top-[3px] size-[10px] rounded-full border border-[var(--bt-leaf)] bg-[var(--bt-bg)]" />;
}

/** Le programme s accroche a la tige : un bourgeon par heure. */
function Program({ section }: { section: InvitationSection }) {
  if (section.kind !== "program") return null;
  return (
    <ol className="space-y-7">
      {section.data.items.map((item, i) => (
        <li key={i} className="relative">
          <Bud />
          <p className={cn(display, "whitespace-nowrap text-[21px] leading-none tabular-nums text-[var(--bt-accent)]")}>{item.time.replace(":", " h ")}</p>
          <p className={cn("mt-1.5 [overflow-wrap:anywhere]", styles.body)}>{item.label}</p>
        </li>
      ))}
    </ol>
  );
}
