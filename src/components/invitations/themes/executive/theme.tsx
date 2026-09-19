import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { cormorant } from "../fonts";
import { HeroCta, ThemeShell, countdownText, delay, salutation, type SectionStyles } from "../../shared";

/**
 * EXECUTIVE - grille stricte, identite par la couleur.
 *
 * Le parti pris : la page ressemble a un document d entreprise bien fait,
 * pas a un faire-part. Une BARRE DE MARQUE en haut, dans la couleur de
 * l accent, porte le nom de l organisateur en capitales ; le titre de
 * l evenement est la manchette (Geist semi-gras, tres grand) ; la date, l heure
 * et le lieu sont dans un TABLEAU a deux colonnes, etiquettes a gauche,
 * valeurs a droite. Le bouton est plein, dans la couleur de marque.
 *
 * Les sections sont numerotees et separees par des filets ; tout est aligne
 * a gauche sur une marge unique. Aucune photo pleine largeur : elle tient
 * dans la grille, en 16:9.
 */

type Palette = { bg: string; panel: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "panel" | "ink" | "ink2" | "line">> = {
  blanc: { bg: "#FFFFFF", panel: "#F4F5F7", ink: "#15171B", ink2: "#5A6070", line: "#E1E4EA" },
  graphite: { bg: "#17191D", panel: "#20232A", ink: "#F3F4F6", ink2: "#A8AEBB", line: "#2F333B" },
};

/** [aplat, texte d accent sur le fond, texte sur aplat] par variante */
const ACCENTS: Record<string, { blanc: [string, string, string]; graphite: [string, string, string] }> = {
  marine: { blanc: ["#173B6C", "#173B6C", "#FFFFFF"], graphite: ["#2F5FA8", "#8FB3EA", "#FFFFFF"] },
  vert: { blanc: ["#1F6B4A", "#1F6B4A", "#FFFFFF"], graphite: ["#2A8A60", "#7FD1AA", "#FFFFFF"] },
  rouge: { blanc: ["#A32C2C", "#A32C2C", "#FFFFFF"], graphite: ["#C0392B", "#F09A91", "#FFFFFF"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "blanc") as "blanc" | "graphite";
  const [acc, accentText, onAccent] = (ACCENTS[accent] ?? ACCENTS.marine!)[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Invitation",
  MEMORIAL: "Hommage",
  OTHER: "Invitation",
};

const caps = "text-[11px] font-semibold uppercase tracking-[0.14em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-md bg-[var(--ex-accent)] px-6 text-[14px] font-semibold text-[var(--ex-on-accent)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ex-accent)]";

const styles: SectionStyles = {
  heading: "text-[22px] font-semibold leading-tight tracking-[-0.02em]",
  body: "text-[16px] leading-relaxed text-[var(--ex-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ex-ink-2)]",
  label: cn(caps, "text-[var(--ex-accent-text)]"),
  rule: "divide-[var(--ex-line)] border-[var(--ex-line)]",
  emphasis: "text-[19px] font-semibold leading-[1.25]",
  link: "rounded-md border border-[var(--ex-line)] px-3.5 text-[13px] font-semibold text-[var(--ex-accent-text)] transition-colors hover:bg-[var(--ex-panel)]",
};

export function Executive({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "graphite";
  const first = venues[0];

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(cormorant.variable, "bg-[var(--ex-bg)] text-[var(--ex-ink)]")}
      vars={{ "--ex-bg": p.bg, "--ex-panel": p.panel, "--ex-ink": p.ink, "--ex-ink-2": p.ink2, "--ex-line": p.line, "--ex-accent": p.accent, "--ex-accent-text": p.accentText, "--ex-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#262930" : "#E9EBEF", "--env-fold": dark ? "#20232A" : "#E2E5EA", "--env-flap": dark ? "#2C3038" : "#DADEE5", "--env-edge": dark ? "#3D424C" : "#C3C9D2",
        "--env-card": "#FFFFFF", "--env-card-ink": "#15171B", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--app-font-sans)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accentText, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="ex-hero-cta"
      dockClassName="border-t border-[var(--ex-line)] bg-[var(--ex-bg)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      before={
        <div className="bg-[var(--ex-accent)] pt-[env(safe-area-inset-top)] text-[var(--ex-on-accent)]">
          <div className={cn(caps, "mx-auto flex max-w-[460px] items-center justify-between px-5 py-3.5")}>
            <span className="truncate">{event.hosts}</span>
            <span className="shrink-0 opacity-90">{KIND[event.type]}</span>
          </div>
        </div>
      }
      hero={
        <header className="flex min-h-[calc(100svh-48px)] flex-col py-8">
          <div className="flex flex-1 flex-col justify-center">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-5 text-[var(--ex-accent-text)]")}>{event.updatedNote}</p>}
            {dear && (
              <p className="pc-fade mb-4 text-[15px] text-[var(--ex-ink-2)]" style={delay(0)}>
                Pour {dear}
              </p>
            )}
            {/* Le titre en garalde de titrage : le ton d un rapport annuel ou d une soiree d hotel, pas d un formulaire. */}
            <h1 className="text-[clamp(38px,11vw,52px)] font-normal leading-[1] tracking-[-0.02em] [font-family:var(--inv-cormorant)] [overflow-wrap:anywhere] [text-wrap:balance]">{event.title}</h1>
            <p className="pc-fade mt-4 text-[14px] text-[var(--ex-ink-2)]" style={delay(120)}>
              Organisé par <span className="font-semibold text-[var(--ex-ink)]">{event.hosts}</span>
            </p>

            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            {/* Le bloc date : le quantieme en grand, le reste compose a cote, un filet d accent. */}
            <div aria-hidden className="mt-9 flex items-stretch gap-5 border-t-2 border-[var(--ex-accent)] pt-5">
              <span className="text-[clamp(64px,19vw,84px)] font-normal leading-[0.8] tabular-nums [font-family:var(--inv-cormorant)] [font-variant-numeric:lining-nums_tabular-nums]">{starts.day}</span>
              <span className="flex min-w-0 flex-col justify-between">
                <span className={cn(caps, "text-[var(--ex-ink)]")}>
                  {starts.month} {starts.year}
                </span>
                <span className="text-[14px] text-[var(--ex-ink-2)] first-letter:uppercase">
                  {starts.weekday} · {starts.time}
                </span>
                {first && <span className="truncate text-[14px] font-semibold">{first.name}</span>}
              </span>
            </div>
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className={cn(caps, "pc-fade mt-4 text-[var(--ex-accent-text)]")} style={delay(400)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
          </div>
          <HeroCta view={view} id="ex-hero-cta" button={button} className="mt-8" noteClassName="text-[var(--ex-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-10 mt-4">
          <div className="relative aspect-video w-full overflow-hidden bg-[var(--ex-panel)]">
            <div className="pc-parallax absolute inset-0">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
          </div>
        </figure>
      }
      section={({ key, index, title, children }) => (
        <section key={key} className="pc-inview border-t border-[var(--ex-line)] py-8">
          <div className="mb-6 flex items-baseline gap-3">
            <span className={cn(caps, "tabular-nums text-[var(--ex-accent-text)]")}>{String(index + 1).padStart(2, "0")}</span>
            {title && <h2 className={cn(styles.heading, "[overflow-wrap:anywhere]")}>{title}</h2>}
          </div>
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="mt-2 rounded-lg bg-[var(--ex-panel)] px-5 py-8"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[26px]")}>Confirmer votre présence</h2>}
      footer={
        <footer className={cn(caps, "mt-16 flex items-center justify-between border-t-2 border-[var(--ex-accent)] pt-4 text-[10px] text-[var(--ex-ink-2)]")}>
          <span className="truncate">{event.hosts}</span>
          <span className="shrink-0 tabular-nums">
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </span>
        </footer>
      }
      venuesTitle={(n) => (n > 1 ? "Lieux" : "Lieu")}
    />
  );
}
