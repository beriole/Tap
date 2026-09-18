import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { spaceGrotesk } from "../fonts";

/**
 * NEON - sombre, un accent lumineux CONTROLE.
 *
 * Le parti pris : la lumiere ne touche que deux choses - les noms et l heure.
 * Un halo (text-shadow en deux couches) sur ces mots, et rien d autre : pas
 * de fond en degrade anime, pas de bordure qui clignote (§12.2 "pas de glow
 * RGB"). Le reste de la page est un gris presque noir, un quadrillage a peine
 * visible, une grotesque (Space Grotesk) aux chiffres larges.
 *
 * Le bouton est un tube : bordure d accent, texte d accent, fond
 * transparent ; au toucher il se remplit. Les sections sont alignees a
 * gauche, titres en accent SANS halo.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line">> = {
  noir: { bg: "#0B0B10", card: "#14141B", ink: "#F3F3F7", ink2: "#A6A7B3", line: "#24242E" },
  marine: { bg: "#0B1224", card: "#111A31", ink: "#F0F3FA", ink2: "#A3ACC4", line: "#1F2A47" },
};

/** [accent (>= 4,5:1 sur le fond sombre), texte sur accent] */
const ACCENTS: Record<string, [string, string]> = {
  cyan: ["#3DF2E0", "#062A26"],
  magenta: ["#FF6FE0", "#33062B"],
  lime: ["#C6FF4A", "#1F2E05"],
};

function palette(variant: string, accent: string): Palette {
  const [acc, onAccent] = ACCENTS[accent] ?? ACCENTS.cyan!;
  return { ...(VARIANTS[variant] ?? VARIANTS.noir!), accent: acc, onAccent };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Soirée d’anniversaire",
  CORPORATE: "Invitation",
  MEMORIAL: "En souvenir de",
  OTHER: "Invitation",
};

const glow = "[text-shadow:0_0_12px_color-mix(in_srgb,var(--ne-accent)_70%,transparent),0_0_36px_color-mix(in_srgb,var(--ne-accent)_35%,transparent)]";
const mono = "text-[11px] font-medium uppercase tracking-[0.24em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-lg border-2 border-[var(--ne-accent)] px-6 text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--ne-accent)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--ne-accent)] hover:text-[var(--ne-on-accent)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ne-accent)]";

const styles: SectionStyles = {
  heading: "text-[26px] font-bold leading-tight tracking-[-0.01em] text-[var(--ne-accent)] [font-family:var(--inv-space)]",
  body: "text-[16px] leading-relaxed text-[var(--ne-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ne-ink-2)]",
  label: cn(mono, "text-[var(--ne-ink-2)]"),
  rule: "divide-[var(--ne-line)] border-[var(--ne-line)]",
  emphasis: "text-[21px] font-medium leading-[1.2] [font-family:var(--inv-space)]",
  link: "border-b border-[var(--ne-accent)] text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--ne-accent)] transition-opacity hover:opacity-80",
};

const GRID: React.CSSProperties = {
  backgroundImage: "linear-gradient(var(--ne-line) 1px, transparent 1px), linear-gradient(90deg, var(--ne-line) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)",
  WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)",
};

export function Neon({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark
      mainClassName={cn(spaceGrotesk.variable, "bg-[var(--ne-bg)] text-[var(--ne-ink)]")}
      vars={{ "--ne-bg": p.bg, "--ne-card": p.card, "--ne-ink": p.ink, "--ne-ink-2": p.ink2, "--ne-line": p.line, "--ne-accent": p.accent, "--ne-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#1B1B24", "--env-fold": "#16161E", "--env-flap": "#23232E", "--env-edge": "#34344A",
        "--env-card": "#F3F3F7", "--env-card-ink": "#0B0B10", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-space)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#FF8A80", "--rsvp-font": "var(--inv-space)" }}
      styles={styles}
      button={button}
      heroCtaId="ne-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--ne-line)] bg-[var(--ne-bg)]/95 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      before={<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[100svh]" style={GRID} />}
      hero={
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col justify-center py-10">
          {event.updatedNote && <p className={cn(mono, "pc-fade mb-6 text-[10px] text-[var(--ne-accent)]")}>{event.updatedNote}</p>}
          {dear && (
            <p className="pc-fade mb-4 text-[14px] text-[var(--ne-ink-2)]" style={delay(0)}>
              {dear} —
            </p>
          )}
          <p className={cn(mono, "pc-fade text-[var(--ne-ink-2)]")} style={delay(80)}>
            {EYEBROW[event.type]}
          </p>
          <h1 className={cn("mt-5 font-bold tracking-[-0.02em] text-[var(--ne-accent)] [font-family:var(--inv-space)]", glow)}>
            <HostNames
              view={view}
              sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(56px,17vw,76px)]", "text-[clamp(44px,13vw,60px)]", "text-[clamp(34px,10vw,44px)]", "text-[clamp(28px,8vw,36px)]"])}
              lineClassName="leading-[0.95]"
              separator={<span className="block text-[22px] leading-[1.8] text-[var(--ne-ink-2)] [text-shadow:none]">&amp;</span>}
            />
          </h1>
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <div aria-hidden className="mt-8 border-l-2 border-[var(--ne-accent)] pl-4">
            <p className="text-[19px] font-medium [font-family:var(--inv-space)]">
              {starts.weekday} {starts.day} {starts.month} {starts.year}
            </p>
            <p className={cn("mt-1 text-[clamp(30px,8vw,38px)] font-bold leading-none text-[var(--ne-accent)] [font-family:var(--inv-space)]", glow)}>{starts.time}</p>
          </div>
          {theme.settings.countdown && event.daysLeft !== null && (
            <p className={cn(mono, "pc-fade mt-5 text-[var(--ne-ink-2)]")} style={delay(560)}>
              {countdownText(event.daysLeft)}
            </p>
          )}
          <HeroCta view={view} id="ne-hero-cta" button={button} className="mt-8 max-w-[320px]" noteClassName="text-[var(--ne-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-14 mt-6 rounded-xl border border-[var(--ne-line)] p-1.5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[var(--ne-card)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, index, title, children }) => (
        <section key={key} className="pc-inview mb-14">
          <p className={cn(mono, "text-[var(--ne-ink-2)]")}>{String(index + 1).padStart(2, "0")}</p>
          {title ? <h2 className={cn(styles.heading, "mb-6 mt-2 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-6" />}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="rounded-2xl border border-[var(--ne-line)] bg-[var(--ne-card)] px-5 py-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[30px]")}>Votre réponse</h2>}
      footer={
        <footer className="mt-20 flex items-center justify-between">
          <span className="text-[15px] font-bold [font-family:var(--inv-space)]">{event.hostParts.join(" & ")}</span>
          <span className={cn(mono, "text-[10px] text-[var(--ne-ink-2)]")}>
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </span>
        </footer>
      }
    />
  );
}
