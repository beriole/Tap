import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, ThemeShell, countdownText, delay, salutation, type SectionStyles } from "../../shared";
import { Grain } from "../../stationery";
import { cormorant } from "../fonts";

/**
 * GALA - luxe sombre, le billet en main.
 *
 * Le parti pris : le premier ecran est un BILLET, et un vrai. Deux coupons -
 * le corps et le talon - separes par une perforation, avec deux encoches
 * DECOUPEES dans le carton (un masque CSS, pas des pastilles posees
 * dessus) : on voit la nuit a travers. Le corps porte le titre en garalde de
 * titrage (Cormorant), le talon la date, le lieu et, s il existe, le nuancier
 * du dress code : la soiree se prepare des le premier regard.
 *
 * Ce n est pas un QR (il arrive apres la confirmation, page /t) : c est la
 * promesse du billet. Tout le reste de la page reprend son vocabulaire :
 * perforations verticales entre les rubriques, un coupon-reponse detachable
 * pour la confirmation. L or ne fait que des traits, des chiffres et le
 * bouton ; jamais un cadre de plus.
 */

type Palette = { bg: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string };

const VARIANTS: Record<string, Pick<Palette, "bg" | "card" | "ink" | "ink2" | "line">> = {
  noir: { bg: "#0E0C0B", card: "#1A1714", ink: "#F3EBDD", ink2: "#B5AA99", line: "#2C2723" },
  prune: { bg: "#1E1119", card: "#2A1924", ink: "#F5E9EC", ink2: "#C6B1B9", line: "#3B2531" },
};

/** [or (>= 4,5:1 sur le fond et le carton), texte sur or] */
const ACCENTS: Record<string, [string, string]> = {
  or: ["#D4B067", "#1A1407"],
  champagne: ["#E4D2A6", "#1A1407"],
  argent: ["#C9CCD3", "#111318"],
};

function palette(variant: string, accent: string): Palette {
  const [acc, onAccent] = ACCENTS[accent] ?? ACCENTS.or!;
  return { ...(VARIANTS[variant] ?? VARIANTS.noir!), accent: acc, onAccent };
}

const KIND: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Mariage",
  BIRTHDAY: "Soirée",
  CORPORATE: "Gala",
  MEMORIAL: "Hommage",
  OTHER: "Soirée",
};

const WELCOME: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Une soirée de lumière, pour célébrer ensemble le plus beau des engagements.",
  BIRTHDAY: "Une soirée de lumière, de musique et de rencontres. Il ne manque que vous.",
  CORPORATE: "Une soirée de lumière, de rencontres et d’élégance. Il ne manque que vous.",
  MEMORIAL: "Une soirée de souvenir, en toute simplicité.",
  OTHER: "Une soirée de lumière, de rencontres et d’élégance. Il ne manque que vous.",
};

const serif = "[font-family:var(--inv-cormorant)]";
const caps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const button =
  "flex min-h-[54px] w-full items-center justify-center rounded-[2px] bg-[var(--ga-accent)] px-6 text-[12.5px] font-semibold uppercase tracking-[0.24em] text-[var(--ga-on-accent)] transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ga-accent)]";

const styles: SectionStyles = {
  heading: cn(serif, "text-[34px] font-normal leading-[1.05] tracking-[-0.01em]"),
  body: "text-[16px] leading-relaxed text-[var(--ga-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ga-ink-2)]",
  label: cn(caps, "text-[10.5px] text-[var(--ga-accent)]"),
  rule: "divide-[var(--ga-line)] border-[var(--ga-line)]",
  emphasis: cn(serif, "text-[24px] font-medium leading-[1.2]"),
  link: "border-b border-[var(--ga-accent)] text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[var(--ga-accent)]",
};

/** Rayon des encoches : un demi-disque sur chaque coupon, un disque entier une fois reunis. */
const NOTCH = 13;

/** Decoupe deux demi-disques dans les coins d un coupon (haut ou bas). */
function notched(edge: "top" | "bottom"): React.CSSProperties {
  const y = edge === "top" ? "0" : "100%";
  const hole = (x: string) => `radial-gradient(circle at ${x} ${y}, transparent ${NOTCH}px, #000 ${NOTCH + 0.5}px)`;
  const mask = `${hole("0")}, ${hole("100%")}`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
}

/** Le carton : un noir a peine plus clair que la nuit, eclaire par le haut. */
const CARD: React.CSSProperties = { backgroundImage: "linear-gradient(165deg, color-mix(in srgb, var(--ga-card) 92%, white) 0%, var(--ga-card) 55%)" };

/** Perforation verticale : le vocabulaire du billet, entre les rubriques. */
function Perforation({ className }: { className?: string }) {
  return <span aria-hidden className={cn("mx-auto block h-9 w-px", className)} style={{ backgroundImage: "repeating-linear-gradient(to bottom, var(--ga-accent) 0 2px, transparent 2px 7px)" }} />;
}

export function Gala({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues, sections, guest } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const first = venues[0];
  const seats = guest?.seats ?? null;
  const dress = sections.find((s) => s.kind === "dresscode");
  const swatches = dress?.kind === "dresscode" ? dress.data.palette.slice(0, 5) : [];
  const long = event.title.length > 46;
  // Le titre nomme deja les hotes (« Mariage de A & B ») : on ne les repete pas sur le billet.
  const hostsInTitle = event.title.toLowerCase().includes(event.hosts.toLowerCase());

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark
      mainClassName={cn(cormorant.variable, "bg-[var(--ga-bg)] text-[var(--ga-ink)]")}
      vars={{ "--ga-bg": p.bg, "--ga-card": p.card, "--ga-ink": p.ink, "--ga-ink-2": p.ink2, "--ga-line": p.line, "--ga-accent": p.accent, "--ga-on-accent": p.onAccent }}
      envelope={{
        "--env-bg": p.bg, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#221D1A", "--env-fold": "#1C1815", "--env-flap": "#2B2521", "--env-edge": "#443B34",
        "--env-card": "#F3EBDD", "--env-card-ink": "#1A1407", "--env-liner": p.accent, "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-cormorant)",
      }}
      rsvp={{ "--rsvp-bg": p.bg, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#F0A39C", "--rsvp-font": "var(--inv-cormorant)" }}
      styles={styles}
      button={button}
      heroCtaId="ga-hero-cta"
      containerClassName="relative pt-[max(12px,env(safe-area-inset-top))]"
      dockClassName="border-t border-[var(--ga-line)] bg-[var(--ga-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
      before={
        // La salle dans la penombre : un halo d or tres faible au-dessus du billet.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[110svh]"
          style={{ background: "radial-gradient(90% 55% at 50% 30%, color-mix(in srgb, var(--ga-accent) 13%, transparent) 0%, transparent 70%)" }}
        />
      }
      hero={
        <header className="relative flex min-h-[calc(100svh-24px)] flex-col justify-center py-6">
          {event.updatedNote && <p className={cn(caps, "pc-fade mb-4 text-center text-[10px] text-[var(--ga-ink-2)]")}>{event.updatedNote}</p>}

          {/* Le billet : deux coupons, une perforation, deux encoches ajourees. */}
          <div className="pc-lift drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" style={delay(60)}>
            <div className="relative px-6 pb-8 pt-6 text-center" style={{ ...CARD, ...notched("bottom") }}>
              <Grain opacity={0.14} className="mix-blend-soft-light" />
              <span aria-hidden className="pointer-events-none absolute inset-x-[10px] top-[10px] bottom-0 border-x border-t border-[color-mix(in_srgb,var(--ga-accent)_42%,transparent)]" />
              <div className={cn(caps, "relative flex items-center justify-between gap-4 text-[9.5px] text-[var(--ga-accent)]")}>
                <span>{KIND[event.type]}</span>
                <span className="text-[var(--ga-ink-2)]">{seats !== null ? `Entrée · ${seats} place${seats > 1 ? "s" : ""}` : "Sur invitation"}</span>
              </div>
              <span aria-hidden className="relative mx-auto mt-6 block h-px w-10 bg-[var(--ga-accent)]" />
              {dear && (
                <p className={cn(serif, "pc-fade relative mt-5 line-clamp-1 text-[18px] italic text-[var(--ga-ink-2)]")} style={delay(200)}>
                  Pour {dear}
                </p>
              )}
              <h1
                className={cn(
                  serif,
                  "relative mt-3 font-normal leading-[1.02] tracking-[-0.015em] [overflow-wrap:anywhere] [text-wrap:balance]",
                  event.title.length > 60 ? "text-[clamp(24px,6.8vw,29px)]" : long ? "text-[clamp(27px,7.6vw,33px)]" : "text-[clamp(33px,9.6vw,42px)]",
                )}
              >
                {event.title}
              </h1>
              {!hostsInTitle && (
                <p className={cn(caps, "pc-fade relative mt-5 text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")} style={delay(320)}>
                  {event.hosts}
                </p>
              )}
            </div>

            {/* La perforation, entre les deux encoches */}
            <div aria-hidden className="relative h-0">
              <span className="absolute inset-x-[18px] top-0 border-t border-dashed border-[color-mix(in_srgb,var(--ga-accent)_70%,transparent)]" />
            </div>

            <div className="relative px-6 pb-6 pt-6 text-center" style={{ ...CARD, ...notched("top") }}>
              <Grain opacity={0.14} className="mix-blend-soft-light" />
              <span aria-hidden className="pointer-events-none absolute inset-x-[10px] bottom-[10px] top-0 border-x border-b border-[color-mix(in_srgb,var(--ga-accent)_42%,transparent)]" />
              <p className="sr-only">
                {starts.long}, {starts.time}
              </p>
              <div aria-hidden className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <span className={cn(caps, "text-right text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")}>
                  {starts.weekday}
                  <br />
                  {starts.time}
                </span>
                <span className={cn(serif, "text-[clamp(56px,16vw,70px)] font-normal leading-[0.8] text-[var(--ga-accent)] [font-variant-numeric:lining-nums]")}>{starts.day}</span>
                <span className={cn(caps, "text-left text-[10px] leading-[1.9] text-[var(--ga-ink-2)]")}>
                  {starts.month}
                  <br />
                  {starts.year}
                </span>
              </div>
              {first && <p className={cn(serif, "relative mx-auto mt-4 line-clamp-2 max-w-[280px] text-[17px] italic leading-snug text-[var(--ga-ink)]")}>{first.name}</p>}
              {(swatches.length > 0 || (theme.settings.countdown && event.daysLeft !== null)) && (
                <div className="relative mt-4 flex items-center justify-center gap-4">
                  {swatches.length > 0 && (
                    <span className="flex items-center gap-2">
                      <span className={cn(caps, "text-[9px] text-[var(--ga-ink-2)]")}>Tenue</span>
                      <span aria-hidden className="flex -space-x-1">
                        {swatches.map((c) => (
                          <span key={c} className="size-3.5 rounded-full ring-1 ring-[var(--ga-card)]" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                    </span>
                  )}
                  {theme.settings.countdown && event.daysLeft !== null && (
                    <span className={cn(caps, "pc-fade text-[9px] text-[var(--ga-accent)]")} style={delay(560)}>
                      {countdownText(event.daysLeft)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <HeroCta view={view} id="ga-hero-cta" button={button} className="pc-fade mt-7" noteClassName="text-center text-[var(--ga-ink-2)]" />
        </header>
      }
      welcome={WELCOME[event.type]}
      word={(text) => (
        <section className="pc-inview pb-16 pt-10 text-center">
          <Perforation />
          <p className={cn(serif, "mx-auto mt-8 max-w-[21rem] whitespace-pre-line text-[clamp(23px,6.6vw,27px)] italic leading-[1.35] [text-wrap:pretty]")}>{text}</p>
        </section>
      )}
      photo={
        <figure className="pc-inview relative -mx-5 mb-16">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--ga-card)]">
            <div className="pc-parallax absolute inset-0">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 100vw, 460px" className="object-cover" />
            </div>
            {/* La photo sort de la nuit et y retourne : aucun bord dur en haut ni en bas. */}
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to bottom, var(--ga-bg) 0%, transparent 22%, transparent 68%, var(--ga-bg) 100%)" }} />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className="pc-inview mb-16 text-center">
          <Perforation />
          {title ? <h2 className={cn(styles.heading, "mb-8 mt-6 leading-[1.05] [overflow-wrap:anywhere] [text-wrap:balance]")}>{title}</h2> : <div className="mb-8" />}
          {children}
        </section>
      )}
      rsvpWrapperClassName="pt-4"
      rsvpTitle={
        <>
          {/* Le coupon-reponse : on le detache du billet. */}
          <div aria-hidden className="-mx-5 mb-10 flex items-center gap-3">
            <span className="h-px flex-1 border-t border-dashed border-[color-mix(in_srgb,var(--ga-accent)_60%,transparent)]" />
            <span className={cn(caps, "text-[9.5px] text-[var(--ga-accent)]")}>Coupon-réponse</span>
            <span className="h-px flex-1 border-t border-dashed border-[color-mix(in_srgb,var(--ga-accent)_60%,transparent)]" />
          </div>
          <h2 className={cn(styles.heading, "text-[36px] leading-[1.05] [text-wrap:balance]")}>Confirmer votre présence</h2>
        </>
      }
      footer={
        <footer className="mt-20 text-center">
          <Perforation />
          <p className={cn(caps, "mt-6 text-[10px] leading-[1.9] text-[var(--ga-accent)]")}>{event.hosts}</p>
          <p className={cn(serif, "mt-2 text-[17px] italic text-[var(--ga-ink-2)]")}>
            {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
