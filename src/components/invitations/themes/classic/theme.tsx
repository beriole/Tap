import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { libreBaskerville } from "../fonts";

/**
 * CLASSIC - la papeterie de toujours.
 *
 * Le parti pris : un faire-part tel qu on l imprime depuis un siecle. La page
 * est bordee d un LISERE - un filet noir a quelques millimetres du bord, qui
 * court sur toute la hauteur - et tout est centre a l interieur : petites
 * capitales, Libre Baskerville, un filet double sous le nom, la date en
 * toutes lettres.
 *
 * Aucune couleur vive : l accent ne teinte que les filets et les petites
 * capitales. Pas de compte a rebours ni d enveloppe animee : c est un
 * hommage. Le bouton est cerne d un filet, en capitales espacees.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  ivoire: { bg: "#F5F1E8", ink: "#1A1A1A", ink2: "#5C5A55", line: "#D9D3C6" },
  gris: { bg: "#E9E7E2", ink: "#1A1A1A", ink2: "#565552", line: "#CFCCC4" },
};

const ACCENTS: Record<string, string> = { noir: "#1A1A1A", sepia: "#5E4B3C", marine: "#2E3A52" };

function palette(variant: string, accent: string): Palette {
  return { ...(VARIANTS[variant] ?? VARIANTS.ivoire!), accent: ACCENTS[accent] ?? ACCENTS.noir! };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Ont l’honneur de vous faire part de leur mariage",
  BIRTHDAY: "Vous prie d’assister à son anniversaire",
  CORPORATE: "Vous prie d’honorer de votre présence",
  MEMORIAL: "Vous prient de vous unir à eux pour honorer la mémoire de",
  OTHER: "Vous prie d’honorer de votre présence",
};

const caps = "text-[11px] font-medium uppercase tracking-[0.26em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center border border-[var(--cl-accent)] px-6 text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cl-accent)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--cl-accent)] hover:text-[var(--cl-bg)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cl-accent)]";

const styles: SectionStyles = {
  heading: cn(caps, "text-[var(--cl-accent)]"),
  body: "text-[16px] leading-relaxed text-[var(--cl-ink)] [font-family:var(--inv-baskerville)]",
  muted: "text-[15px] leading-relaxed text-[var(--cl-ink-2)] [font-family:var(--inv-baskerville)]",
  label: "text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--cl-ink-2)]",
  rule: "divide-[var(--cl-line)] border-[var(--cl-line)]",
  emphasis: "text-[20px] leading-[1.3] [font-family:var(--inv-baskerville)]",
  link: "border-b border-[var(--cl-accent)] text-[11px] font-bold uppercase tracking-[0.18em] transition-colors hover:text-[var(--cl-accent)]",
};

export function Classic({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const quiet = { ...view, envelope: false };

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      mainClassName={cn(libreBaskerville.variable, "bg-[var(--cl-bg)] text-[var(--cl-ink)]")}
      vars={{ "--cl-bg": p.bg, "--cl-ink": p.ink, "--cl-ink-2": p.ink2, "--cl-line": p.line, "--cl-accent": p.accent }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--inv-baskerville)" }}
      styles={styles}
      button={button}
      heroCtaId="cl-hero-cta"
      containerClassName="px-8 pt-[max(24px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--cl-line)] bg-[var(--cl-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      dockLabel="Confirmer ma présence"
      before={<div aria-hidden className="pointer-events-none absolute inset-x-3 inset-y-3 border border-[var(--cl-accent)] sm:inset-x-[max(12px,calc(50%-236px))]" />}
      hero={
        <header className="flex min-h-[calc(100svh-48px)] flex-col items-center justify-center py-10 text-center">
          {event.updatedNote && <p className={cn(caps, "pc-fade mb-6 text-[10px] text-[var(--cl-accent)]")}>{event.updatedNote}</p>}
          {dear && (
            <p className="pc-fade mb-6 text-[15px] italic text-[var(--cl-ink-2)] [font-family:var(--inv-baskerville)]" style={delay(0)}>
              {dear}
            </p>
          )}
          {event.type === "MEMORIAL" ? (
            <p className={cn(caps, "pc-fade max-w-[280px] text-[10px] leading-[2] text-[var(--cl-ink-2)]")} style={delay(80)}>
              {EYEBROW[event.type]}
            </p>
          ) : (
            <>
              <p className="text-[16px] [font-family:var(--inv-baskerville)]">{event.hosts}</p>
              <p className={cn(caps, "pc-fade mt-3 max-w-[280px] text-[10px] leading-[2] text-[var(--cl-ink-2)]")} style={delay(80)}>
                {EYEBROW[event.type]}
              </p>
            </>
          )}
          <h1 className="mt-6 [font-family:var(--inv-baskerville)]">
            <HostNames
              view={view}
              sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(38px,11vw,50px)]", "text-[clamp(32px,9.5vw,42px)]", "text-[clamp(27px,8vw,34px)]", "text-[clamp(24px,7vw,30px)]"])}
              lineClassName="leading-[1.1]"
              separator={<span className="block text-[18px] italic leading-[1.8] text-[var(--cl-ink-2)]">&amp;</span>}
            />
          </h1>
          <span aria-hidden className="mt-6 block w-24 border-y border-[var(--cl-accent)] py-[3px]" />
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <p aria-hidden className="mt-6 text-[17px] leading-relaxed [font-family:var(--inv-baskerville)]">
            le {starts.weekday} {starts.day} {starts.month} {starts.year}
            <br />à {starts.time}
          </p>
          {view.venues[0] && (
            <p aria-hidden className="mt-3 max-w-[300px] text-[15px] italic leading-relaxed text-[var(--cl-ink-2)] [font-family:var(--inv-baskerville)] [overflow-wrap:anywhere]">
              {view.venues[0].name}
            </p>
          )}
          <HeroCta view={quiet} id="cl-hero-cta" button={button} label="Confirmer ma présence" className="mt-9 max-w-[280px]" noteClassName="text-[var(--cl-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mx-auto mb-14 mt-4 w-[72%] border border-[var(--cl-line)] p-2">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--cl-line)] grayscale">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 72vw, 330px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14 text-center">
          {title ? (
            <h2 className={cn(styles.heading, "mb-7 flex items-center justify-center gap-3 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="h-px w-6 bg-[var(--cl-line)]" />
              {title}
              <span aria-hidden className="h-px w-6 bg-[var(--cl-line)]" />
            </h2>
          ) : (
            <div className="mb-7" />
          )}
          {children}
        </section>
      )}
      rsvpWrapperClassName="border-t border-[var(--cl-line)] pt-10"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[12px]")}>Votre présence</h2>}
      footer={
        <footer className="mb-6 mt-20 text-center">
          <span aria-hidden className="mx-auto block w-24 border-y border-[var(--cl-accent)] py-[3px]" />
          <p className="mt-5 text-[15px] italic [font-family:var(--inv-baskerville)]">{event.hosts}</p>
        </footer>
      }
    />
  );
}
