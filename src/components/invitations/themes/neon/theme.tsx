import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { ageOf, cityOf, monthNumber } from "../../stationery";
import { spaceGrotesk } from "../fonts";

/**
 * NEON - l enseigne et le flyer.
 *
 * Le parti pris : un flyer de club, sobre. Sur un carton noir mat, l age est
 * dessine en tube - un chiffre au trait, lumineux - et le prenom est la seule
 * ligne vraiment allumee : coeur blanc, halo de couleur, comme un vrai neon.
 * L enseigne s allume une fois a l arrivee (un court gresillement) puis reste
 * fixe.
 *
 * En pied de flyer, les informations en colonnes etiquetees, comme sur un
 * billet : date, heure, lieu. Tout le reste est gris, pour que la lumiere
 * reste rare.
 */

type Palette = { table: string; card: string; ink: string; ink2: string; line: string; glow: string; onGlow: string };

const VARIANTS: Record<string, Pick<Palette, "table" | "card" | "ink" | "ink2" | "line">> = {
  noir: { table: "#060609", card: "#0F0F15", ink: "#F3F3F7", ink2: "#9A9AAB", line: "#23232E" },
  marine: { table: "#050A17", card: "#0B1326", ink: "#F1F4FA", ink2: "#95A0B8", line: "#1C2640" },
};

const ACCENTS: Record<string, { glow: string; onGlow: string }> = {
  cyan: { glow: "#3DF2E0", onGlow: "#04211E" },
  magenta: { glow: "#FF4FD8", onGlow: "#2A0322" },
  lime: { glow: "#C6FF4A", onGlow: "#1A2400" },
};

function palette(variant: string, accent: string): Palette {
  return { ...(VARIANTS[variant] ?? VARIANTS.noir!), ...(ACCENTS[accent] ?? ACCENTS.cyan!) };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Soirée de mariage",
  BIRTHDAY: "Soirée d’anniversaire",
  CORPORATE: "Soirée privée",
  MEMORIAL: "En mémoire",
  OTHER: "Soirée privée",
};

const space = "[font-family:var(--inv-space)]";
const caps = cn(space, "text-[10.5px] font-medium uppercase tracking-[0.28em]");
/** Tube : coeur presque blanc, halo en trois couches de la couleur choisie. */
const tube =
  "text-[color-mix(in_srgb,var(--ne-glow)_35%,white)] [text-shadow:0_0_2px_color-mix(in_srgb,var(--ne-glow)_60%,white),0_0_10px_var(--ne-glow),0_0_28px_color-mix(in_srgb,var(--ne-glow)_70%,transparent),0_0_60px_color-mix(in_srgb,var(--ne-glow)_40%,transparent)]";

const button = cn(
  space,
  "flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--ne-glow)] px-6 text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--ne-on-glow)] shadow-[0_0_28px_-4px_var(--ne-glow)] transition-[transform,box-shadow] duration-150 hover:shadow-[0_0_40px_-2px_var(--ne-glow)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ne-glow)]",
);

const styles: SectionStyles = {
  heading: cn(space, "text-[13px] font-bold uppercase tracking-[0.24em] text-[var(--ne-glow)]"),
  body: "text-[16px] leading-relaxed text-[var(--ne-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--ne-ink-2)]",
  label: cn(caps, "text-[10px] text-[var(--ne-ink-2)]"),
  rule: "divide-[var(--ne-line)] border-[var(--ne-line)]",
  emphasis: cn(space, "text-[20px] font-medium leading-[1.2] tracking-[-0.01em]"),
  link: cn(space, "border-b border-[var(--ne-glow)] text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--ne-glow)]"),
};

export function Neon({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const age = ageOf(view);
  const venue = venues[0];
  const city = cityOf(view);
  const insert = "relative rounded-[20px] border border-[var(--ne-line)] bg-[var(--ne-card)] px-6 py-8";

  const ticket = [
    { k: "Date", v: `${starts.day}.${monthNumber(starts.month)}.${starts.year.slice(2)}` },
    { k: "Heure", v: starts.time.replace(" h ", ":") },
    (city ?? venue?.name) ? { k: "Lieu", v: (city ?? venue?.name)! } : null,
  ].filter((t): t is { k: string; v: string } => t !== null);

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      dark
      mainClassName={cn(spaceGrotesk.variable, "bg-[var(--ne-table)] text-[var(--ne-ink)]")}
      vars={{ "--ne-table": p.table, "--ne-bg": p.table, "--ne-card": p.card, "--ne-ink": p.ink, "--ne-ink-2": p.ink2, "--ne-line": p.line, "--ne-glow": p.glow, "--ne-on-glow": p.onGlow }}
      envelope={{
        "--env-bg": p.table, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#16161E", "--env-fold": "#12121A", "--env-flap": "#1B1B25", "--env-edge": "#2C2C3A",
        "--env-card": p.card, "--env-card-ink": p.ink, "--env-liner": p.glow, "--env-seal": p.glow, "--env-seal-ink": p.onGlow, "--env-font": "var(--inv-space)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.glow, "--rsvp-accent": p.glow, "--rsvp-error": "#FF8A80", "--rsvp-font": "var(--inv-space)" }}
      styles={styles}
      button={button}
      heroCtaId="ne-hero-cta"
      before={<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70svh]" style={{ background: `radial-gradient(60% 50% at 50% 30%, color-mix(in srgb, ${p.glow} 14%, transparent), transparent 70%)` }} />}
      containerClassName="relative px-4 pt-[max(16px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--ne-table)_85%,transparent)] px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-16px)] flex-col items-center justify-center gap-5 pb-6">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>
          {dear && (
            <p className={cn(caps, "pc-fade text-[var(--ne-ink-2)]")} style={delay(0)}>
              Sur la liste · {dear}
            </p>
          )}

          {/* Le flyer */}
          <div className="pc-lift relative w-full max-w-[400px] overflow-hidden rounded-[22px] border border-[var(--ne-line)] bg-[var(--ne-card)] text-center shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]" style={delay(40)}>
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "linear-gradient(transparent 0 calc(100% - 1px), rgba(255,255,255,0.035) calc(100% - 1px))", backgroundSize: "100% 22px" }} />

            <div className="relative px-6 pt-7">
              {event.updatedNote && <p className={cn(caps, "mb-3 text-[9.5px] text-[var(--ne-glow)]")}>{event.updatedNote}</p>}
              <p className={cn(caps, "text-[var(--ne-ink-2)]")}>{EYEBROW[event.type]}</p>

              <div className="[animation:inv-flicker_1.1s_linear_0.4s_both]">
                {age !== null && (
                  <p
                    aria-hidden
                    className={cn(space, "mt-2 text-[clamp(120px,38vw,160px)] font-bold leading-[1] tracking-[-0.04em] text-transparent [-webkit-text-stroke:2px_color-mix(in_srgb,var(--ne-glow)_55%,white)] [filter:drop-shadow(0_0_6px_var(--ne-glow))_drop-shadow(0_0_22px_color-mix(in_srgb,var(--ne-glow)_60%,transparent))]")}
                  >
                    {age}
                  </p>
                )}
                <h1 className={cn(space, tube, age !== null ? "-mt-1" : "mt-8", "font-medium tracking-[-0.03em]")}>
                  {age !== null && <span className="sr-only">Les {age} ans de </span>}
                  <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(48px,14vw,60px)]", "text-[clamp(38px,11vw,48px)]", "text-[clamp(30px,8.5vw,36px)]", "text-[clamp(24px,6.6vw,28px)]"])} lineClassName="leading-[1.05]" separator={<span className="block text-[22px] leading-[1.5] text-[var(--ne-ink-2)] [text-shadow:none]">&amp;</span>} />
                </h1>
              </div>
              {venue && <p className="mx-auto mt-4 max-w-[280px] text-[14px] leading-snug text-[var(--ne-ink-2)] [overflow-wrap:anywhere]">{venue.name}</p>}
            </div>

            {/* Talon : colonnes etiquetees */}
            <dl aria-hidden className={cn("relative mt-7 grid border-t", ticket.length === 3 ? "grid-cols-3" : "grid-cols-2", " border-dashed border-[var(--ne-line)]")}>
              {ticket.map((t, i) => (
                <div key={t.k} className={cn("min-w-0 px-2 py-4", i > 0 && "border-l border-[var(--ne-line)]")}>
                  <dt className={cn(caps, "text-[9px] text-[var(--ne-ink-2)]")}>{t.k}</dt>
                  <dd className={cn(space, "mt-1 truncate text-[15px] font-bold tabular-nums")}>{t.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="pc-fade w-full max-w-[400px] text-center" style={delay(320)}>
            <HeroCta view={view} id="ne-hero-cta" button={button} noteClassName="text-[var(--ne-ink-2)]" />
            {theme.settings.countdown && event.daysLeft !== null && <p className={cn(caps, "mt-1 text-[9.5px] text-[var(--ne-glow)]")}>{countdownText(event.daysLeft)}</p>}
          </div>
        </header>
      }
      photo={
        <figure className="pc-inview mx-auto mb-4 mt-4 max-w-[400px]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-[var(--ne-line)] bg-[var(--ne-card)]">
            <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 92vw, 400px" className="object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </figure>
      }
      section={({ key, title, children }) => (
        <section key={key} className={cn("pc-inview mx-auto mb-4 max-w-[400px]", insert)}>
          {title && (
            <h2 className={cn(styles.heading, "mb-6 flex items-center gap-3 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--ne-glow)] shadow-[0_0_10px_var(--ne-glow)]" />
              {title}
            </h2>
          )}
          {children}
        </section>
      )}
      sectionAlign="left"
      rsvpAlign="left"
      rsvpWrapperClassName={cn("pc-inview mx-auto max-w-[400px]", insert)}
      rsvpTitle={<h2 className={cn(space, tube, "text-[38px] font-medium leading-tight tracking-[-0.03em]")}>Tu viens&nbsp;?</h2>}
      footer={
        <footer className="mx-auto mt-14 flex max-w-[400px] items-center justify-between border-t border-[var(--ne-line)] pt-5">
          <span className={cn(space, "text-[16px] font-medium")}>{event.hostParts.join(" & ")}</span>
          <span className={cn(caps, "text-[9.5px] text-[var(--ne-ink-2)]")}>{ticket[0]!.v}</span>
        </footer>
      }
    />
  );
}
