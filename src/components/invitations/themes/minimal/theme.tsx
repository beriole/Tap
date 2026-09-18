import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { ageOf, cityOf, monthNumber } from "../../stationery";

/**
 * MINIMAL - la grille.
 *
 * Le parti pris : un carton compose comme une affiche suisse. La photo
 * occupe le haut du carton a fond perdu ; dessous, le prenom en Geist tres
 * serre, l age dans la couleur d accent, puis une grille de quatre cases
 * etiquetees (date, heure, lieu, ville) separees par des filets fins. Aucune
 * decoration : l alignement fait tout le travail.
 *
 * Sans photo, le haut du carton devient un aplat d accent qui porte la date
 * en grands chiffres - le carton ne parait jamais vide.
 */

type Palette = { table: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "table" | "card" | "ink" | "ink2" | "line">> = {
  blanc: { table: "#EAEAE6", card: "#FFFFFF", ink: "#101010", ink2: "#5F5F5F", line: "#E4E4E0" },
  noir: { table: "#050505", card: "#151515", ink: "#F5F5F5", ink2: "#A5A5A5", line: "#2A2A2A" },
};

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

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Anniversaire",
  CORPORATE: "Invitation",
  MEMORIAL: "Hommage",
  OTHER: "Invitation",
};

const label = "text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--mi-ink-2)]";

const button =
  "flex min-h-[54px] w-full items-center justify-center bg-[var(--mi-accent)] px-5 text-[15px] font-medium text-[var(--mi-on-accent)] transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mi-accent)]";

const styles: SectionStyles = {
  heading: "text-[22px] font-semibold leading-tight tracking-[-0.03em]",
  body: "text-[16px] leading-relaxed text-[var(--mi-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mi-ink-2)]",
  label,
  rule: "divide-[var(--mi-line)] border-[var(--mi-line)]",
  emphasis: "text-[19px] font-medium leading-[1.25] tracking-[-0.02em]",
  link: "border-b border-[var(--mi-ink)] text-[13px] font-medium transition-colors hover:text-[var(--mi-accent)]",
};

export function Minimal({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "noir";
  const age = event.type === "BIRTHDAY" || event.type === "OTHER" ? ageOf(view) : null;
  const venue = venues[0];
  const city = cityOf(view);
  const insert = "relative bg-[var(--mi-card)] px-6 py-8";

  const cells = [
    { k: "Date", v: `${starts.weekday} ${starts.day} ${starts.month}` },
    { k: "Heure", v: starts.time },
    venue && { k: "Lieu", v: venue.name },
    city && { k: "Ville", v: city },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName="bg-[var(--mi-table)] text-[var(--mi-ink)]"
      vars={{ "--mi-table": p.table, "--mi-bg": p.card, "--mi-card": p.card, "--mi-ink": p.ink, "--mi-ink-2": p.ink2, "--mi-line": p.line, "--mi-accent": p.accent, "--mi-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.table, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#1E1E1E" : "#F4F4F2", "--env-fold": dark ? "#1A1A1A" : "#EEEEEB", "--env-flap": dark ? "#232323" : "#E7E7E3", "--env-edge": dark ? "#353535" : "#D2D2CC",
        "--env-card": p.card, "--env-card-ink": p.ink, "--env-liner": p.line, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--app-font-sans)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--app-font-sans)" }}
      styles={styles}
      button={button}
      heroCtaId="mi-hero-cta"
      containerClassName="px-4 pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--mi-table)_88%,transparent)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-16px)] flex-col items-center justify-center gap-4 pb-6">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>

          {/* Le carton */}
          <div className="pc-lift w-full max-w-[400px] bg-[var(--mi-card)] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_30px_60px_-36px_rgba(0,0,0,0.45)]" style={delay(40)}>
            {event.heroImageUrl ? (
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-[var(--mi-line)]">
                <Image src={event.heroImageUrl} alt={event.hosts} fill priority sizes="(max-width: 460px) 92vw, 400px" className="object-cover" />
              </div>
            ) : (
              <div aria-hidden className="flex aspect-[16/9] w-full items-end justify-between bg-[var(--mi-accent)] p-5 text-[var(--mi-on-accent)]">
                <span className="text-[clamp(64px,20vw,88px)] font-semibold leading-[0.8] tracking-[-0.06em] tabular-nums">
                  {starts.day}.{monthNumber(starts.month)}
                </span>
                <span className="text-[13px] font-medium">{starts.year}</span>
              </div>
            )}

            <div className="px-5 pb-5 pt-4">
              <div className="flex items-baseline justify-between text-[12px] font-medium">
                <span>{EYEBROW[event.type]}</span>
                {dear && <span className="truncate pl-4 text-[var(--mi-ink-2)]">Pour {dear}</span>}
              </div>
              {event.updatedNote && <p className="mt-2 text-[12px] font-medium text-[var(--mi-accent)]">{event.updatedNote}</p>}

              <h1 className="pc-rise mt-5 font-semibold tracking-[-0.05em]" style={delay(120)}>
                <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(52px,15.5vw,66px)]", "text-[clamp(40px,12vw,52px)]", "text-[clamp(31px,9vw,40px)]", "text-[clamp(25px,6.8vw,30px)]"])} lineClassName="leading-[0.92]" separator={<span className="block text-[24px] leading-[1.4] tracking-normal text-[var(--mi-ink-2)]">&amp;</span>} />
                {age !== null && (
                  <span className="mt-1 block text-[clamp(26px,7.5vw,32px)] leading-[1.1] tracking-[-0.04em] text-[var(--mi-accent)]">a {age} ans.</span>
                )}
              </h1>

              <dl aria-hidden className="mt-6 grid grid-cols-2 border-t border-[var(--mi-line)]">
                {cells.map((c, i) => (
                  <div key={c.k} className={cn("min-w-0 border-b border-[var(--mi-line)] py-3", i % 2 === 1 && "border-l pl-4", i % 2 === 0 && "pr-3")}>
                    <dt className={label}>{c.k}</dt>
                    <dd className="mt-1 text-[15px] font-medium leading-snug tracking-[-0.01em] first-letter:uppercase [overflow-wrap:anywhere]">{c.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="pc-fade w-full max-w-[400px]" style={delay(300)}>
            <HeroCta view={view} id="mi-hero-cta" button={button} noteClassName="text-[var(--mi-ink-2)]" />
            {theme.settings.countdown && event.daysLeft !== null && <p className="mt-1 text-[12.5px] font-medium text-[var(--mi-accent)]">{countdownText(event.daysLeft)}</p>}
          </div>
        </header>
      }
      section={({ key, title, children }) => (
        <section key={key} className={cn("pc-inview mx-auto mb-3 max-w-[400px]", insert)}>
          {title && (
            <h2 className={cn(styles.heading, "mb-5 flex items-center gap-3 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="size-2.5 shrink-0 bg-[var(--mi-accent)]" />
              {title}
            </h2>
          )}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName={cn("pc-inview mx-auto max-w-[400px]", insert)}
      rsvpTitle={<h2 className="text-[34px] font-semibold leading-[1] tracking-[-0.045em]">Votre réponse</h2>}
      footer={
        <footer className="mx-auto mt-12 flex max-w-[400px] items-center justify-between text-[12px] font-medium text-[var(--mi-ink-2)]">
          <span className="text-[var(--mi-ink)]">{event.hostParts.join(" & ")}</span>
          <span className="inline-flex items-center gap-2 tabular-nums">
            {starts.day}.{monthNumber(starts.month)}.{starts.year}
            <ArrowRight aria-hidden className="size-3.5 -rotate-45" />
          </span>
        </footer>
      }
    />
  );
}
