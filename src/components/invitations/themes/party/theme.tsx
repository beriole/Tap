import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";

/**
 * PARTY - typographie expressive, confettis maitrises.
 *
 * Le parti pris : les noms en Bricolage Grotesque (deja chargee par
 * l application) en graisse 800, tres serres, LEGEREMENT inclines ; c est la
 * seule fantaisie typographique. Les confettis sont dix-huit petits rectangles
 * SVG dans les trois couleurs de l accent, poses UNE fois derriere le premier
 * ecran ; ils entrent en 500 ms puis ne bougent plus (§14.1 "mouvement
 * court"). Rien ne tombe en boucle.
 *
 * La date est un badge plein, pose de travers comme une etiquette. Les
 * sections sont alignees a gauche, titres en capitales grasses, filets epais
 * dans la couleur d accent.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string; confetti: [string, string, string] };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FFFDF7", ink: "#1E1A2E", ink2: "#5F5A72", line: "#EAE6DC" },
  nuit: { bg: "#1B1530", ink: "#FBF8F1", ink2: "#BDB7CF", line: "#332B4D" },
};

/**
 * [aplat, texte d accent SUR LE FOND, texte sur l aplat] par variante, puis les
 * confettis. L accent sert a deux choses - remplir le bouton et colorer de
 * petites mentions - et une seule valeur ne peut pas tenir 4,5:1 dans les deux
 * roles sur un fond clair ET un fond nuit.
 */
const ACCENTS: Record<string, { blanc: [string, string, string]; nuit: [string, string, string]; confetti: [string, string, string] }> = {
  corail: { blanc: ["#C93F2C", "#C93F2C", "#FFFFFF"], nuit: ["#E0533F", "#F08A78", "#1B1530"], confetti: ["#E0533F", "#F2B33D", "#4C8DF5"] },
  soleil: { blanc: ["#8A5F07", "#8A5F07", "#FFFFFF"], nuit: ["#E5A21B", "#F2B33D", "#1B1530"], confetti: ["#E5A21B", "#E0533F", "#2FB37A"] },
  violet: { blanc: ["#5A40C9", "#5A40C9", "#FFFFFF"], nuit: ["#8B7BEF", "#A895F0", "#1B1530"], confetti: ["#8B7BEF", "#F26B8A", "#F2B33D"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "nuit";
  const chosen = ACCENTS[accent] ?? ACCENTS.corail!;
  const [acc, accentText, onAccent] = chosen[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent, confetti: chosen.confetti };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "On se marie !",
  BIRTHDAY: "C’est la fête !",
  CORPORATE: "Vous êtes invité",
  MEMORIAL: "En souvenir de",
  OTHER: "Vous êtes invité",
};

const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[var(--pa-accent)] px-6 text-[15px] font-bold text-[var(--pa-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pa-accent)]";

const styles: SectionStyles = {
  heading: "text-[26px] font-extrabold uppercase leading-[1] tracking-[-0.01em] [font-family:var(--app-font-grotesk)]",
  body: "text-[16px] leading-relaxed text-[var(--pa-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--pa-ink-2)]",
  label: "text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--pa-accent-text)]",
  rule: "divide-[var(--pa-line)] border-[var(--pa-line)]",
  emphasis: "text-[20px] font-bold leading-[1.2] [font-family:var(--app-font-grotesk)]",
  link: "border-b-2 border-[var(--pa-accent)] text-[13px] font-bold text-[var(--pa-accent-text)] transition-colors hover:opacity-80",
};

// Position, rotation et couleur (index) de chaque confetti : fixes, pas tires au sort au rendu.
const CONFETTI: [number, number, number, number][] = [
  [6, 8, 20, 0], [18, 4, -30, 1], [31, 11, 45, 2], [47, 5, 10, 0], [62, 9, -20, 1], [78, 4, 35, 2], [91, 12, -45, 0],
  [10, 22, 60, 2], [40, 19, -15, 1], [70, 24, 25, 0], [88, 27, -60, 1],
  [4, 40, -35, 1], [95, 44, 30, 2], [8, 70, 15, 0], [93, 74, -25, 1], [14, 88, 50, 2], [85, 90, -10, 0], [50, 94, 40, 1],
];

export function Party({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "nuit";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName="bg-[var(--pa-bg)] text-[var(--pa-ink)]"
      vars={{ "--pa-bg": p.bg, "--pa-ink": p.ink, "--pa-ink-2": p.ink2, "--pa-line": p.line, "--pa-accent": p.accent, "--pa-accent-text": p.accentText, "--pa-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#2A2245" : "#F3EEE2", "--env-fold": dark ? "#241D3D" : "#ECE6D8", "--env-flap": dark ? "#342B52" : "#E5DECE", "--env-edge": dark ? "#4A3F6E" : "#CFC6B2",
        "--env-card": "#FFFDF7", "--env-card-ink": "#1E1A2E", "--env-liner": p.confetti[1], "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--app-font-grotesk)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--app-font-grotesk)" }}
      styles={styles}
      button={button}
      heroCtaId="pa-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="border-t-2 border-[var(--pa-accent)] bg-[var(--pa-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="relative flex min-h-[calc(100svh-32px)] flex-col justify-center py-8">
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pc-fade pointer-events-none absolute inset-0 h-full w-full" style={delay(200)}>
            {CONFETTI.map(([x, y, r, c], i) => (
              <rect key={i} x={x} y={y} width="2.2" height="4" rx="0.5" fill={p.confetti[c]} transform={`rotate(${r} ${x + 1} ${y + 2})`} />
            ))}
          </svg>
          <div className="relative">
            {event.updatedNote && <p className="pc-fade mb-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--pa-accent-text)]">{event.updatedNote}</p>}
            {dear && (
              <p className="pc-fade mb-3 text-[15px] font-medium text-[var(--pa-ink-2)]" style={delay(0)}>
                {dear},
              </p>
            )}
            <p className="pc-fade text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--pa-accent-text)]" style={delay(80)}>
              {EYEBROW[event.type]}
            </p>
            <h1 className="mt-4 -rotate-2 font-extrabold uppercase tracking-[-0.03em] [font-family:var(--app-font-grotesk)]">
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(58px,17vw,80px)]", "text-[clamp(46px,13.5vw,62px)]", "text-[clamp(36px,10.5vw,46px)]", "text-[clamp(30px,8vw,38px)]"])}
                lineClassName="leading-[0.9]"
                separator={<span className="block text-[24px] leading-[1.5] text-[var(--pa-accent-text)]">+</span>}
              />
            </h1>
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            {/* w-fit, pas inline-block : le conteneur de l ossature porte break-words, et
                un bloc en ajustement au contenu s y reduisait a une lettre par ligne. */}
            <div aria-hidden className="mt-7 w-fit rotate-1 rounded-lg bg-[var(--pa-accent)] px-4 py-2 text-[var(--pa-on-accent)]">
              <p className="text-[18px] font-extrabold uppercase leading-none [font-family:var(--app-font-grotesk)]">
                {starts.weekday} {starts.day} {starts.month}
              </p>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em]">
                {starts.year} · {starts.time}
              </p>
            </div>
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className="pc-fade mt-4 text-[14px] font-bold text-[var(--pa-ink-2)]" style={delay(560)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
            <HeroCta view={view} id="pa-hero-cta" button={button} className="mt-7 max-w-[320px]" noteClassName="text-[var(--pa-ink-2)]" />
          </div>
        </header>
      }
      photo={
        <figure className="pc-inview -mx-5 mb-14 mt-6">
          <div className="relative aspect-square w-full overflow-hidden bg-[var(--pa-line)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14">
          <span aria-hidden className="block h-1.5 w-12 bg-[var(--pa-accent)]" />
          {title ? <h2 className={cn(styles.heading, "mb-6 mt-4 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-6" />}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="border-t-4 border-[var(--pa-accent)] pt-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[34px]")}>Tu viens ?</h2>}
      footer={
        <footer className="mt-20">
          <p className="text-[22px] font-extrabold uppercase leading-none tracking-[-0.02em] [font-family:var(--app-font-grotesk)]">{event.hostParts.join(" + ")}</p>
          <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--pa-ink-2)]">
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
