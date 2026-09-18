import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { Grain, ageOf, cityOf, shortMonth } from "../../stationery";

/**
 * PARTY - l affiche de fete.
 *
 * Le parti pris : une affiche serigraphiee, pas une page decoree. Un aplat de
 * couleur franche, l age en chiffre geant (Bricolage Grotesque 800, tres
 * serre) qui remplit l affiche, le prenom en capitales dessous, et une bande
 * detachable en pied avec l heure et le lieu. La fete tient dans quelques
 * serpentins dessines au trait, poses une fois dans les coins - rien ne tombe
 * en boucle.
 *
 * La couleur de l affiche est l accent ; la variante (blanc / nuit) regle la
 * table et les encarts. Sans age dans le titre, c est le prenom qui devient
 * geant.
 */

type Poster = { bg: string; ink: string; ink2: string; streamers: [string, string] };
type Table = { table: string; card: string; ink: string; ink2: string; line: string };

const VARIANTS: Record<string, Table> = {
  blanc: { table: "#F4EFE5", card: "#FFFDF8", ink: "#1E1A2E", ink2: "#5F5A72", line: "#E9E3D6" },
  nuit: { table: "#15102A", card: "#211A3A", ink: "#FBF8F1", ink2: "#BDB7CF", line: "#352C54" },
};

/** Aplat, encre sur l aplat, encre secondaire, deux serpentins. Contraste texte >= 4,5:1. */
const POSTERS: Record<string, Poster> = {
  corail: { bg: "#C8412D", ink: "#FFF6EA", ink2: "#FFD9C9", streamers: ["#F4B740", "#FFF6EA"] },
  soleil: { bg: "#EDB22E", ink: "#1E1A2E", ink2: "#4A3A10", streamers: ["#C8412D", "#1E1A2E"] },
  violet: { bg: "#5A40C9", ink: "#FFF6EA", ink2: "#DCD3FF", streamers: ["#F4B740", "#FF8FA8"] },
};

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "On se marie",
  BIRTHDAY: "C’est la fête",
  CORPORATE: "Soirée",
  MEMORIAL: "En souvenir",
  OTHER: "C’est la fête",
};

const grotesk = "[font-family:var(--app-font-grotesk)]";

const styles: SectionStyles = {
  heading: cn(grotesk, "text-[28px] font-extrabold uppercase leading-none tracking-[-0.02em]"),
  body: "text-[16px] leading-relaxed text-[var(--pa-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--pa-ink-2)]",
  label: "text-[11.5px] font-bold uppercase tracking-[0.14em] text-[var(--pa-ink-2)]",
  rule: "divide-[var(--pa-line)] border-[var(--pa-line)]",
  emphasis: cn(grotesk, "text-[20px] font-bold leading-[1.2] tracking-[-0.01em]"),
  link: "border-b-2 border-[var(--pa-poster)] text-[13px] font-bold transition-opacity hover:opacity-70",
};

/**
 * Serpentins : poses sur la table, AUTOUR de l affiche, comme apres la fete.
 * Ils depassent des bords sans jamais passer sur un texte, quelle que soit la
 * longueur des noms. Courbes dessinees une fois pour toutes.
 */
function Streamers({ colors }: { colors: [string, string] }) {
  const [a, b] = colors;
  return (
    <svg aria-hidden viewBox="0 0 440 560" preserveAspectRatio="none" className="pc-fade pointer-events-none absolute -inset-x-5 -inset-y-6 h-[calc(100%+48px)] w-[calc(100%+40px)]" style={delay(300)} fill="none" strokeLinecap="round">
      <path d="M330 30 C 350 -4, 392 20, 380 48 S 420 86, 438 60" stroke={a} strokeWidth="5" />
      <path d="M404 96 C 426 110, 414 136, 436 150" stroke={b} strokeWidth="4" />
      <circle cx="412" cy="22" r="5" fill={b} />
      <circle cx="20" cy="470" r="5" fill={a} />
      <path d="M2 380 C 24 392, 8 424, 26 440 S 4 488, 30 506" stroke={b} strokeWidth="4" />
      <path d="M60 540 C 80 520, 110 556, 134 534" stroke={a} strokeWidth="5" />
      <rect x="8" y="330" width="7" height="14" rx="2" fill={a} transform="rotate(-25 11 337)" />
      <rect x="424" y="420" width="7" height="14" rx="2" fill={b} transform="rotate(30 427 427)" />
    </svg>
  );
}

export function Party({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const t = VARIANTS[theme.settings.variant] ?? VARIANTS.blanc!;
  const poster = POSTERS[theme.settings.accent] ?? POSTERS.corail!;
  const dark = theme.settings.variant === "nuit";
  const dear = salutation(view);
  const { starts } = event;
  const age = ageOf(view);
  const venue = venues[0];
  const city = cityOf(view);
  // Bouton : l encre de la table, jamais l aplat - l affiche reste la seule masse de couleur.
  const button = cn(
    grotesk,
    "flex min-h-[56px] w-full items-center justify-center rounded-full bg-[var(--pa-ink)] px-6 text-[16px] font-bold tracking-[-0.01em] text-[var(--pa-table)] transition-transform duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pa-ink)]",
  );
  const insert = "relative rounded-[24px] bg-[var(--pa-card)] px-6 py-8";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName="bg-[var(--pa-table)] text-[var(--pa-ink)]"
      vars={{
        "--pa-table": t.table, "--pa-bg": t.table, "--pa-card": t.card, "--pa-ink": t.ink, "--pa-ink-2": t.ink2, "--pa-line": t.line,
        "--pa-poster": poster.bg, "--pa-poster-ink": poster.ink, "--pa-poster-ink-2": poster.ink2, "--pa-accent": poster.bg,
      }}
      envelope={{
        "--env-bg": t.table, "--env-ink": t.ink, "--env-ink-2": t.ink2, "--env-line": t.line,
        "--env-paper": dark ? "#2A2245" : "#EFE8DA", "--env-fold": dark ? "#241D3D" : "#E8E0D0", "--env-flap": dark ? "#342B52" : "#E0D7C4", "--env-edge": dark ? "#4A3F6E" : "#CFC6B2",
        "--env-card": poster.bg, "--env-card-ink": poster.ink, "--env-liner": poster.streamers[0], "--env-seal": poster.bg, "--env-seal-ink": poster.ink, "--env-font": "var(--app-font-grotesk)",
      }}
      rsvp={{ "--rsvp-bg": t.card, "--rsvp-ink": t.ink, "--rsvp-ink-2": t.ink2, "--rsvp-line": t.line, "--rsvp-rule": t.ink, "--rsvp-accent": dark ? poster.streamers[0] : poster.bg, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--app-font-grotesk)" }}
      styles={styles}
      button={button}
      heroCtaId="pa-hero-cta"
      containerClassName="px-4 pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--pa-table)_88%,transparent)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-16px)] flex-col items-center justify-center gap-4 pb-6">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          {dear && (
            <p className={cn(grotesk, "pc-fade w-full max-w-[400px] text-[15px] font-semibold text-[var(--pa-ink-2)]")} style={delay(0)}>
              {dear}, on compte sur vous&nbsp;!
            </p>
          )}

          {/* L affiche */}
          <div className="relative w-full max-w-[400px]">
          <Streamers colors={poster.streamers} />
          <div className="pc-lift relative overflow-hidden rounded-[10px] bg-[var(--pa-poster)] text-[var(--pa-poster-ink)] shadow-[0_30px_60px_-30px_rgba(30,20,50,0.55)]" style={delay(40)}>
            <Grain opacity={0.14} />

            <div className={cn(grotesk, "relative px-6 pt-5")}>
              <div className="flex items-baseline justify-between border-b-2 border-current pb-3 text-[13px] font-extrabold uppercase tracking-[0.08em]">
                <span>{EYEBROW[event.type]}</span>
                <span aria-hidden className="tabular-nums">
                  {starts.day} {shortMonth(starts.month)}
                </span>
              </div>
              {event.updatedNote && <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pa-poster-ink-2)]">{event.updatedNote}</p>}

              {age !== null ? (
                <>
                  <p aria-hidden className="pc-rise -ml-1 mt-1 text-[clamp(170px,52vw,224px)] font-extrabold leading-[0.86] tracking-[-0.07em]" style={delay(120)}>
                    {age}
                  </p>
                  <h1 className="pc-rise pb-1 font-extrabold uppercase tracking-[-0.035em]" style={delay(200)}>
                    <span className="sr-only">Les {age} ans de </span>
                    <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(48px,14vw,60px)]", "text-[clamp(38px,11vw,48px)]", "text-[clamp(30px,8.5vw,36px)]", "text-[clamp(25px,6.8vw,30px)]"])} lineClassName="leading-[0.92]" separator={<span className="block text-[26px] leading-[1.3] text-[var(--pa-poster-ink-2)]">&amp;</span>} />
                  </h1>
                  <p className="mt-2 text-[15px] font-semibold text-[var(--pa-poster-ink-2)]">fête ses {age} ans</p>
                </>
              ) : (
                <h1 className="pc-rise mt-8 pb-2 font-extrabold uppercase tracking-[-0.045em]" style={delay(120)}>
                  <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(72px,21vw,92px)]", "text-[clamp(54px,16vw,70px)]", "text-[clamp(38px,11vw,48px)]", "text-[clamp(28px,7.5vw,34px)]"])} lineClassName="leading-[0.88]" separator={<span className="block text-[30px] leading-[1.3] text-[var(--pa-poster-ink-2)]">&amp;</span>} />
                </h1>
              )}
            </div>

            {/* Bande detachable */}
            <div aria-hidden className={cn(grotesk, "relative mt-6 grid grid-cols-[auto_1fr] gap-x-5 border-t-2 border-dashed border-current/60 px-6 py-4")}>
              <span className="text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{starts.time.replace(" h ", ":")}</span>
              <span className="min-w-0 self-center text-[13px] font-bold leading-snug">
                <span className="block truncate first-letter:uppercase">{venue?.name ?? starts.long}</span>
                {venue && <span className="block truncate text-[var(--pa-poster-ink-2)]">{city ?? starts.long}</span>}
              </span>
            </div>
          </div>
          </div>

          <div className="pc-fade w-full max-w-[400px] text-center" style={delay(320)}>
            <HeroCta view={view} id="pa-hero-cta" button={button} noteClassName="font-medium text-[var(--pa-ink-2)]" />
            {theme.settings.countdown && event.daysLeft !== null && <p className={cn(grotesk, "mt-1 text-[13px] font-bold text-[var(--pa-ink)]")}>{countdownText(event.daysLeft)} !</p>}
          </div>
        </header>
      }
      photo={
        <figure className="pc-inview mx-auto mb-4 mt-4 max-w-[400px]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] bg-[var(--pa-line)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 92vw, 400px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className={cn("pc-inview mx-auto mb-4 max-w-[400px]", insert)}>
          {title && (
            <h2 className={cn(styles.heading, "mb-6 flex items-center gap-3 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="size-3 shrink-0 rounded-full bg-[var(--pa-poster)]" />
              {title}
            </h2>
          )}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName={cn("pc-inview mx-auto max-w-[400px] border-t-[10px] border-[var(--pa-poster)]", insert)}
      rsvpTitle={<h2 className={cn(grotesk, "text-[40px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]")}>Tu viens&nbsp;?</h2>}
      footer={
        <footer className={cn(grotesk, "mx-auto mt-14 flex max-w-[400px] items-end justify-between border-t-2 border-[var(--pa-ink)] pt-4")}>
          <span className="text-[22px] font-extrabold uppercase leading-none tracking-[-0.03em]">{event.hostParts.join(" & ")}</span>
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--pa-ink-2)]">
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </span>
        </footer>
      }
    />
  );
}
