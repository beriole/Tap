import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, monogram, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { Grain, PAPER_SHADOW, PAPER_SHADOW_DARK, ageOf, cityOf, inWords } from "../../stationery";
import { cormorant } from "../fonts";

/**
 * ELEGANT - le carton grave.
 *
 * Le parti pris : une vraie piece de papeterie. Un carton ivoire (ou
 * anthracite) pose sur une table, encadre d un double filet, compose au
 * centre comme chez un graveur : l age en chiffre italique dore, le prenom en
 * garalde de titrage, la date en cartouche (jour de la semaine | quantieme |
 * mois) entre deux filets. Un seul ornement, un losange.
 *
 * La suite de la page deroule les encarts de la meme papeterie : un tirage
 * photo sous passe-partout, puis une carte par rubrique, puis la
 * carte-reponse. Cormorant Garamond pour le titrage, Geist pour le courant.
 */

type Palette = { table: string; paper: string; ink: string; ink2: string; line: string; foil: string; foilHi: string };

const VARIANTS: Record<string, Omit<Palette, "foil" | "foilHi">> = {
  lin: { table: "#E4DDCF", paper: "#FBF8F2", ink: "#1F1D1A", ink2: "#57524A", line: "#E0D8C9" },
  anthracite: { table: "#111113", paper: "#1D1D21", ink: "#F2EEE6", ink2: "#A8A49B", line: "#34343A" },
};

/** [dore, reflet] par variante : le chiffre est un degrade, comme une dorure a chaud. */
const ACCENTS: Record<string, { lin: [string, string]; anthracite: [string, string] }> = {
  noir: { lin: ["#1F1D1A", "#5A554C"], anthracite: ["#E9E3D6", "#FFFFFF"] },
  bronze: { lin: ["#86653A", "#C29B62"], anthracite: ["#C9A56C", "#F1DDB3"] },
  bordeaux: { lin: ["#7A2E3B", "#B0566A"], anthracite: ["#D596A2", "#F4CDD4"] },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "lin") as "lin" | "anthracite";
  const [foil, foilHi] = (ACCENTS[accent] ?? ACCENTS.bronze!)[v];
  return { ...VARIANTS[v]!, foil, foilHi };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Ont la joie de vous convier à leur mariage",
  BIRTHDAY: "Vous êtes convié à fêter",
  CORPORATE: "Vous êtes convié par",
  MEMORIAL: "À la mémoire de",
  OTHER: "Vous êtes convié par",
};

const caps = "text-[10.5px] font-medium uppercase tracking-[0.32em]";
const serif = "[font-family:var(--inv-cormorant)]";
const foilText = "bg-[linear-gradient(135deg,var(--el-foil)_0%,var(--el-foil-hi)_45%,var(--el-foil)_70%)] bg-clip-text text-transparent";

const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--el-ink)] px-6 text-[12px] font-medium uppercase tracking-[0.26em] text-[var(--el-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--el-ink)]";

const styles: SectionStyles = {
  heading: cn(caps, "text-[var(--el-foil)]"),
  body: "text-[15.5px] leading-relaxed text-[var(--el-ink)]",
  muted: "text-[14.5px] leading-relaxed text-[var(--el-ink-2)]",
  label: cn(caps, "text-[10px] text-[var(--el-ink-2)]"),
  rule: "divide-[var(--el-line)] border-[var(--el-line)]",
  emphasis: cn(serif, "text-[23px] font-medium leading-[1.2]"),
  link: "border-b border-[var(--el-ink)] pb-0.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors hover:text-[var(--el-foil)]",
};

/** Losange entre deux filets : le seul ornement du carton. */
function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-3", className)}>
      <span className="h-px w-10 bg-[var(--el-foil)] opacity-50" />
      <span className="size-[5px] rotate-45 bg-[var(--el-foil)]" />
      <span className="h-px w-10 bg-[var(--el-foil)] opacity-50" />
    </div>
  );
}

export function Elegant({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "anthracite";
  const age = event.type === "BIRTHDAY" ? ageOf(view) : null;
  const venue = venues[0];
  const city = cityOf(view);
  const shadow = dark ? PAPER_SHADOW_DARK : PAPER_SHADOW;
  const insert = cn("relative rounded-[3px] bg-[var(--el-paper)] px-6 py-9", shadow);

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(cormorant.variable, "bg-[var(--el-table)] text-[var(--el-ink)]")}
      vars={{
        "--el-table": p.table, "--el-paper": p.paper, "--el-bg": p.paper, "--el-ink": p.ink, "--el-ink-2": p.ink2,
        "--el-line": p.line, "--el-foil": p.foil, "--el-foil-hi": p.foilHi, "--el-accent": p.foil,
      }}
      envelope={{
        "--env-bg": p.table, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#2A2A2F" : "#EDE6D8", "--env-fold": dark ? "#25252A" : "#E6DECD", "--env-flap": dark ? "#303036" : "#DDD3BF", "--env-edge": dark ? "#45454C" : "#C7BBA3",
        "--env-card": "#FBF8F2", "--env-card-ink": "#1F1D1A", "--env-liner": p.foil, "--env-seal": p.foil, "--env-seal-ink": p.paper, "--env-font": "var(--inv-cormorant)",
      }}
      rsvp={{ "--rsvp-bg": p.paper, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.foil, "--rsvp-error": dark ? "#F0A39C" : "#A8342D", "--rsvp-font": "var(--inv-cormorant)" }}
      styles={styles}
      button={button}
      heroCtaId="el-hero-cta"
      containerClassName="px-4 pt-[max(18px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--el-table)_88%,transparent)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-18px)] flex-col items-center justify-center gap-5 pb-6">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          {dear && (
            <p className={cn(serif, "pc-fade text-[17px] italic text-[var(--el-ink-2)]")} style={delay(0)}>
              Pour {dear}
            </p>
          )}

          {/* Le carton */}
          <div className={cn("pc-lift relative w-full max-w-[400px] rounded-[3px] bg-[var(--el-paper)] px-7 pb-8 pt-9 text-center", shadow)} style={delay(60)}>
            <Grain opacity={dark ? 0.05 : 0.09} />
            <span aria-hidden className="pointer-events-none absolute inset-[9px] border border-[var(--el-foil)] opacity-40" />
            <span aria-hidden className="pointer-events-none absolute inset-[13px] border border-[var(--el-foil)] opacity-20" />

            <div className="relative">
              {event.updatedNote && <p className={cn(caps, "mb-4 text-[9.5px] text-[var(--el-foil)]")}>{event.updatedNote}</p>}
              <p className={cn(caps, "mx-auto max-w-[260px] leading-[1.9] text-[var(--el-ink-2)]")}>{EYEBROW[event.type]}</p>

              {age !== null ? (
                <>
                  <p aria-hidden className={cn(serif, foilText, "mt-1 text-[clamp(84px,25vw,116px)] font-medium italic leading-[1.05] tracking-[-0.02em]")}>
                    {age}
                  </p>
                  <h1 className={serif}>
                    <span className="block text-[19px] italic leading-none text-[var(--el-ink-2)]">
                      les {inWords(age)} ans de
                    </span>
                    <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(40px,12vw,50px)]", "text-[clamp(34px,10vw,42px)]", "text-[clamp(28px,8vw,34px)]", "text-[clamp(24px,6.6vw,28px)]"])} lineClassName="mt-1 font-medium leading-[1.05] tracking-[-0.01em]" separator={<span className="block text-[20px] italic text-[var(--el-foil)]">&amp;</span>} />
                  </h1>
                </>
              ) : (
                <h1 className={cn(serif, "mt-5")}>
                  <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(50px,15vw,62px)]", "text-[clamp(40px,12vw,50px)]", "text-[clamp(32px,9vw,40px)]", "text-[clamp(26px,7vw,30px)]"])} lineClassName="font-medium leading-[1.02] tracking-[-0.01em]" separator={<span className={cn(foilText, "block py-1 text-[34px] italic leading-none")}>&amp;</span>} />
                </h1>
              )}

              <Ornament className="my-6" />

              {/* Cartouche de date */}
              <div aria-hidden className="mx-auto grid max-w-[300px] grid-cols-[1fr_auto_1fr] items-center">
                <span className={cn(caps, "border-y border-[var(--el-line)] py-2 text-[10px]")}>{starts.weekday}</span>
                <span className={cn(serif, "px-4 text-[46px] font-medium leading-none")}>{starts.day}</span>
                <span className={cn(caps, "border-y border-[var(--el-line)] py-2 text-[10px]")}>{starts.month}</span>
              </div>
              <p aria-hidden className={cn(caps, "mt-3 text-[10px] text-[var(--el-ink-2)]")}>
                {starts.year} · {starts.time}
              </p>

              {venue && (
                <p className="mt-6">
                  <span className={cn(serif, "block text-[19px] italic leading-snug [overflow-wrap:anywhere]")}>{venue.name}</span>
                  {city && <span className={cn(caps, "mt-1.5 block text-[9.5px] text-[var(--el-ink-2)]")}>{city}</span>}
                </p>
              )}
            </div>
          </div>

          <div className="pc-fade w-full max-w-[400px] text-center" style={delay(360)}>
            <HeroCta view={view} id="el-hero-cta" button={button} noteClassName="text-[var(--el-ink-2)]" />
            {theme.settings.countdown && event.daysLeft !== null && (
              <p className={cn(caps, "mt-2 text-[9.5px] text-[var(--el-ink-2)]")}>{countdownText(event.daysLeft)}</p>
            )}
          </div>
        </header>
      }
      photo={
        <figure className="pc-inview mx-auto mb-5 mt-4 max-w-[400px]">
          <div className={cn("rounded-[3px] bg-[var(--el-paper)] p-3 pb-4", shadow)}>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--el-line)]">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 92vw, 380px" className="object-cover" />
            </div>
            <figcaption className={cn(serif, "mt-3 text-center text-[16px] italic text-[var(--el-ink-2)]")}>{event.hosts}</figcaption>
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className={cn("pc-inview mx-auto mb-5 max-w-[400px]", insert)}>
          <Grain opacity={dark ? 0.04 : 0.07} />
          <div className="relative">
            {title && <h2 className={cn(serif, "mb-2 text-center text-[29px] font-medium italic leading-tight [overflow-wrap:anywhere]")}>{title}</h2>}
            <Ornament className="mb-8" />
            {children}
          </div>
        </section>
      )}
      venuesTitle={(n) => (n > 1 ? "Les lieux" : "Le lieu")}
      rsvpWrapperClassName={cn("pc-inview mx-auto max-w-[400px]", insert)}
      rsvpTitle={
        <div className="text-center">
          <p className={cn(caps, "text-[var(--el-foil)]")}>R.s.v.p.</p>
          <h2 className={cn(serif, "mt-2 text-[31px] font-medium italic leading-tight")}>Votre réponse</h2>
          <Ornament className="mt-4" />
        </div>
      }
      footer={
        <footer className="mt-14 flex flex-col items-center gap-3 text-center">
          <span aria-hidden className={cn(serif, foilText, "flex size-14 items-center justify-center rounded-full border border-[var(--el-foil)]/40 text-[22px] italic")}>{monogram(view)}</span>
          <span className={cn(caps, "text-[9.5px] text-[var(--el-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </span>
        </footer>
      }
    />
  );
}
