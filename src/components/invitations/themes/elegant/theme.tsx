import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, NAME_SCALE, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { playfair } from "../fonts";

/**
 * ELEGANT - minimal chic pour adultes.
 *
 * Le parti pris : beaucoup d air, une serif (Playfair) pour le nom et un
 * seul element grand : le JOUR, en chiffre de 120 px, pose en haut du premier
 * ecran comme un numero de table. Tout le reste est petit, espace, en
 * capitales fines. Le bouton est cerne, pas plein : sur cette page, la seule
 * masse est le chiffre.
 *
 * Les sections sont alignees a gauche, titre en petites capitales sur un
 * filet, contenu en dessous.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  lin: { bg: "#F4F1EA", ink: "#1E1F22", ink2: "#66676C", line: "#DCD7CC" },
  anthracite: { bg: "#1E1F22", ink: "#F4F1EA", ink2: "#B4B2AB", line: "#3A3B40" },
};

const ACCENTS: Record<string, { lin: string; anthracite: string }> = {
  noir: { lin: "#1E1F22", anthracite: "#F4F1EA" },
  bronze: { lin: "#7A5B34", anthracite: "#D6B37E" },
  bordeaux: { lin: "#7A2E3B", anthracite: "#E39AA6" },
};

function palette(variant: string, accent: string): Palette {
  const v = (VARIANTS[variant] ? variant : "lin") as "lin" | "anthracite";
  return { ...VARIANTS[v]!, accent: (ACCENTS[accent] ?? ACCENTS.noir!)[v] };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Vous êtes convié à l’anniversaire de",
  CORPORATE: "Vous êtes convié par",
  MEMORIAL: "À la mémoire de",
  OTHER: "Vous êtes convié par",
};

const caps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const button =
  "flex min-h-[52px] w-full items-center justify-center border border-[var(--el-ink)] px-6 text-[12.5px] font-medium uppercase tracking-[0.22em] text-[var(--el-ink)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--el-ink)] hover:text-[var(--el-bg)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--el-ink)]";

const styles: SectionStyles = {
  heading: cn(caps, "text-[var(--el-accent)]"),
  body: "text-[16px] leading-relaxed text-[var(--el-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--el-ink-2)]",
  label: "text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--el-ink-2)]",
  rule: "divide-[var(--el-line)] border-[var(--el-line)]",
  emphasis: "text-[23px] leading-[1.2] [font-family:var(--inv-playfair)]",
  link: "border-b border-[var(--el-ink)] text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:text-[var(--el-accent)]",
};

export function Elegant({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "anthracite";

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(playfair.variable, "bg-[var(--el-bg)] text-[var(--el-ink)]")}
      vars={{ "--el-bg": p.bg, "--el-ink": p.ink, "--el-ink-2": p.ink2, "--el-line": p.line, "--el-accent": p.accent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#2A2B30" : "#E9E4D8", "--env-fold": dark ? "#25262B" : "#E2DCCE", "--env-flap": dark ? "#323338" : "#DBD4C4", "--env-edge": dark ? "#45464C" : "#C4BCA8",
        "--env-card": "#F4F1EA", "--env-card-ink": "#1E1F22", "--env-liner": p.line, "--env-seal": p.accent, "--env-seal-ink": p.bg, "--env-font": "var(--inv-playfair)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.accent, "--rsvp-error": dark ? "#F0A39C" : "#A8342D", "--rsvp-font": "var(--inv-playfair)" }}
      styles={styles}
      button={button}
      heroCtaId="el-hero-cta"
      containerClassName="px-7 pt-[max(20px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--el-line)] bg-[var(--el-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      hero={
        <header className="flex min-h-[calc(100svh-40px)] flex-col py-8">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          <div aria-hidden className="flex items-end justify-between border-b border-[var(--el-line)] pb-4">
            <span className="text-[clamp(96px,28vw,128px)] leading-[0.8] tracking-[-0.04em] [font-family:var(--inv-playfair)]">{starts.day}</span>
            <span className={cn(caps, "pb-1 text-right leading-[2] text-[var(--el-ink-2)]")}>
              {starts.weekday}
              <br />
              {starts.month} {starts.year}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center py-10">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-6 text-[10px] text-[var(--el-accent)]")}>{event.updatedNote}</p>}
            {dear && (
              <p className="pc-fade mb-5 text-[15px] italic text-[var(--el-ink-2)] [font-family:var(--inv-playfair)]" style={delay(0)}>
                {dear},
              </p>
            )}
            <p className={cn(caps, "pc-fade text-[var(--el-ink-2)]")} style={delay(80)}>
              {EYEBROW[event.type]}
            </p>
            <h1 className="mt-5 [font-family:var(--inv-playfair)]">
              <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), NAME_SCALE)} lineClassName="leading-[1.02]" separator={<span className="block text-[20px] italic leading-[1.8] text-[var(--el-accent)]">&amp;</span>} />
            </h1>
            <p aria-hidden className={cn(caps, "pc-fade mt-7 text-[var(--el-ink)]")} style={delay(400)}>
              {starts.time}
              {theme.settings.countdown && event.daysLeft !== null && <span className="text-[var(--el-ink-2)]"> · {countdownText(event.daysLeft)}</span>}
            </p>
          </div>
          <HeroCta view={view} id="el-hero-cta" button={button} noteClassName="text-[var(--el-ink-2)]" />
        </header>
      }
      photo={
        <figure className="pc-inview mb-16 mt-8">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--el-line)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-14">
          {title ? <h2 className={cn(styles.heading, "mb-7 border-b border-[var(--el-line)] pb-3 [overflow-wrap:anywhere]")}>{title}</h2> : <div className="mb-7 border-b border-[var(--el-line)]" />}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName="border-t border-[var(--el-line)] pt-10"
      rsvpTitle={<h2 className="text-[30px] italic leading-tight [font-family:var(--inv-playfair)]">Votre réponse</h2>}
      footer={
        <footer className="mt-20 flex items-center justify-between border-t border-[var(--el-line)] pt-5">
          <span className="text-[17px] italic [font-family:var(--inv-playfair)]">{event.hostParts.join(" & ")}</span>
          <span className={cn(caps, "text-[10px] text-[var(--el-ink-2)]")}>
            {starts.day}.{starts.month.slice(0, 3)}.{starts.year}
          </span>
        </footer>
      }
    />
  );
}
