import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, ThemeShell, countdownText, delay, salutation, type SectionStyles } from "../../shared";
import { manrope } from "../fonts";

/**
 * CONFERENCE - l information d abord.
 *
 * Le parti pris : la page d un evenement professionnel se lit comme un
 * programme. En haut, un BADGE (« Conférence », la date) ; le titre en
 * Manrope extra-gras ; puis une BANDE DE REPERES a trois cases - jour,
 * heure, lieu - qu on retrouve sur tous les billets d evenement. Le bouton
 * suit immediatement : s inscrire est l action.
 *
 * Les sections sont des blocs a bordure gauche coloree, titres en gras,
 * contenu aligne a gauche ; le programme (SectionBody) devient naturellement
 * un agenda avec sa colonne d heures.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; accentText: string; onAccent: string; soft: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line">> = {
  clair: { bg: "#F5F6F8", card: "#FFFFFF", ink: "#0F172A", ink2: "#4B5563", line: "#E3E6EC" },
  sombre: { bg: "#0F172A", card: "#172037", ink: "#F1F5F9", ink2: "#A3AEC2", line: "#263049" },
};

/** [aplat, texte d accent, texte sur aplat, fond leger] par variante */
const ACCENTS: Record<string, { clair: [string, string, string, string]; sombre: [string, string, string, string] }> = {
  bleu: { clair: ["#1D4ED8", "#1D4ED8", "#FFFFFF", "#DBE6FE"], sombre: ["#3B82F6", "#93B4FD", "#0B1633", "#1B2A4D"] },
  violet: { clair: ["#6D28D9", "#6D28D9", "#FFFFFF", "#E8DEFB"], sombre: ["#8B5CF6", "#C4B0FA", "#1B0F3A", "#2A2050"] },
  teal: { clair: ["#0F766E", "#0F766E", "#FFFFFF", "#D2F0EC"], sombre: ["#14B8A6", "#7EE0D3", "#062A26", "#12313A"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "clair") as "clair" | "sombre";
  const [acc, accentText, onAccent, soft] = (ACCENTS[accent] ?? ACCENTS.bleu!)[v];
  return { ...VARIANTS[v]!, accent: acc, accentText, onAccent, soft };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Conférence",
  MEMORIAL: "Hommage",
  OTHER: "Événement",
};

const caps = "text-[11px] font-bold uppercase tracking-[0.12em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[var(--cf-accent)] px-6 text-[15px] font-bold text-[var(--cf-on-accent)] [font-family:var(--inv-manrope)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cf-accent)]";

const styles: SectionStyles = {
  heading: "text-[22px] font-extrabold leading-tight tracking-[-0.02em] [font-family:var(--inv-manrope)]",
  body: "text-[16px] leading-relaxed text-[var(--cf-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--cf-ink-2)]",
  label: cn(caps, "text-[var(--cf-accent-text)]"),
  rule: "divide-[var(--cf-line)] border-[var(--cf-line)]",
  emphasis: "text-[19px] font-bold leading-[1.25] [font-family:var(--inv-manrope)]",
  link: "rounded-lg bg-[var(--cf-soft)] px-3.5 text-[13px] font-bold text-[var(--cf-accent-text)] transition-opacity hover:opacity-80",
};

export function Conference({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, venues, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "sombre";
  const first = venues[0];

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(manrope.variable, "bg-[var(--cf-bg)] text-[var(--cf-ink)]")}
      vars={{ "--cf-bg": p.bg, "--cf-card": p.card, "--cf-ink": p.ink, "--cf-ink-2": p.ink2, "--cf-line": p.line, "--cf-accent": p.accent, "--cf-accent-text": p.accentText, "--cf-on-accent": p.onAccent, "--cf-soft": p.soft }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#1E2A44" : "#E4E8EF", "--env-fold": dark ? "#19233A" : "#DCE1EA", "--env-flap": dark ? "#24304E" : "#D3D9E4", "--env-edge": dark ? "#334266" : "#B8C1D0",
        "--env-card": "#FFFFFF", "--env-card-ink": "#0F172A", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-manrope)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accentText, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--inv-manrope)" }}
      styles={styles}
      button={button}
      heroCtaId="cf-hero-cta"
      containerClassName="pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[var(--cf-bg)]/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[calc(100svh-32px)] flex-col py-6">
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(caps, "rounded-md bg-[var(--cf-soft)] px-2.5 py-1.5 text-[var(--cf-accent-text)]")}>{KIND[event.type]}</span>
              {event.updatedNote && <span className={cn(caps, "pc-fade text-[10px] text-[var(--cf-ink-2)]")}>{event.updatedNote}</span>}
            </div>
            {dear && (
              <p className="pc-fade mt-5 text-[15px] text-[var(--cf-ink-2)]" style={delay(0)}>
                {dear},
              </p>
            )}
            <h1 className="mt-4 text-[clamp(32px,9vw,42px)] font-extrabold leading-[1.05] tracking-[-0.03em] [font-family:var(--inv-manrope)] [overflow-wrap:anywhere] [text-wrap:balance]">{event.title}</h1>
            <p className="pc-fade mt-3 text-[15px] font-medium text-[var(--cf-ink-2)]" style={delay(120)}>
              {event.hosts}
            </p>

            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <div aria-hidden className="mt-7 grid grid-cols-3 divide-x divide-[var(--cf-line)] rounded-xl bg-[var(--cf-card)] ring-1 ring-[var(--cf-line)]">
              {/* Le mois en entier, sur deux lignes s il le faut : « 15 octo » se lit mal. */}
              <Cell label={starts.weekday}>
                {starts.day} {starts.month}
              </Cell>
              <Cell label="Heure">{starts.time}</Cell>
              <Cell label="Lieu">
                <span className="line-clamp-2 [overflow-wrap:anywhere]">{first ? first.name : "À venir"}</span>
              </Cell>
            </div>
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className="pc-fade mt-3 text-[13px] font-semibold text-[var(--cf-accent-text)]" style={delay(400)}>
                {countdownText(event.daysLeft)}
              </p>
            )}
          </div>
          <HeroCta view={view} id="cf-hero-cta" button={button} className="mt-6" noteClassName="text-[var(--cf-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-6 mt-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--cf-card)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-4 rounded-xl border-l-4 border-[var(--cf-accent)] bg-[var(--cf-card)] px-5 py-6 ring-1 ring-[var(--cf-line)]">
          {title ? <h2 className={cn(styles.heading, "mb-5 [overflow-wrap:anywhere]")}>{title}</h2> : null}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="mb-4 rounded-xl bg-[var(--cf-card)] px-5 py-8 ring-1 ring-[var(--cf-line)]"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[26px]")}>Inscription</h2>}
      footer={
        <footer className="mt-12 text-[13px] text-[var(--cf-ink-2)]">
          <span className="font-bold text-[var(--cf-ink)]">{event.hosts}</span> · {starts.day} {starts.month} {starts.year}
        </footer>
      }
      venuesTitle={(n) => (n > 1 ? "Accès et lieux" : "Accès")}
    />
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-3 py-3.5">
      <p className={cn(caps, "text-[10px] text-[var(--cf-ink-2)]")}>{label}</p>
      <p className="mt-1 text-[14px] font-bold leading-snug [font-family:var(--inv-manrope)]">{children}</p>
    </div>
  );
}
