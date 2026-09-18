import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { EYEBROW_BY_TYPE, HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";

/**
 * MINIMAL - typographie et photo, presque aucune decoration.
 *
 * Le parti pris : une seule famille (Geist, deja chargee), deux graisses, un
 * fond blanc ou noir, des filets d un pixel. La composition tient par la
 * PHOTO CARREE qui ouvre la page quand elle existe, et par les noms en
 * tres grand, serres, alignes a gauche. La date est une ligne. Le bouton est
 * un rectangle plein, sans arrondi.
 *
 * C est le theme de base de la collection Anniversaire (offre Essentiel) :
 * il doit etre irreprochable sans photo comme avec.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FFFFFF", ink: "#101010", ink2: "#5F5F5F", line: "#E6E6E6" },
  noir: { bg: "#101010", ink: "#F5F5F5", ink2: "#A5A5A5", line: "#2A2A2A" },
};

/** [aplat du bouton, texte sur aplat] par variante */
const ACCENTS: Record<string, { blanc: [string, string]; noir: [string, string] }> = {
  encre: { blanc: ["#101010", "#FFFFFF"], noir: ["#F5F5F5", "#101010"] },
  brique: { blanc: ["#A8462C", "#FFFFFF"], noir: ["#E58A6E", "#101010"] },
  ardoise: { blanc: ["#3E5A73", "#FFFFFF"], noir: ["#9DB6CC", "#101010"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "noir";
  const [acc, onAccent] = (ACCENTS[accent] ?? ACCENTS.encre!)[v];
  return { ...VARIANTS[v]!, accent: acc, onAccent };
}

const button =
  "flex min-h-[54px] w-full items-center justify-center bg-[var(--mi-accent)] px-6 text-[15px] font-medium text-[var(--mi-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mi-accent)]";

const styles: SectionStyles = {
  heading: "text-[13px] font-medium uppercase tracking-[0.16em] text-[var(--mi-ink-2)]",
  body: "text-[17px] leading-relaxed text-[var(--mi-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mi-ink-2)]",
  label: "text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--mi-ink-2)]",
  rule: "divide-[var(--mi-line)] border-[var(--mi-line)]",
  emphasis: "text-[22px] font-medium leading-[1.2] tracking-[-0.01em]",
  link: "border-b border-[var(--mi-ink)] text-[14px] font-medium transition-colors hover:text-[var(--mi-ink-2)]",
};

export function Minimal({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "noir";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName="bg-[var(--mi-bg)] text-[var(--mi-ink)]"
      vars={{ "--mi-bg": p.bg, "--mi-ink": p.ink, "--mi-ink-2": p.ink2, "--mi-line": p.line, "--mi-accent": p.accent, "--mi-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#1E1E1E" : "#EDEDED", "--env-fold": dark ? "#181818" : "#E6E6E6", "--env-flap": dark ? "#262626" : "#DEDEDE", "--env-edge": dark ? "#3A3A3A" : "#C8C8C8",
        "--env-card": "#FFFFFF", "--env-card-ink": "#101010", "--env-liner": p.line, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--app-font-sans)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.ink2, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="mi-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--mi-line)] bg-[var(--mi-bg)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[calc(100svh-32px)] flex-col py-4">
          {event.heroImageUrl ? (
            <div className="relative aspect-square max-h-[42svh] w-full overflow-hidden bg-[var(--mi-line)]">
              <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
          ) : (
            <div aria-hidden className="h-px w-full bg-[var(--mi-ink)]" />
          )}
          <div className="flex flex-1 flex-col justify-center py-8">
            {event.updatedNote && <p className="pc-fade mb-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--mi-ink-2)]">{event.updatedNote}</p>}
            {dear && (
              <p className="pc-fade mb-3 text-[15px] text-[var(--mi-ink-2)]" style={delay(0)}>
                {dear},
              </p>
            )}
            <p className="pc-fade text-[13px] font-medium uppercase tracking-[0.16em] text-[var(--mi-ink-2)]" style={delay(80)}>
              {EYEBROW_BY_TYPE[event.type]}
            </p>
            <h1 className="mt-3 font-semibold tracking-[-0.04em]">
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(56px,17vw,76px)]", "text-[clamp(44px,13vw,60px)]", "text-[clamp(34px,10vw,44px)]", "text-[clamp(28px,8vw,36px)]"])}
                lineClassName="leading-[0.95]"
                separator={<span className="block text-[24px] font-normal leading-[1.6] text-[var(--mi-ink-2)]">&amp;</span>}
              />
            </h1>
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <p aria-hidden className="mt-6 text-[17px] font-medium">
              {starts.weekday} {starts.day} {starts.month} {starts.year}
              <span className="text-[var(--mi-ink-2)]"> · {starts.time}</span>
            </p>
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className="pc-fade mt-1 text-[14px] text-[var(--mi-ink-2)]" style={delay(400)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
          </div>
          <HeroCta view={view} id="mi-hero-cta" button={button} noteClassName="text-[var(--mi-ink-2)]" />
        </header>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview border-t border-[var(--mi-line)] py-8">
          {title ? <h2 className={cn(styles.heading, "mb-6 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="border-t border-[var(--mi-line)] pt-8"
      rsvpTitle={<h2 className="text-[28px] font-semibold tracking-[-0.03em]">Votre réponse</h2>}
      footer={
        <footer className="mt-16 border-t border-[var(--mi-line)] pt-4 text-[13px] text-[var(--mi-ink-2)]">
          {event.hostParts.join(" & ")} · {starts.day} {starts.month} {starts.year}
        </footer>
      }
    />
  );
}
