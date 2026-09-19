import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { EYEBROW_BY_TYPE, HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { cormorant } from "../fonts";

/**
 * PEARL - Modern luxury.
 *
 * Le parti pris : la maitrise de l espace. Une page blanc chaud, une garalde
 * de titrage (Cormorant) composee tres grande et tres serree, fer a gauche,
 * et beaucoup de vide autour. L or n existe qu en details de quelques
 * pixels : un point, un filet de 24 px, une lettrine. Aucun panneau, aucun
 * cadre : les rubriques sont ouvertes, separees par de l air et des filets
 * gris perle.
 *
 * La signature : la PERLE - un disque de lumiere en degrade radial, sans un
 * trait dessine, qui donne au premier ecran sa profondeur et revient derriere
 * la photographie.
 *
 * Le premier ecran est asymetrique et controle : les noms a gauche, la date
 * a droite en bas, et rien d autre. Les phrases viennent apres.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; gold: string; pearl: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line" | "pearl">> = {
  perle: { bg: "#F8F6F2", ink: "#1F2024", ink2: "#63656B", line: "#E4E1DB", pearl: "#FFFFFF" },
  brume: { bg: "#E9E6E0", ink: "#1F2024", ink2: "#5B5D63", line: "#D4D0C8", pearl: "#F8F6F2" },
};

/** [texte d accent 4,5:1 sur les deux fonds, detail dore] */
const ACCENTS: Record<string, [string, string]> = {
  argent: ["#5F6066", "#A8A9AE"],
  rose: ["#7C534E", "#C5978F"],
  bleu: ["#5C6673", "#9AA5B3"],
};

function palette(variant: string, accent: string): Palette {
  const [text, gold] = ACCENTS[accent] ?? ACCENTS.argent!;
  return { ...(VARIANTS[variant] ?? VARIANTS.perle!), accent: text, gold };
}

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous serions heureux de partager avec vous l’un des plus beaux jours de notre histoire.",
  BIRTHDAY: "Nous serions heureux de vous compter parmi nous pour fêter cette journée.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence et vos prières nous accompagnent.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const serif = "[font-family:var(--inv-cormorant)]";
const caps = "text-[10.5px] font-medium uppercase tracking-[0.34em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center bg-[var(--pl-ink)] px-6 text-[12px] font-medium uppercase tracking-[0.24em] text-[var(--pl-bg)] transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pl-ink)]";

const styles: SectionStyles = {
  heading: cn(serif, "text-[34px] font-normal leading-[1.05] tracking-[-0.01em]"),
  body: "text-[16px] leading-relaxed text-[var(--pl-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--pl-ink-2)]",
  label: cn(caps, "text-[var(--pl-accent)]"),
  rule: "divide-[var(--pl-line)] border-[var(--pl-line)]",
  emphasis: cn(serif, "text-[24px] font-medium leading-[1.2]"),
  link: "border-b border-[var(--pl-ink)] pb-0.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors hover:text-[var(--pl-accent)]",
};

/** Le detail d or : un point et un filet de 24 px. */
function GoldMark() {
  return (
    <span aria-hidden className="flex items-center gap-2">
      <span className="size-[5px] rounded-full bg-[var(--pl-gold)]" />
      <span className="h-px w-6 bg-[var(--pl-gold)]" />
    </span>
  );
}

export function Pearl({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      mainClassName={cn(cormorant.variable, "bg-[var(--pl-bg)] text-[var(--pl-ink)]")}
      vars={{ "--pl-bg": p.bg, "--pl-ink": p.ink, "--pl-ink-2": p.ink2, "--pl-line": p.line, "--pl-accent": p.accent, "--pl-gold": p.gold, "--pl-pearl": p.pearl }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#EFECE6", "--env-fold": "#E8E4DD", "--env-flap": "#E2DED6", "--env-edge": "#CFCAC1",
        "--env-card": "#FFFFFF", "--env-card-ink": p.ink, "--env-liner": p.gold, "--env-seal": p.ink, "--env-seal-ink": p.bg, "--env-font": "var(--inv-cormorant)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--inv-cormorant)" }}
      styles={styles}
      button={button}
      heroCtaId="pl-hero-cta"
      containerClassName="px-7 pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--pl-bg)_88%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      sectionAlign="left"
      rsvpAlign="left"
      hero={
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col justify-between py-8">
          {/* La perle : un disque de lumiere, derriere les noms. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 top-[24%] size-[min(84vw,360px)] rounded-full"
            style={{ background: "radial-gradient(circle at 42% 38%, var(--pl-pearl) 0%, color-mix(in srgb, var(--pl-pearl) 55%, transparent) 45%, transparent 72%)" }}
          />

          <div className="relative flex items-start justify-between">
            <GoldMark />
            {dear && (
              <p className={cn(serif, "pc-fade max-w-[60%] text-right text-[17px] italic leading-tight text-[var(--pl-ink-2)]")} style={delay(0)}>
                Pour {dear}
              </p>
            )}
          </div>

          <div className="relative">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[10px] text-[var(--pl-accent)]")}>{event.updatedNote}</p>}
            <p className={cn(caps, "pc-fade text-[var(--pl-accent)]")} style={delay(80)}>
              {EYEBROW_BY_TYPE[event.type]}
            </p>
            <h1 className={cn(serif, "mt-6 font-normal tracking-[-0.03em]")}>
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(64px,19vw,86px)]", "text-[clamp(50px,15vw,68px)]", "text-[clamp(38px,11vw,50px)]", "text-[clamp(30px,8.5vw,38px)]"])}
                lineClassName="leading-[0.9]"
                separator={<span className="my-1 block text-[clamp(30px,8vw,40px)] italic leading-none text-[var(--pl-gold)]">&amp;</span>}
              />
            </h1>
          </div>

          <div className="relative">
            <div className="flex items-end justify-between gap-6 border-t border-[var(--pl-line)] pt-5">
              <p className="sr-only">
                {starts.long}, {starts.time}
              </p>
              <p aria-hidden className={cn(caps, "leading-[2] text-[var(--pl-ink-2)]")}>
                {starts.weekday}
                <br />
                {starts.time}
              </p>
              <p aria-hidden className={cn(serif, "text-right text-[clamp(24px,7vw,30px)] leading-none tracking-[-0.01em]")}>
                {starts.day} {starts.month}
                <span className="mt-1 block text-[13px] tracking-[0.2em] text-[var(--pl-ink-2)]">{starts.year}</span>
              </p>
            </div>
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className={cn(caps, "pc-fade mt-4 text-[10px] text-[var(--pl-gold)]")} style={delay(400)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
            <HeroCta view={view} id="pl-hero-cta" button={button} className="mt-7" noteClassName="text-[var(--pl-ink-2)]" />
          </div>
        </header>
      }
      welcome={WELCOME[event.type]}
      word={(text) => (
        <section className="pc-inview py-16">
          <GoldMark />
          <p className={cn(serif, "mt-7 max-w-[20rem] whitespace-pre-line text-[clamp(23px,6.4vw,28px)] leading-[1.4] tracking-[-0.01em] [text-wrap:pretty]")}>{text}</p>
        </section>
      )}
      photo={
        <figure className="pc-inview relative -mx-7 mb-16">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 size-[240px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--pl-pearl) 0%, transparent 70%)" }}
          />
          <div className="relative ml-7 aspect-[4/5] overflow-hidden bg-[var(--pl-line)]">
            <div className="pc-parallax absolute inset-0">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
          </div>
          <figcaption className={cn(caps, "mt-4 pl-7 text-[9.5px] text-[var(--pl-ink-2)]")}>{event.hostParts.join(" · ")}</figcaption>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16">
          <div className="mb-8 flex items-center gap-4">
            <GoldMark />
            {title && <h2 className={cn(styles.heading, "[overflow-wrap:anywhere]")}>{title}</h2>}
          </div>
          {children}
        </section>
      )}
      rsvpWrapperClassName="pc-inview border-t border-[var(--pl-line)] pt-12"
      rsvpTitle={
        <>
          <GoldMark />
          <h2 className={cn(styles.heading, "mt-6 text-[38px]")}>Votre réponse</h2>
        </>
      }
      footer={
        <footer className="mt-20 flex items-end justify-between border-t border-[var(--pl-line)] pt-5">
          <p className={cn(serif, "text-[22px] leading-none")}>{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "text-[9.5px] text-[var(--pl-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
