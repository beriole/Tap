import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { EYEBROW_BY_TYPE, HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { cormorant, manrope } from "../fonts";

/**
 * MODERN GLASS - cinematique.
 *
 * Le parti pris : un film, pas une page. Le premier ecran est la photographie
 * du couple en plein ecran, qui derive lentement (parallaxe au defilement) ;
 * les noms sont poses dans le degrade du bas, comme un titre de generique -
 * garalde legere, tres grande, blanche - au-dessus d une ligne de date en
 * capitales espacees. Aucun panneau : le verre d autrefois etait une carte
 * posee sur une image, ce qui revenait a cacher l image.
 *
 * Le recit continue en chapitres : le mot des maries est une SCENE - la meme
 * photographie, assombrie, le texte en blanc dessus - puis les rubriques
 * s ouvrent sur un fond uni, sans cadre, separees par des filets.
 *
 * Le flou d arriere-plan (backdrop-filter) coute cher : il ne sert qu au
 * bouton colle en bas. Manrope pour le courant, Cormorant pour le titrage.
 */

type Palette = { bg: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "ink" | "ink2" | "line">> = {
  clair: { bg: "#F3F2EF", ink: "#1B1F26", ink2: "#5B6270", line: "#DFDDD8" },
  sombre: { bg: "#111318", ink: "#F2F4F7", ink2: "#A5ACB8", line: "#272B33" },
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

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Il y a une date que nous n’oublierons jamais. Nous aimerions qu’elle soit aussi la vôtre.",
  BIRTHDAY: "Une soirée qu’on racontera longtemps. Venez la vivre avec nous.",
  CORPORATE: "Nous serions honorés de vous compter parmi nos invités.",
  MEMORIAL: "Votre présence nous accompagne.",
  OTHER: "Nous serions heureux de vous compter parmi nous.",
};

const serif = "[font-family:var(--inv-cormorant)]";
const sans = "[font-family:var(--inv-manrope)]";
const caps = cn(sans, "text-[10.5px] font-bold uppercase tracking-[0.32em]");

const button = cn(
  sans,
  "flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--mgl-accent)] px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--mgl-on-accent)] transition-[transform,opacity] duration-150 hover:opacity-92 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mgl-accent)]",
);

const styles: SectionStyles = {
  heading: cn(serif, "text-[34px] font-normal leading-[1.05]"),
  body: "text-[16px] leading-relaxed text-[var(--mgl-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--mgl-ink-2)]",
  label: cn(caps, "text-[var(--mgl-ink-2)]"),
  rule: "divide-[var(--mgl-line)] border-[var(--mgl-line)]",
  emphasis: cn(serif, "text-[24px] font-medium leading-[1.2]"),
  link: cn(sans, "border-b border-[var(--mgl-ink)] pb-0.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"),
};

export function ModernGlass({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const dark = theme.settings.variant === "sombre";
  const photo = event.heroImageUrl;

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark={dark}
      mainClassName={cn(manrope.variable, cormorant.variable, "bg-[var(--mgl-bg)] text-[var(--mgl-ink)]")}
      vars={{ "--mgl-bg": p.bg, "--mgl-ink": p.ink, "--mgl-ink-2": p.ink2, "--mgl-line": p.line, "--mgl-accent": p.accent, "--mgl-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": dark ? "#0C0E12" : "#E9E7E2", "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": dark ? "#262B33" : "#DFDDD7", "--env-fold": dark ? "#20242B" : "#D6D3CC", "--env-flap": dark ? "#2E343D" : "#CDCAC2", "--env-edge": dark ? "#3E4550" : "#B5B1A8",
        "--env-card": "#FFFFFF", "--env-card-ink": "#1B1F26", "--env-liner": p.accent, "--env-seal": dark ? p.accent : "#1B1F26", "--env-seal-ink": dark ? p.onAccent : "#FFFFFF", "--env-font": "var(--inv-cormorant)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.ink, "--rsvp-accent": p.ink2, "--rsvp-error": dark ? "#F0A39C" : "#B3261E", "--rsvp-font": "var(--inv-cormorant)" }}
      styles={styles}
      button={button}
      heroCtaId="mgl-hero-cta"
      containerClassName="px-6"
      dockClassName="bg-[color-mix(in_srgb,var(--mgl-bg)_80%,transparent)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
      sectionAlign="left"
      rsvpAlign="left"
      hero={
        <header className="relative -mx-6 flex min-h-[100svh] flex-col justify-end overflow-hidden text-white">
          {/* Fond : la photographie, qui derive ; sinon une lumiere douce. */}
          {photo ? (
            <div className="pc-parallax absolute inset-0">
              <Image src={photo} alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
          ) : (
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 30% 20%, #3A4250 0%, #14171C 70%)" }} />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

          {dear && (
            <p className={cn(caps, "pc-fade absolute left-6 top-[max(18px,env(safe-area-inset-top))] text-[9.5px] text-white/85")} style={delay(0)}>
              Pour {dear}
            </p>
          )}

          <div className="relative px-6 pb-[max(24px,env(safe-area-inset-bottom))] text-center [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
            {event.updatedNote && <p className={cn(caps, "pc-fade mb-4 text-[9.5px] text-white/85")}>{event.updatedNote}</p>}
            <p className={cn(caps, "pc-fade text-white/85")} style={delay(80)}>
              {EYEBROW_BY_TYPE[event.type]}
            </p>
            <h1 className={cn(serif, "mt-5 font-normal tracking-[-0.01em]")}>
              <HostNames
                view={view}
                sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(66px,20vw,90px)]", "text-[clamp(52px,15.5vw,70px)]", "text-[clamp(40px,11.5vw,52px)]", "text-[clamp(30px,8.5vw,38px)]"])}
                lineClassName="leading-[0.9]"
                separator={<span className="block text-[clamp(26px,7vw,34px)] italic leading-[1.3] text-white/85">&amp;</span>}
              />
            </h1>
            <p className="sr-only">
              {starts.long}, {starts.time}
            </p>
            <p aria-hidden className={cn(caps, "pc-fade mt-6 text-[11px] tracking-[0.4em]")} style={delay(300)}>
              {starts.day} · {starts.month} · {starts.year}
            </p>
            <p aria-hidden className={cn(caps, "pc-fade mt-2 text-[9.5px] text-white/80")} style={delay(360)}>
              {starts.weekday} · {starts.time}
              {theme.settings.countdown && event.daysLeft !== null && ` · ${countdownText(event.daysLeft)}`}
            </p>
            <HeroCta view={view} id="mgl-hero-cta" button={cn(button, "[text-shadow:none]")} className="mx-auto mt-7 max-w-[300px]" noteClassName="text-white/80" />
          </div>
        </header>
      }
      welcome={WELCOME[event.type]}
      word={(text) => (
        <section className="pc-inview relative -mx-6 my-2 flex min-h-[72svh] items-center justify-center overflow-hidden px-8 py-20 text-center text-white">
          {photo ? (
            <>
              <Image src={photo} alt="" fill sizes="100vw" className="object-cover object-bottom" />
              <div aria-hidden className="absolute inset-0 bg-black/70" />
            </>
          ) : (
            <div aria-hidden className="absolute inset-0 bg-[#14171C]" />
          )}
          <div className="relative">
            <span aria-hidden className="mx-auto mb-8 block h-10 w-px bg-white/50" />
            <p className={cn(serif, "mx-auto max-w-[20rem] whitespace-pre-line text-[clamp(24px,6.8vw,30px)] italic leading-[1.4] [text-wrap:pretty]")}>{text}</p>
            <p className={cn(caps, "mt-8 text-[9.5px] text-white/70")}>{event.hosts}</p>
          </div>
        </section>
      )}
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview border-t border-[var(--mgl-line)] py-12 first-of-type:border-t-0">
          {title && <h2 className={cn(styles.heading, "mb-8 [overflow-wrap:anywhere]")}>{title}</h2>}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pc-inview border-t border-[var(--mgl-line)] pt-12"
      rsvpTitle={<h2 className={cn(styles.heading, "text-[40px] italic")}>Votre réponse</h2>}
      footer={
        <footer className="mt-20 text-center">
          <p className={cn(serif, "text-[24px] leading-none")}>{event.hostParts.join(" & ")}</p>
          <p className={cn(caps, "mt-3 text-[9.5px] text-[var(--mgl-ink-2)]")}>
            {starts.day} · {starts.month} · {starts.year}
          </p>
        </footer>
      }
    />
  );
}
