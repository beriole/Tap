import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { RsvpBlock, SectionBody, VenueList, countdownText, ctaLabel, monogram, salutation, type SectionStyles } from "../../shared";
import { greatVibes } from "../fonts";
import { royalIvoryDisplay } from "./font";

/**
 * ROYAL IVORY - le faire-part grave, en composition editoriale.
 *
 * Le parti pris : la page EST le papier, et la lecture se deroule comme une
 * papeterie de mariage qu on ouvre feuille apres feuille - le pli, l ouverture,
 * le mot des maries, la photographie pleine largeur, les lieux, le programme,
 * la reponse. Aucune carte, aucun rectangle d application : des sections
 * ouvertes, des filets d un pixel, et beaucoup d air entre elles.
 *
 * Trois signatures :
 *  - le cartouche de date : le quantieme en didone monumentale entre deux
 *    filets verticaux, la semaine et le mois graves en petites capitales ;
 *  - le mot des maries, compose en grand italique, seul sur sa page ;
 *  - la photographie pleine largeur qui derive dans son cadre au defilement
 *    (parallaxe CSS, sans JavaScript ni ecouteur de scroll).
 *
 * L accent (champagne, rose poudre, sauge) SIGNALE - filets, fleurons, heures.
 * Il ne remplit jamais une surface. Le bouton reste a l encre.
 *
 * Mouvement : hors enveloppe, l essentiel du premier ecran - noms, date,
 * bouton - n a aucune entree temporisee ; il est la au premier rendu, meme sur
 * un telephone lent. Sous enveloppe, les entrees attendent l ouverture du pli
 * (data-sealed, voir globals.css et components/invitations/envelope.tsx).
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string };

/** Papier de l enveloppe : un ton sous la page, pour que l objet se detache sans ombre lourde. */
const ENVELOPE: Record<string, { paper: string; fold: string; flap: string; edge: string; card: string; cardInk: string }> = {
  ivoire: { paper: "#EAE0CC", fold: "#E2D6BF", flap: "#DCCDB2", edge: "#C9B797", card: "#FBF7EF", cardInk: "#2B231F" },
  nuit: { paper: "#2C2521", fold: "#26201C", flap: "#383029", edge: "#4A4038", card: "#F3EBDD", cardInk: "#2B231F" },
};

const VARIANTS: Record<string, Omit<Palette, "rule" | "accentText">> = {
  ivoire: { bg: "#F6F0E4", paper: "#EEE5D5", ink: "#2B231F", ink2: "#675B52", line: "#E0D3BE" },
  nuit: { bg: "#1D1916", paper: "#27211D", ink: "#F3EBDD", ink2: "#B7AA97", line: "#3A322C" },
};

/** [filet, texte] par variante : le texte d accent garde 4,5:1 de contraste sur le papier. */
const ACCENTS: Record<string, Record<string, [string, string]>> = {
  champagne: { ivoire: ["#B08D57", "#7A5D33"], nuit: ["#C6A66D", "#D4B784"] },
  poudre: { ivoire: ["#C29792", "#895752"], nuit: ["#D1A6A1", "#DDB5B0"] },
  sauge: { ivoire: ["#95A284", "#55664A"], nuit: ["#A7B596", "#B7C4A6"] },
};

function palette(variant: string, accent: string): Palette {
  const base = VARIANTS[variant] ?? VARIANTS.ivoire!;
  const [rule, accentText] = ACCENTS[accent]?.[variant] ?? ACCENTS.champagne![variant] ?? ACCENTS.champagne!.ivoire!;
  return { ...base, rule, accentText };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Vous êtes invité",
  CORPORATE: "Invitation",
  MEMORIAL: "En mémoire",
  OTHER: "Invitation",
};

/** Le mot d accueil, quand l organisateur n en a pas ecrit un. */
const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous serions heureux de partager avec vous l’un des plus beaux jours de notre histoire.",
  BIRTHDAY: "Nous serions heureux de vous compter parmi nous pour fêter cette journée.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const smallCaps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/** Taille des noms selon leur longueur : un prenom de douze lettres ne doit pas deborder a 360 px. */
function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(56px,17vw,76px)]";
  if (longest <= 12) return "text-[clamp(44px,13vw,60px)]";
  if (longest <= 18) return "text-[clamp(34px,9.5vw,46px)]";
  return "text-[clamp(28px,7.5vw,36px)]";
}

export function RoyalIvory({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, sections, rsvp, theme, preview } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const dear = salutation(view);

  /**
   * Le premier texte libre SANS titre devient le mot des maries, compose en
   * grand : c est la phrase qu on lit avant les informations pratiques. Il ne
   * redescend donc pas dans la liste des rubriques. A defaut, une phrase
   * d accueil selon le type d evenement.
   */
  const wordSection = sections.find((s) => s.kind === "custom" && !s.title);
  const word = wordSection?.kind === "custom" ? wordSection.data.text : null;
  const rest = sections.filter((s) => s !== wordSection);

  const style = {
    "--ri-bg": p.bg,
    "--ri-paper": p.paper,
    "--ri-ink": p.ink,
    "--ri-ink-2": p.ink2,
    "--ri-line": p.line,
    "--ri-rule": p.rule,
    "--ri-accent": p.accentText,
  } as React.CSSProperties;

  const paper = ENVELOPE[theme.settings.variant] ?? ENVELOPE.ivoire!;
  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": paper.paper,
    "--env-fold": paper.fold,
    "--env-flap": paper.flap,
    "--env-edge": paper.edge,
    "--env-card": paper.card,
    "--env-card-ink": paper.cardInk,
    "--env-liner": p.rule,
    // Le sceau porte le monogramme : texte d accent (4,5:1 sur le papier), pas le filet.
    "--env-seal": p.accentText,
    "--env-seal-ink": p.bg,
    "--env-font": "var(--ri-display)",
    // Le nom de l invite, ecrit a la main sur le pli : la seule calligraphie.
    "--env-script": "var(--inv-script)",
  } as React.CSSProperties;

  // Le formulaire reprend la palette de la page.
  const rsvpStyle = {
    "--rsvp-bg": p.bg,
    "--rsvp-ink": p.ink,
    "--rsvp-ink-2": p.ink2,
    "--rsvp-line": p.line,
    "--rsvp-rule": p.rule,
    "--rsvp-accent": p.accentText,
    "--rsvp-error": theme.settings.variant === "nuit" ? "#F0A39C" : "#A8342D",
    "--rsvp-font": "var(--ri-display)",
  } as React.CSSProperties;

  return (
    <main
      style={style}
      className={cn(
        royalIvoryDisplay.variable,
        greatVibes.variable,
        "min-h-dvh overflow-x-clip bg-[var(--ri-bg)] font-[family-name:var(--app-font-sans)] text-[var(--ri-ink)] antialiased [color-scheme:light]",
        theme.settings.variant === "nuit" && "[color-scheme:dark]",
      )}
    >
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={dear ? `Pour ${dear}` : null} monogram={monogram(view)} hosts={event.hosts} />
        </div>
      )}

      {/* break-words : tout texte saisi par l organisateur peut contenir un mot
          interminable. Il ne se coupe qu en dernier recours, sans changer la
          largeur minimale des grilles (contrairement a overflow-wrap:anywhere). */}
      <div data-sealed={view.envelope ? "" : undefined} className="mx-auto w-full max-w-[460px] break-words pb-28">
        <div className="px-6 pt-[max(20px,env(safe-area-inset-top))]">
          {event.updatedNote && (
            <p className={cn(smallCaps, "pc-fade pt-1 text-center text-[10px] text-[var(--ri-accent)]")}>{event.updatedNote}</p>
          )}

          {/* --------------------------------------------- L OUVERTURE -- */}
          <header className="flex min-h-[calc(100svh-40px)] flex-col items-center justify-center py-10 text-center">
            {dear && (
              <p
                className="pc-fade mb-8 text-[clamp(22px,6.8vw,28px)] leading-none text-[var(--ri-accent)] [font-family:var(--inv-script)]"
                style={delay(0)}
              >
                Pour {dear}
              </p>
            )}

            <p className={cn(smallCaps, "pc-fade text-[var(--ri-ink-2)]")} style={delay(80)}>
              {EYEBROW[event.type]}
            </p>

            <h1 className="mt-7 font-normal [font-family:var(--ri-display)] [font-optical-sizing:auto]">
              {event.hostParts.length === 2 ? (
                <>
                  <span className={cn(nameSize(longest), "block leading-[0.92] tracking-[-0.02em] [overflow-wrap:anywhere]")}>
                    {event.hostParts[0]}
                  </span>
                  <span className="pc-fade my-1.5 flex items-center justify-center gap-4" style={delay(260)}>
                    <span aria-hidden className="pc-draw h-px w-12 bg-[var(--ri-rule)]" style={{ ...delay(320), transformOrigin: "right" }} />
                    <span className="text-[30px] italic leading-none text-[var(--ri-accent)]">&amp;</span>
                    <span aria-hidden className="pc-draw h-px w-12 bg-[var(--ri-rule)]" style={delay(320)} />
                  </span>
                  <span className={cn(nameSize(longest), "block leading-[0.92] tracking-[-0.02em] [overflow-wrap:anywhere]")}>
                    {event.hostParts[1]}
                  </span>
                </>
              ) : (
                <span className={cn(nameSize(longest), "block leading-[1] tracking-[-0.02em] [overflow-wrap:anywhere] [text-wrap:balance]")}>
                  {event.hostParts[0]}
                </span>
              )}
            </h1>

            <DateCartouche view={view} />

            {theme.settings.countdown && event.daysLeft !== null && (
              <p className="pc-fade mt-4 text-[15px] italic text-[var(--ri-ink-2)] [font-family:var(--ri-display)]" style={delay(560)}>
                {countdownText(event.daysLeft)}
              </p>
            )}

            <div id="ri-hero-cta" data-hero-cta className="mt-9 w-full max-w-[320px]">
              <a href="#rsvp" className={button}>
                {ctaLabel(view)}
              </a>
              {rsvp.deadline && !rsvp.closed && (
                <p className="mt-3 text-[12.5px] text-[var(--ri-ink-2)]">
                  Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
                </p>
              )}
            </div>

            {/* Le filet d appel : il dit qu il y a une suite, sans l ecrire. */}
            <span aria-hidden className="mt-10 block h-10 w-px overflow-hidden bg-[var(--ri-line)]">
              <span className="pc-cue block h-full w-full bg-[var(--ri-rule)]" />
            </span>
          </header>
        </div>

        {/* ---------------------------------------------------- LE MOT -- */}
        <section className="pc-inview px-8 pb-20 pt-4 text-center">
          <Fleuron />
          <p className="mx-auto mt-8 max-w-[19rem] whitespace-pre-line text-[clamp(20px,5.6vw,24px)] italic leading-[1.55] tracking-[-0.01em] [font-family:var(--ri-display)] [text-wrap:pretty]">
            {word ?? WELCOME[event.type]}
          </p>
          {!word && event.hostParts.length === 2 && (
            <p className={cn(smallCaps, "mt-8 text-[10px] text-[var(--ri-ink-2)]")}>{event.hosts}</p>
          )}
        </section>

        {/* -------------------------------------------------- LA PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview mb-20">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--ri-paper)]">
              {/* La derive se fait sur un calque a part : l image garde son
                  object-fit, et le cadre reste net. */}
              <div className="pc-parallax absolute inset-0">
                <Image
                  src={event.heroImageUrl}
                  alt={event.hosts}
                  fill
                  sizes="(max-width: 460px) 100vw, 460px"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className={cn(smallCaps, "mt-4 px-6 text-center text-[10px] text-[var(--ri-ink-2)]")}>
              {event.hostParts.join(" · ")}
            </figcaption>
          </figure>
        )}

        <div className="px-6">
          {/* ---------------------------------------------- LES LIEUX -- */}
          {venues.length > 0 && (
            <Section title={venues.length > 1 ? "Les lieux" : "Le lieu"}>
              <VenueList venues={venues} styles={styles} preview={preview} />
            </Section>
          )}

          {rest.map((section) => (
            <Section key={section.id} title={section.title}>
              <SectionBody section={section} styles={styles} />
            </Section>
          ))}

          {/* ------------------------------------------------- REPONSE -- */}
          <div className="pt-4">
            <RsvpBlock
              view={view}
              rsvpForm={rsvpForm}
              rsvpStyle={rsvpStyle}
              styles={styles}
              button={button}
              title={
                <>
                  <Fleuron />
                  <h2 className={cn(styles.heading, "mt-5")}>Votre réponse</h2>
                </>
              }
            />
          </div>

          <footer className="mt-24 text-center">
            <p className="text-[26px] leading-none [font-family:var(--ri-display)]">
              {event.hostParts.length === 2 ? (
                <>
                  {event.hostParts[0]!.charAt(0)}
                  <span className="mx-1.5 italic text-[var(--ri-accent)]">&amp;</span>
                  {event.hostParts[1]!.charAt(0)}
                </>
              ) : (
                event.hostParts[0]
              )}
            </p>
            <p className={cn(smallCaps, "mt-3 text-[10px] text-[var(--ri-ink-2)]")}>
              {event.starts.day} {event.starts.month} {event.starts.year}
            </p>
          </footer>
        </div>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="ri-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--ri-line)] bg-[var(--ri-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--ri-ink)] px-6 text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ri-bg)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ri-rule)]";

const styles: SectionStyles = {
  heading: "text-[32px] italic leading-tight [font-family:var(--ri-display)]",
  body: "text-[16px] leading-relaxed text-[var(--ri-ink-2)]",
  muted: "text-[15px] leading-relaxed text-[var(--ri-ink-2)]",
  label: cn(smallCaps, "text-[var(--ri-accent)]"),
  rule: "divide-[var(--ri-line)] border-[var(--ri-line)]",
  emphasis: "text-[23px] leading-[1.15] [font-family:var(--ri-display)]",
  link: "border-b border-[var(--ri-rule)] text-[13px] font-medium uppercase tracking-[0.16em] transition-colors hover:text-[var(--ri-accent)]",
};

/** Une rubrique : un fleuron, un titre grave, du contenu. Jamais un cadre. */
function Section({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <section className="pc-inview mb-20">
      {title ? (
        <header className="mb-10 text-center">
          <Fleuron />
          <h2 className={cn(styles.heading, "mt-5 [overflow-wrap:anywhere]")}>{title}</h2>
        </header>
      ) : (
        <div className="mb-10 flex justify-center">
          <Fleuron />
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Le cartouche : SAMEDI | 12 | DECEMBRE 2026.
 * Le jour en chiffres de titrage, les deux cotes en capitales gravees.
 */
function DateCartouche({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  return (
    <div className="mt-11 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span className={cn(smallCaps, "text-right text-[var(--ri-ink-2)]")}>{starts.weekday}</span>
        <span className="mx-5 border-x border-[var(--ri-rule)] px-5 text-[clamp(64px,19vw,88px)] leading-[0.9] tabular-nums [font-family:var(--ri-display)] [font-variant-numeric:lining-nums]">
          {starts.day}
        </span>
        <span className={cn(smallCaps, "text-left leading-[1.9] text-[var(--ri-ink-2)]")}>
          {starts.month}
          <br />
          {starts.year}
        </span>
      </div>
      <p aria-hidden className="pc-fade mt-4 text-[15px] italic text-[var(--ri-accent)] [font-family:var(--ri-display)]" style={delay(520)}>
        {starts.time.replace(" h 00", " heures")}
      </p>
    </div>
  );
}

function Fleuron() {
  return (
    <span aria-hidden className="flex items-center justify-center gap-3">
      <span className="h-px w-7 bg-[var(--ri-rule)]" />
      <span className="size-[5px] rotate-45 bg-[var(--ri-rule)]" />
      <span className="h-px w-7 bg-[var(--ri-rule)]" />
    </span>
  );
}
