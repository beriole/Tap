import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { EYEBROW_BY_TYPE, HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { manrope } from "../fonts";

/**
 * MODERN GLASS - la photo, et un panneau de verre.
 *
 * Le parti pris : le premier ecran EST la photo du couple, en plein ecran ;
 * les noms, la date et le bouton sont poses sur un panneau translucide
 * (fond blanc a 22 %, flou d arriere-plan, filet blanc). Sans photo, un
 * degrade de lumiere douce tient le role.
 *
 * Le flou d arriere-plan (backdrop-filter) coute cher au rendu : il n est
 * utilise QUE sur le panneau du premier ecran et le bouton colle. Les sections
 * sont des cartes opaques a angles doux sur un fond uni : pas de "carte de
 * verre dans une carte de verre" (§12.2).
 *
 * Sans-serif geometrique (Manrope) en graisse 700 pour les noms, 500 pour le
 * reste : moderne, sans effet.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string; glass: string; glassInk: string; glassLine: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line" | "glass" | "glassInk" | "glassLine">> = {
  clair: { bg: "#EEF0F3", card: "#FFFFFF", ink: "#1B1F26", ink2: "#5B6270", line: "#E1E4E9", glass: "rgba(255,255,255,0.22)", glassInk: "#FFFFFF", glassLine: "rgba(255,255,255,0.45)" },
  sombre: { bg: "#14171C", card: "#1E2229", ink: "#F2F4F7", ink2: "#A5ACB8", line: "#2C313A", glass: "rgba(20,23,28,0.35)", glassInk: "#FFFFFF", glassLine: "rgba(255,255,255,0.28)" },
};

/** Bouton : fond + texte, meme valeur sur les deux variantes (le bouton est sur la photo). */
const ACCENTS: Record<string, [string, string]> = {
  blanc: ["#FFFFFF", "#14171C"],
  sable: ["#E6D6BC", "#2A2113"],
  menthe: ["#B9E6D9", "#0F2F27"],
};

function palette(variant: string, accent: string): Palette {
  const [acc, onAccent] = ACCENTS[accent] ?? ACCENTS.blanc!;
  return { ...(VARIANTS[variant] ?? VARIANTS.clair!), accent: acc, onAccent };
}

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-[var(--mgl-accent)] px-6 text-[15px] font-semibold text-[var(--mgl-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mgl-accent)]";

const styles: SectionStyles = {
  heading: "text-[26px] font-bold leading-tight tracking-[-0.02em] [font-family:var(--inv-manrope)]",
  body: "text-[16px] leading-relaxed text-[var(--mgl-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mgl-ink-2)]",
  label: "text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--mgl-ink-2)]",
  rule: "divide-[var(--mgl-line)] border-[var(--mgl-line)]",
  emphasis: "text-[20px] font-semibold leading-[1.25] [font-family:var(--inv-manrope)]",
  link: "rounded-full bg-[var(--mgl-bg)] px-4 text-[13px] font-semibold transition-colors hover:text-[var(--mgl-ink-2)]",
};

export function ModernGlass({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "sombre";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(manrope.variable, "bg-[var(--mgl-bg)] text-[var(--mgl-ink)]")}
      vars={{ "--mgl-bg": p.bg, "--mgl-card": p.card, "--mgl-ink": p.ink, "--mgl-ink-2": p.ink2, "--mgl-line": p.line, "--mgl-accent": p.accent, "--mgl-on-accent": p.onAccent, "--mgl-glass": p.glass, "--mgl-glass-ink": p.glassInk, "--mgl-glass-line": p.glassLine }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#262B33" : "#DFE3E9", "--env-fold": dark ? "#20242B" : "#D6DBE2", "--env-flap": dark ? "#2E343D" : "#CDD3DB", "--env-edge": dark ? "#3E4550" : "#B5BCC6",
        "--env-card": "#FFFFFF", "--env-card-ink": "#1B1F26", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-manrope)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.ink2, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--inv-manrope)" }}
      styles={styles}
      button={button}
      heroCtaId="mgl-hero-cta"
      containerClassName="px-4"
      dockClassName="bg-[var(--mgl-bg)]/80 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
      hero={
        <header className="relative -mx-4 flex min-h-[100svh] flex-col justify-end overflow-hidden">
          {/* Fond : la photo, sinon une lumiere douce. */}
          {event.heroImageUrl ? (
            <Image src={event.heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          ) : (
            <div aria-hidden className="absolute inset-0" style={{ background: dark ? "radial-gradient(120% 90% at 30% 20%, #3A4250 0%, #14171C 70%)" : "radial-gradient(120% 90% at 30% 20%, #FFFFFF 0%, #C9D0DA 70%)" }} />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

          <div className="relative px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
            <div className="rounded-[28px] border border-[var(--mgl-glass-line)] bg-[var(--mgl-glass)] p-6 text-[var(--mgl-glass-ink)] backdrop-blur-xl [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">
              {event.updatedNote && <p className="pc-fade mb-4 text-[11px] font-bold uppercase tracking-[0.2em] opacity-90">{event.updatedNote}</p>}
              {dear && (
                <p className="pc-fade mb-3 text-[14px] font-medium opacity-90" style={delay(0)}>
                  {dear}
                </p>
              )}
              <p className="pc-fade text-[11px] font-bold uppercase tracking-[0.2em] opacity-90" style={delay(80)}>
                {EYEBROW_BY_TYPE[event.type]}
              </p>
              <h1 className="mt-3 font-bold tracking-[-0.03em] [font-family:var(--inv-manrope)]">
                <HostNames
                  view={view}
                  sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(44px,13vw,58px)]", "text-[clamp(36px,10.5vw,48px)]", "text-[clamp(30px,8.5vw,40px)]", "text-[clamp(26px,7vw,32px)]"])}
                  lineClassName="leading-[1]"
                  separator={<span className="block text-[20px] font-medium leading-[1.6] opacity-90">&amp;</span>}
                />
              </h1>
              <p className="sr-only">
                {starts.long}, {starts.time}
              </p>
              <p aria-hidden className="mt-5 text-[17px] font-semibold [font-family:var(--inv-manrope)]">
                {starts.weekday} {starts.day} {starts.month} {starts.year} · {starts.time}
              </p>
              {theme.settings.countdown && event.daysLeft !== null && (
                <p className="pc-fade mt-1 text-[13.5px] font-medium opacity-90" style={delay(400)}>
                  {countdownText(event.daysLeft)}
                </p>
              )}
              <HeroCta view={view} id="mgl-hero-cta" button={cn(button, "[text-shadow:none]")} className="mt-6" noteClassName="opacity-90" />
            </div>
          </div>
        </header>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mt-4 rounded-[24px] bg-[var(--mgl-card)] px-5 py-7 first-of-type:mt-6">
          {title ? <h2 className={cn(styles.heading, "mb-6 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="pc-inview mt-4 rounded-[24px] bg-[var(--mgl-card)] px-5 py-8"
      rsvpTitle={<h2 className={styles.heading}>Votre réponse</h2>}
      footer={
        <footer className="mt-14 text-center">
          <p className="text-[14px] font-semibold [font-family:var(--inv-manrope)]">{event.hostParts.join(" & ")}</p>
          <p className="mt-1 text-[12px] text-[var(--mgl-ink-2)]">
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
