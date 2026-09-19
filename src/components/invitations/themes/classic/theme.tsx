import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { cormorant } from "../fonts";

/**
 * CLASSIC - la papeterie de toujours, gravee.
 *
 * Le parti pris : le LISERE DE PAGE. Le faire-part se lit a l interieur d un
 * double filet - un trait d accent a quelques millimetres du bord, un filet
 * gris juste dedans - qui court sur toute la hauteur, comme le bord d un
 * carton de deuil. Tout est centre dans ce cadre.
 *
 * Le nom est grave : CAPITALES espacees en Cormorant, graisse moyenne, comme
 * une taille-douce ; la formule d usage en italique au-dessus, la date en
 * toutes lettres au-dessous, entre deux doubles filets. Aucune couleur vive :
 * l accent ne teinte que les filets et les petites capitales. Pas de compte a
 * rebours ni d enveloppe animee : c est un hommage. Le bouton est cerne d un
 * filet, en capitales espacees.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  ivoire: { bg: "#F5F1E8", ink: "#1A1A1A", ink2: "#5C5A55", line: "#D9D3C6" },
  gris: { bg: "#E9E7E2", ink: "#1A1A1A", ink2: "#52514E", line: "#CFCCC4" },
};

const ACCENTS: Record<string, string> = { noir: "#1A1A1A", sepia: "#5E4B3C", marine: "#2E3A52" };

function palette(variant: string, accent: string): Palette {
  return { ...(VARIANTS[variant] ?? VARIANTS.ivoire!), accent: ACCENTS[accent] ?? ACCENTS.noir! };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Faire-part",
  BIRTHDAY: "Invitation",
  CORPORATE: "Invitation",
  MEMORIAL: "In memoriam",
  OTHER: "Invitation",
};

const FORMULA: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "ont l’honneur de vous faire part de leur mariage",
  BIRTHDAY: "vous prie d’assister à son anniversaire",
  CORPORATE: "vous prie d’honorer de votre présence",
  MEMORIAL: "Nous vous prions de vous unir à nous pour honorer la mémoire de",
  OTHER: "vous prie d’honorer de votre présence",
};

const serif = "[font-family:var(--inv-cormorant)]";
const caps = "text-[10.5px] font-medium uppercase tracking-[0.3em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center border border-[var(--cl-accent)] px-6 text-[11.5px] font-semibold uppercase tracking-[0.26em] text-[var(--cl-accent)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--cl-accent)] hover:text-[var(--cl-bg)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cl-accent)]";

const styles: SectionStyles = {
  heading: cn(caps, "text-[11px] text-[var(--cl-accent)]"),
  body: cn(serif, "text-[19px] leading-relaxed text-[var(--cl-ink)]"),
  muted: cn(serif, "text-[17px] leading-relaxed text-[var(--cl-ink-2)]"),
  label: "text-[10.5px] font-medium uppercase tracking-[0.22em] text-[var(--cl-ink-2)]",
  rule: "divide-[var(--cl-line)] border-[var(--cl-line)]",
  emphasis: cn(serif, "text-[23px] font-medium leading-[1.25]"),
  link: "border-b border-[var(--cl-accent)] text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[var(--cl-accent)]",
};

/** Le double filet de la papeterie : deux traits, trois pixels d air. */
function DoubleRule({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("mx-auto block w-20 border-y border-[var(--cl-accent)] py-[1.5px]", className)} style={style} />;
}

export function Classic({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const first = venues[0];
  const memorial = event.type === "MEMORIAL";
  const quiet = { ...view, envelope: false };

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      mainClassName={cn(cormorant.variable, "bg-[var(--cl-bg)] text-[var(--cl-ink)]")}
      vars={{ "--cl-bg": p.bg, "--cl-ink": p.ink, "--cl-ink-2": p.ink2, "--cl-line": p.line, "--cl-accent": p.accent }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--inv-cormorant)" }}
      styles={styles}
      button={button}
      heroCtaId="cl-hero-cta"
      containerClassName="px-9 pt-[max(20px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--cl-line)] bg-[var(--cl-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      dockLabel="Confirmer ma présence"
      venuesTitle={(n) => (n > 1 ? "Les lieux" : "Le lieu")}
      before={
        // Le lisere : un trait d accent, un filet gris juste dedans, sur toute la hauteur.
        <div aria-hidden className="pointer-events-none absolute inset-2.5 border border-[var(--cl-accent)] sm:inset-x-[max(10px,calc(50%-238px))]">
          <span className="absolute inset-[4px] border border-[var(--cl-line)]" />
        </div>
      }
      hero={
        <header className="flex min-h-[calc(100svh-20px)] flex-col items-center justify-center py-10 text-center">
          <p className={cn(caps, "pc-fade text-[var(--cl-accent)]")} style={delay(0)}>
            {KIND[event.type]}
          </p>
          <DoubleRule className="pc-draw mt-4 w-8" style={{ ...delay(120), transformOrigin: "center" }} />
          {event.updatedNote && <p className={cn(caps, "pc-fade mt-5 text-[9.5px] text-[var(--cl-ink-2)]")}>{event.updatedNote}</p>}

          {memorial ? (
            <p className={cn(serif, "pc-fade mt-8 max-w-[270px] text-[18px] italic leading-[1.45] text-[var(--cl-ink-2)] [text-wrap:balance]")} style={delay(160)}>
              {FORMULA[event.type]}
            </p>
          ) : null}

          <h1 className={cn(serif, "pc-rise w-full font-medium uppercase tracking-[0.12em]", memorial ? "mt-6" : "mt-8")} style={delay(240)}>
            <HostNames
              view={view}
              sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(36px,10.6vw,44px)]", "text-[clamp(30px,8.8vw,37px)]", "text-[clamp(24px,7vw,30px)]", "text-[clamp(18px,5.2vw,22px)]"])}
              lineClassName="leading-[1.18]"
              separator={<span className="block text-[20px] normal-case italic leading-[1.7] tracking-normal text-[var(--cl-ink-2)]">&amp;</span>}
            />
          </h1>

          {!memorial && (
            <p className={cn(serif, "pc-fade mt-4 max-w-[270px] text-[18px] italic leading-[1.45] text-[var(--cl-ink-2)] [text-wrap:balance]")} style={delay(320)}>
              {FORMULA[event.type]}
            </p>
          )}

          <DoubleRule className="pc-draw mt-7" style={{ ...delay(420), transformOrigin: "center" }} />
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <p aria-hidden className={cn(serif, "pc-fade mt-6 text-[20px] leading-[1.45]")} style={delay(460)}>
            le {starts.weekday} {starts.day} {starts.month} {starts.year}
            <span className="block">à {starts.time}</span>
          </p>
          {first && (
            <p className={cn(serif, "pc-fade mt-2 max-w-[280px] text-[17px] italic leading-snug text-[var(--cl-ink-2)] [overflow-wrap:anywhere] [text-wrap:balance]")} style={delay(520)}>
              {first.name}
            </p>
          )}
          {dear && (
            <p className={cn(caps, "pc-fade mt-7 max-w-[280px] text-[9.5px] leading-[2] text-[var(--cl-ink-2)]")} style={delay(580)}>
              À l’attention de {dear}
            </p>
          )}
          <HeroCta view={quiet} id="cl-hero-cta" button={button} label="Confirmer ma présence" className="pc-fade mt-7 max-w-[270px]" noteClassName="text-[var(--cl-ink-2)]" />
        </header>
      }
      word={(text) => (
        <section className="pc-inview pb-14 pt-4 text-center">
          <DoubleRule className="w-8" />
          <p className={cn(serif, "mx-auto mt-7 max-w-[19rem] whitespace-pre-line text-[21px] italic leading-[1.5] [text-wrap:pretty]")}>{text}</p>
        </section>
      )}
      photo={
        <figure className="pc-inview mx-auto mb-16 mt-2 w-[70%] text-center">
          {/* Le tirage dans son passe-partout : un filet, du vide, la photo en noir et blanc. */}
          <div className="border border-[var(--cl-line)] p-2.5">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--cl-line)]">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 70vw, 320px" className="object-cover grayscale-[0.9] contrast-[0.95]" />
            </div>
          </div>
          <figcaption className={cn(serif, "mt-4 text-[16px] italic text-[var(--cl-ink-2)] [overflow-wrap:anywhere]")}>{event.hostParts.join(" & ")}</figcaption>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16 text-center">
          {title ? (
            <h2 className={cn(styles.heading, "mb-8 flex items-center justify-center gap-4 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="h-px w-7 shrink-0 bg-[var(--cl-accent)] opacity-50" />
              <span className="min-w-0">{title}</span>
              <span aria-hidden className="h-px w-7 shrink-0 bg-[var(--cl-accent)] opacity-50" />
            </h2>
          ) : (
            <DoubleRule className="mb-8 w-8" />
          )}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pt-2"
      rsvpTitle={
        <>
          <DoubleRule className="w-8" />
          <h2 className={cn(serif, "mt-6 text-[32px] font-medium leading-tight")}>Votre présence</h2>
        </>
      }
      footer={
        <footer className="mb-8 mt-20 text-center">
          <DoubleRule />
          <p className={cn(caps, "mt-6 text-[10px] leading-[2] text-[var(--cl-accent)] [overflow-wrap:anywhere]")}>{event.hosts}</p>
          <p className={cn(serif, "mt-1 text-[16px] italic text-[var(--cl-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
