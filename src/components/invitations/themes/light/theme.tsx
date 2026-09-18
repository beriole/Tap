import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, NAME_SCALE, ThemeShell, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";

/**
 * LIGHT - blanc, gris doux, une photographie, un texte minimal.
 *
 * Le parti pris : la photographie ouvre la page en pleine largeur et se
 * FOND dans le blanc par un degrade (aucun bord dur), puis vient le nom en
 * Geist tres leger, la date, et c est tout. Une seule famille, une seule
 * graisse pour les titres (300), du gris pour le reste.
 *
 * Sans photo, la page s ouvre sur un large espace blanc : c est voulu, la
 * lumiere est le sujet. Pas de compte a rebours, pas d enveloppe.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FFFFFF", ink: "#26282C", ink2: "#6E7076", line: "#E9EAEC" },
  nuage: { bg: "#F1F2F4", ink: "#26282C", ink2: "#65676D", line: "#DCDEE2" },
};

const ACCENTS: Record<string, string> = { gris: "#6B6E75", sable: "#8A7A63", ciel: "#5F7A94" };

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

const caps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--li-ink)] px-6 text-[14px] font-medium text-[var(--li-bg)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--li-ink)]";

const styles: SectionStyles = {
  heading: "text-[24px] font-light leading-tight tracking-[-0.01em]",
  body: "text-[16px] leading-relaxed text-[var(--li-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--li-ink-2)]",
  label: cn(caps, "text-[var(--li-accent)]"),
  rule: "divide-[var(--li-line)] border-[var(--li-line)]",
  emphasis: "text-[21px] font-light leading-[1.25]",
  link: "border-b border-[var(--li-ink)] text-[13px] font-medium tracking-[0.04em] transition-colors hover:text-[var(--li-accent)]",
};

export function Light({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const quiet = { ...view, envelope: false };

  return (
    <ThemeShell
      view={quiet}
      rsvpForm={rsvpForm}
      mainClassName="bg-[var(--li-bg)] text-[var(--li-ink)]"
      vars={{ "--li-bg": p.bg, "--li-ink": p.ink, "--li-ink-2": p.ink2, "--li-line": p.line, "--li-accent": p.accent }}
      envelope={{}}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": "#A8342D", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="li-hero-cta"
      containerClassName="px-7"
      dockClassName="bg-[var(--li-bg)]/92 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
      dockLabel="Confirmer ma présence"
      hero={
        <header className="flex min-h-[100svh] flex-col pb-8">
          {event.heroImageUrl ? (
            <div className="relative -mx-7 h-[46svh] overflow-hidden">
              <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="100vw" className="object-cover" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--li-bg)] to-transparent" />
            </div>
          ) : (
            <div aria-hidden className="h-[24svh]" />
          )}
          <div className="flex flex-1 flex-col justify-center py-6 text-center">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[10px] text-[var(--li-accent)]")}>{event.updatedNote}</p>}
            <p className={cn(caps, "pc-fade text-[var(--li-accent)]")} style={delay(80)}>
              {EYEBROW[event.type]}
            </p>
            <h1 className="mt-5 font-light tracking-[-0.02em]">
              <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), NAME_SCALE)} lineClassName="leading-[1.02]" separator={<span className="block text-[18px] leading-[2] text-[var(--li-ink-2)]">&amp;</span>} />
            </h1>
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <p aria-hidden className="mt-6 text-[16px] font-light text-[var(--li-ink-2)]">
              {starts.weekday} {starts.day} {starts.month} {starts.year} · {starts.time}
            </p>
            {dear && (
              <p className="pc-fade mt-5 text-[14px] text-[var(--li-ink-2)]" style={delay(300)}>
                {dear}, nous serions honorés de votre présence.
              </p>
            )}
          </div>
          <HeroCta view={quiet} id="li-hero-cta" button={button} label="Confirmer ma présence" className="mx-auto max-w-[300px]" noteClassName="text-center text-[var(--li-ink-2)]" />
        </header>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14 text-center">
          {title ? <h2 className={cn(styles.heading, "mb-7 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      rsvpWrapperClassName="border-t border-[var(--li-line)] pt-10"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[26px]")}>Votre présence</h2>}
      footer={
        <footer className="mt-20 text-center">
          <p className="text-[15px] font-light">{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-2 text-[10px] text-[var(--li-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
