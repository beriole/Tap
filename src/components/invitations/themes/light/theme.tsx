import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";

/**
 * LIGHT - blanc, gris doux, une photographie qui se fond dans la lumiere.
 *
 * Le parti pris : la PHOTOGRAPHIE FONDUE DANS LE BLANC. Elle ouvre la page
 * en pleine largeur, legerement desaturee, et se dissout vers le bas dans un
 * degrade long - aucun bord dur : le souvenir s efface dans la lumiere, et
 * le nom apparait la ou l image s acheve. Sans photo, la page s ouvre sur un
 * voile de lumiere grise : c est voulu, la lumiere est le sujet.
 *
 * Une seule famille (Geist) en graisse 300 pour le nom, tres grand, fer a
 * gauche - la composition la plus moderne des trois themes Memorial, la ou
 * Serenity centre un medaillon et Classic grave dans un lisere. Les rubriques
 * sont ouvertes par un filet pleine largeur et un titre leger ; rien
 * d autre. Pas de compte a rebours, pas d enveloppe.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; mist: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line" | "mist">> = {
  blanc: { bg: "#FFFFFF", ink: "#23252A", ink2: "#65676D", line: "#E6E7EA", mist: "#E9EBEF" },
  nuage: { bg: "#F1F2F4", ink: "#23252A", ink2: "#5E6066", line: "#DADCE0", mist: "#DDE0E6" },
};

/** Accents assombris pour tenir 4,5:1 sur le blanc comme sur le nuage. */
const ACCENTS: Record<string, string> = { gris: "#62656C", sable: "#76664F", ciel: "#526C85" };

function palette(variant: string, accent: string): Palette {
  return { ...(VARIANTS[variant] ?? VARIANTS.blanc!), accent: ACCENTS[accent] ?? ACCENTS.gris! };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Un moment ensemble",
  CORPORATE: "Invitation",
  MEMORIAL: "À la mémoire de",
  OTHER: "Un moment ensemble",
};

const caps = "text-[10.5px] font-medium uppercase tracking-[0.28em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--li-ink)] px-6 text-[14px] font-medium tracking-[0.01em] text-[var(--li-bg)] transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--li-ink)]";

const styles: SectionStyles = {
  heading: "text-[28px] font-light leading-[1.1] tracking-[-0.025em]",
  body: "text-[16px] font-light leading-[1.7] text-[var(--li-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--li-ink-2)]",
  label: cn(caps, "text-[var(--li-accent)]"),
  rule: "divide-[var(--li-line)] border-[var(--li-line)]",
  emphasis: "text-[21px] font-light leading-[1.25] tracking-[-0.01em]",
  link: "border-b border-[var(--li-ink)] text-[13px] font-medium tracking-[0.02em] transition-colors hover:text-[var(--li-accent)]",
};

export function Light({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const first = venues[0];
  const quiet = { ...view, envelope: false };

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      mainClassName="bg-[var(--li-bg)] text-[var(--li-ink)]"
      vars={{ "--li-bg": p.bg, "--li-ink": p.ink, "--li-ink-2": p.ink2, "--li-line": p.line, "--li-accent": p.accent, "--li-mist": p.mist }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="li-hero-cta"
      containerClassName="px-7"
      dockClassName="bg-[color-mix(in_srgb,var(--li-bg)_88%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      dockLabel="Confirmer ma présence"
      sectionAlign="left"
      rsvpAlign="left"
      venuesTitle={(n) => (n > 1 ? "Où nous retrouver" : "Le lieu")}
      hero={
        <header className="flex min-h-[100svh] flex-col pb-7">
          {event.heroImageUrl ? (
            <div className="relative -mx-7 h-[44svh] shrink-0 overflow-hidden">
              <div className="pc-fade absolute inset-0" style={delay(0)}>
                <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="(max-width: 460px) 100vw, 460px" className="pc-settle object-cover saturate-[0.55]" />
              </div>
              {/* La photo se dissout dans la lumiere : un degrade long, puis le blanc plein. */}
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--li-bg) 18%, transparent) 0%, transparent 22%, color-mix(in srgb, var(--li-bg) 55%, transparent) 62%, var(--li-bg) 96%)" }} />
            </div>
          ) : (
            // Sans photo : un voile de lumiere, puis le blanc.
            <div aria-hidden className="relative -mx-7 h-[20svh] shrink-0" style={{ background: "radial-gradient(80% 100% at 30% 0%, var(--li-mist) 0%, transparent 70%)" }} />
          )}

          <div className="relative -mt-6 flex flex-1 flex-col justify-center py-4">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-4 text-[10px] text-[var(--li-accent)]")}>{event.updatedNote}</p>}
            <p className={cn(caps, "pc-fade flex items-center gap-3 text-[var(--li-accent)]")} style={delay(120)}>
              <span aria-hidden className="h-px w-6 bg-current" />
              {EYEBROW[event.type]}
            </p>
            <h1 className="pc-rise mt-5 font-extralight tracking-[-0.045em]" style={delay(220)}>
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(54px,16vw,70px)]", "text-[clamp(44px,13vw,58px)]", "text-[clamp(34px,10vw,44px)]", "text-[clamp(27px,7.6vw,34px)]"])}
                lineClassName="leading-[0.98]"
                separator={<span className="block py-1 text-[18px] font-light leading-[1.6] tracking-normal text-[var(--li-ink-2)]">&amp;</span>}
              />
            </h1>
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <div aria-hidden className="pc-fade mt-7 border-t border-[var(--li-line)] pt-5 text-[16px] font-light leading-[1.55]" style={delay(380)}>
              <p className="first-letter:uppercase">
                {starts.weekday} {starts.day} {starts.month} {starts.year} · {starts.time}
              </p>
              {first && <p className="text-[var(--li-ink-2)] [overflow-wrap:anywhere]">{first.name}</p>}
            </div>
            {dear && (
              <p className="pc-fade mt-5 text-[14px] leading-relaxed text-[var(--li-ink-2)]" style={delay(460)}>
                {dear}, nous serions honorés de votre présence.
              </p>
            )}
          </div>
          <HeroCta view={quiet} id="li-hero-cta" button={button} label="Confirmer ma présence" className="pc-fade pt-5" noteClassName="text-[var(--li-ink-2)]" />
        </header>
      }
      word={(text) => (
        <section className="pc-inview pb-16 pt-8">
          <span aria-hidden className="block h-px w-10 bg-[var(--li-accent)]" />
          <p className="mt-7 whitespace-pre-line text-[clamp(21px,5.9vw,24px)] font-light leading-[1.45] tracking-[-0.015em] [text-wrap:pretty]">{text}</p>
        </section>
      )}
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16 border-t border-[var(--li-line)] pt-8">
          {title ? <h2 className={cn(styles.heading, "mb-7 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      rsvpWrapperClassName="border-t border-[var(--li-ink)] pt-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[32px] leading-[1.1]")}>Votre présence</h2>}
      footer={
        <footer className="mt-24 flex items-end justify-between gap-6 border-t border-[var(--li-line)] pt-5">
          <p className="min-w-0 text-[18px] font-light leading-tight tracking-[-0.01em] [overflow-wrap:anywhere]">{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "shrink-0 text-[10px] text-[var(--li-ink-2)]")}>
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </p>
        </footer>
      }
    />
  );
}
