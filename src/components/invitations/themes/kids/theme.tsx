import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { fredoka } from "../fonts";

/**
 * KIDS - rond, joyeux, lisible par un enfant.
 *
 * Le parti pris : tout est rond (Fredoka, coins a 24 px, boutons en galet)
 * et la signature est le bouquet de trois BALLONS dessines en SVG, dans les
 * trois couleurs de l accent, qui flottent au-dessus du prenom. Ils entrent
 * une fois ; aucun mouvement en boucle (un parent lit cette page dans un
 * couloir d ecole, un enfant sur le canape : le calme sert aux deux).
 *
 * Grands caracteres, phrases courtes, un seul bouton bien gros. Les
 * sections sont des cartes blanches a bordure haute coloree, en alternant
 * les trois couleurs : on repere "Programme" au bleu, "Goûter" au vert.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string; trio: [string, string, string] };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line">> = {
  ciel: { bg: "#EAF4FF", card: "#FFFFFF", ink: "#1E2A3A", ink2: "#56657A", line: "#D6E5F5" },
  creme: { bg: "#FFF6E5", card: "#FFFFFF", ink: "#2C2418", ink2: "#6B5E4A", line: "#F1E3C8" },
};

/** [aplat >= 4,5:1 avec blanc, texte sur aplat, trio de ballons] */
const ACCENTS: Record<string, [string, string, [string, string, string]]> = {
  bleu: ["#2463B8", "#FFFFFF", ["#2F7BD9", "#F2B33D", "#E0533F"]],
  vert: ["#237A52", "#FFFFFF", ["#2E9E6B", "#F2B33D", "#2F7BD9"]],
  rose: ["#B93E73", "#FFFFFF", ["#D9508A", "#F2B33D", "#2F7BD9"]],
};

function palette(variant: string, accent: string): Palette {
  const [acc, onAccent, trio] = ACCENTS[accent] ?? ACCENTS.bleu!;
  return { ...(VARIANTS[variant] ?? VARIANTS.ciel!), accent: acc, onAccent, trio };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "On se marie !",
  BIRTHDAY: "Viens fêter l’anniversaire de",
  CORPORATE: "Tu es invité chez",
  MEMORIAL: "En souvenir de",
  OTHER: "Tu es invité chez",
};

const button =
  "flex min-h-[58px] w-full items-center justify-center rounded-full bg-[var(--kd-accent)] px-6 text-[17px] font-semibold text-[var(--kd-on-accent)] [font-family:var(--inv-fredoka)] transition-[transform,opacity] duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--kd-accent)]";

const styles: SectionStyles = {
  heading: "text-[26px] font-semibold leading-tight [font-family:var(--inv-fredoka)]",
  body: "text-[17px] leading-relaxed text-[var(--kd-ink)]",
  muted: "text-[15.5px] leading-relaxed text-[var(--kd-ink-2)]",
  label: "text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--kd-ink-2)]",
  rule: "divide-[var(--kd-line)] border-[var(--kd-line)]",
  emphasis: "text-[21px] font-medium leading-[1.25] [font-family:var(--inv-fredoka)]",
  link: "rounded-full bg-[var(--kd-bg)] px-4 text-[14px] font-semibold text-[var(--kd-accent)] [font-family:var(--inv-fredoka)] transition-colors hover:bg-[var(--kd-line)]",
};

export function Kids({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      mainClassName={cn(fredoka.variable, "bg-[var(--kd-bg)] text-[var(--kd-ink)]")}
      vars={{ "--kd-bg": p.bg, "--kd-card": p.card, "--kd-ink": p.ink, "--kd-ink-2": p.ink2, "--kd-line": p.line, "--kd-accent": p.accent, "--kd-on-accent": p.onAccent, "--kd-a": p.trio[0], "--kd-b": p.trio[1], "--kd-c": p.trio[2] }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#F6EAD0", "--env-fold": "#F0E2C2", "--env-flap": "#EAD9B3", "--env-edge": "#D9C394",
        "--env-card": "#FFFFFF", "--env-card-ink": "#1E2A3A", "--env-liner": p.trio[1], "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-fredoka)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#B3261E", "--rsvp-font": "var(--inv-fredoka)" }}
      styles={styles}
      button={button}
      heroCtaId="kd-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[var(--kd-bg)]/95 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[calc(100svh-32px)] flex-col items-center justify-center py-8 text-center">
          <Balloons />
          {event.updatedNote && <p className="pc-fade mt-4 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--kd-accent)]">{event.updatedNote}</p>}
          {dear && (
            <p className="pc-fade mt-5 text-[17px] font-medium text-[var(--kd-ink-2)] [font-family:var(--inv-fredoka)]" style={delay(0)}>
              Coucou {dear} !
            </p>
          )}
          <p className="pc-fade mt-3 text-[15px] font-medium text-[var(--kd-ink-2)]" style={delay(80)}>
            {EYEBROW[event.type]}
          </p>
          <h1 className="mt-2 font-bold text-[var(--kd-accent)] [font-family:var(--inv-fredoka)]">
            <HostNames
              view={view}
              sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(56px,17vw,76px)]", "text-[clamp(44px,13vw,60px)]", "text-[clamp(34px,10vw,44px)]", "text-[clamp(28px,8vw,36px)]"])}
              lineClassName="leading-[1]"
              separator={<span className="block text-[22px] leading-[1.5] text-[var(--kd-ink-2)]">et</span>}
            />
          </h1>
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <div aria-hidden className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-[var(--kd-accent)] px-4 py-2 text-[15px] font-semibold text-[var(--kd-on-accent)] [font-family:var(--inv-fredoka)]">
              {starts.weekday} {starts.day} {starts.month}
            </span>
            <span className="rounded-full bg-[var(--kd-card)] px-4 py-2 text-[15px] font-semibold ring-2 ring-[var(--kd-line)] [font-family:var(--inv-fredoka)]">
              {starts.time}
            </span>
          </div>
          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-4 text-[15px] font-semibold text-[var(--kd-ink-2)] [font-family:var(--inv-fredoka)]" style={delay(560)}>
              {countdownText(event.daysLeft)} !
            </p>
          )}
          <HeroCta view={view} id="kd-hero-cta" button={button} className="mt-7 max-w-[320px]" noteClassName="text-[var(--kd-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-6 mt-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] bg-[var(--kd-card)] ring-4 ring-[var(--kd-card)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, index, title, children }) => (
        <section key={key} className="pc-inview mb-4 rounded-[24px] border-t-8 bg-[var(--kd-card)] px-5 py-6" style={{ borderTopColor: `var(--kd-${["a", "b", "c"][index % 3]})` }}>
          {title ? <h2 className={cn(styles.heading, "mb-5 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpWrapperClassName="pc-inview mb-4 rounded-[24px] bg-[var(--kd-card)] px-5 py-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[30px]")}>Tu viens ?</h2>}
      footer={
        <footer className="mt-12 text-center">
          <p className="text-[20px] font-semibold [font-family:var(--inv-fredoka)]">À bientôt !</p>
          <p className="mt-1 text-[13px] text-[var(--kd-ink-2)]">
            {event.hostParts.join(" et ")} · {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}

/** Trois ballons et leurs ficelles, dans les couleurs du trio. */
function Balloons() {
  return (
    <svg aria-hidden viewBox="0 0 160 150" className="pc-fade h-[clamp(96px,18svh,140px)] w-auto" style={delay(120)}>
      <g stroke="var(--kd-ink-2)" strokeWidth="1.2" fill="none" opacity="0.6">
        <path d="M52 92c6 18-4 34 8 56" />
        <path d="M84 84c-2 20 8 40 0 64" />
        <path d="M116 96c-8 16 6 34-4 52" />
      </g>
      <ellipse cx="52" cy="58" rx="30" ry="36" fill="var(--kd-a)" />
      <ellipse cx="84" cy="46" rx="32" ry="38" fill="var(--kd-b)" />
      <ellipse cx="116" cy="62" rx="28" ry="34" fill="var(--kd-c)" />
      <g fill="#FFFFFF" opacity="0.35">
        <ellipse cx="42" cy="42" rx="7" ry="11" transform="rotate(-20 42 42)" />
        <ellipse cx="73" cy="28" rx="7" ry="12" transform="rotate(-20 73 28)" />
        <ellipse cx="107" cy="46" rx="6" ry="10" transform="rotate(-20 107 46)" />
      </g>
    </svg>
  );
}
