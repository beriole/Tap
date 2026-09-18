import Image from "next/image";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationView, RsvpFormData } from "@/types/invitation";
import { HeroCta, HostNames, ThemeShell, countdownText, delay, longestHost, nameSizeClass, salutation, type SectionStyles } from "../../shared";
import { ageOf } from "../../stationery";
import { fredoka } from "../fonts";

/**
 * KIDS - la carte a gommettes.
 *
 * Le parti pris : l objet qu un enfant rapporte de l ecole dans son cartable.
 * Une carte blanche aux coins tres ronds, bordee d une couture en pointilles,
 * posee sur une nappe a pois. Trois ballons depassent du haut de la carte ;
 * l age est une rosette collee de travers sur le coin, comme une gommette.
 *
 * Tout reste lisible par le parent : date, heure et lieu sur trois lignes,
 * chacune avec son pictogramme dans une pastille de couleur. Fredoka pour
 * tout ce qui est titre, Geist pour le courant.
 */

type Palette = { table: string; dots: string; card: string; ink: string; ink2: string; line: string; accent: string; onAccent: string; trio: [string, string, string] };

const VARIANTS: Record<string, Pick<Palette, "table" | "dots" | "card" | "ink" | "ink2" | "line">> = {
  ciel: { table: "#DDEBFA", dots: "#C7DCF4", card: "#FFFFFF", ink: "#1E2A3A", ink2: "#56657A", line: "#DCE7F3" },
  creme: { table: "#FBEBD0", dots: "#F3DBB2", card: "#FFFFFF", ink: "#2C2418", ink2: "#6B5E4A", line: "#F1E3C8" },
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
  WEDDING: "Venez fêter le mariage de",
  BIRTHDAY: "Viens fêter l’anniversaire de",
  CORPORATE: "Vous êtes invités par",
  MEMORIAL: "En souvenir de",
  OTHER: "Tu es invité par",
};

const round = "[font-family:var(--inv-fredoka)]";

const button = cn(
  round,
  "flex min-h-[58px] w-full items-center justify-center rounded-full bg-[var(--kd-accent)] px-6 text-[17px] font-semibold text-[var(--kd-on-accent)] shadow-[0_6px_0_0_color-mix(in_srgb,var(--kd-accent)_60%,black)] transition-[transform,box-shadow] duration-150 active:translate-y-[4px] active:shadow-[0_2px_0_0_color-mix(in_srgb,var(--kd-accent)_60%,black)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--kd-accent)]",
);

const styles: SectionStyles = {
  heading: cn(round, "text-[26px] font-semibold leading-tight"),
  body: "text-[16px] leading-relaxed text-[var(--kd-ink)]",
  muted: "text-[15px] leading-relaxed text-[var(--kd-ink-2)]",
  label: cn(round, "text-[14px] font-semibold text-[var(--kd-accent)]"),
  rule: "divide-[var(--kd-line)] border-[var(--kd-line)]",
  emphasis: cn(round, "text-[20px] font-medium leading-[1.25]"),
  link: cn(round, "rounded-full bg-[color-mix(in_srgb,var(--kd-accent)_12%,white)] px-4 text-[14px] font-semibold text-[var(--kd-accent)]"),
};

/** Un ballon : corps, reflet, noeud, ficelle ondulee. */
function Balloon({ color, x, y, scale = 1, r = 0, d = 0 }: { color: string; x: number; y: number; scale?: number; r?: number; d?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="origin-[40px_120px] [animation:inv-bob_6s_ease-in-out_infinite]" style={{ "--r": `${r}deg`, animationDelay: `${d}ms` } as React.CSSProperties}>
        <path d="M40 104 C 38 120, 46 132, 40 150 S 36 176, 42 196" stroke="#8B97A8" strokeWidth="1.3" fill="none" />
        <path d="M40 2 C 62 2, 78 22, 78 46 C 78 74, 58 96, 40 100 C 22 96, 2 74, 2 46 C 2 22, 18 2, 40 2 Z" fill={color} />
        <path d="M35 99 L45 99 L42 106 L38 106 Z" fill={color} />
        <path d="M20 26 C 24 16, 32 12, 38 12" stroke="white" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M62 60 C 60 74, 52 84, 44 90" stroke="black" strokeOpacity="0.08" strokeWidth="8" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

/** Rosette : cercle festonne en 18 lobes, trace une fois pour toutes. */
const ROSETTE = (() => {
  const n = 18;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rad = i % 2 ? 44 : 50;
    pts.push(`${(50 + rad * Math.cos(a)).toFixed(2)},${(50 + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

export function Kids({ view, rsvpForm }: { view: InvitationView; rsvpForm?: RsvpFormData | null }) {
  const { event, theme, venues } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const dear = salutation(view);
  const { starts } = event;
  const age = event.type === "BIRTHDAY" || event.type === "OTHER" ? ageOf(view) : null;
  const venue = venues[0];
  const insert = "relative rounded-[30px] bg-[var(--kd-card)] px-6 py-8 shadow-[0_2px_0_0_var(--kd-dots)]";

  const facts = [
    { icon: CalendarDays, text: `${starts.weekday} ${starts.day} ${starts.month}`, color: p.trio[0] },
    { icon: Clock3, text: starts.time, color: p.trio[1] },
    venue && { icon: MapPin, text: venue.name, color: p.trio[2] },
  ].filter(Boolean) as { icon: typeof MapPin; text: string; color: string }[];

  return (
    <ThemeShell
      view={view}
      rsvpForm={rsvpForm}
      mainClassName={cn(fredoka.variable, "bg-[var(--kd-table)] text-[var(--kd-ink)]")}
      vars={{
        "--kd-table": p.table, "--kd-bg": p.table, "--kd-dots": p.dots, "--kd-card": p.card, "--kd-ink": p.ink, "--kd-ink-2": p.ink2,
        "--kd-line": p.line, "--kd-accent": p.accent, "--kd-on-accent": p.onAccent,
      }}
      envelope={{
        "--env-bg": p.table, "--env-ink": p.ink, "--env-ink-2": p.ink2, "--env-line": p.line,
        "--env-paper": "#FFFFFF", "--env-fold": "#F6F8FB", "--env-flap": "#EEF2F7", "--env-edge": "#D5DCE6",
        "--env-card": "#FFFFFF", "--env-card-ink": p.ink, "--env-liner": p.trio[1], "--env-seal": p.accent, "--env-seal-ink": p.onAccent, "--env-font": "var(--inv-fredoka)",
      }}
      rsvp={{ "--rsvp-bg": p.card, "--rsvp-ink": p.ink, "--rsvp-ink-2": p.ink2, "--rsvp-line": p.line, "--rsvp-rule": p.accent, "--rsvp-accent": p.accent, "--rsvp-error": "#B3261E", "--rsvp-font": "var(--inv-fredoka)" }}
      styles={styles}
      button={button}
      heroCtaId="kd-hero-cta"
      before={<div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: `radial-gradient(${p.dots} 2.2px, transparent 2.6px)`, backgroundSize: "26px 26px" }} />}
      containerClassName="relative px-4 pt-[max(12px,env(safe-area-inset-top))]"
      dockClassName="bg-[color-mix(in_srgb,var(--kd-table)_88%,transparent)] px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      hero={
        <header className="flex min-h-[calc(100svh-12px)] flex-col items-center justify-center pb-6">
          <p className="sr-only">
            {starts.long}, {starts.time}
          </p>

          <div className="relative w-full max-w-[400px] pt-[92px]">
            {/* Ballons : ils depassent du haut de la carte, ficelles derriere elle. */}
            <svg aria-hidden viewBox="0 0 220 210" className="pc-fade absolute right-2 top-0 h-[190px] w-[200px]" style={delay(200)}>
              <Balloon color={p.trio[1]} x={8} y={22} scale={0.78} r={-4} d={400} />
              <Balloon color={p.trio[2]} x={128} y={14} scale={0.82} r={5} d={900} />
              <Balloon color={p.trio[0]} x={64} y={0} scale={0.95} r={-2} />
            </svg>

            {/* La carte */}
            <div className="pc-lift relative rounded-[36px] bg-[var(--kd-card)] px-6 pb-7 pt-10 text-center shadow-[0_3px_0_0_var(--kd-dots),0_30px_50px_-30px_rgba(30,42,58,0.35)]" style={delay(40)}>
              <span aria-hidden className="pointer-events-none absolute inset-[10px] rounded-[28px] border-2 border-dashed border-[color-mix(in_srgb,var(--kd-accent)_28%,transparent)]" />

              {age !== null && (
                <div aria-hidden className="absolute -left-2 -top-7 size-[92px] [animation:inv-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.35s_both]" style={{ "--r": "-10deg" } as React.CSSProperties}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-[0_4px_0_rgba(0,0,0,0.12)]">
                    <polygon points={ROSETTE} fill={p.trio[1]} stroke={p.trio[1]} strokeWidth="6" strokeLinejoin="round" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                  <span className={cn(round, "relative flex size-full flex-col items-center justify-center leading-none text-[#2C2418]")}>
                    <span className="text-[36px] font-semibold tracking-[-0.02em]">{age}</span>
                    <span className="-mt-0.5 text-[12px] font-semibold">ans</span>
                  </span>
                </div>
              )}

              <div className="relative">
                {event.updatedNote && <p className={cn(round, "mb-3 text-[13px] font-semibold text-[var(--kd-accent)]")}>{event.updatedNote}</p>}
                {dear && <p className={cn(round, "pc-fade text-[17px] font-medium")}>Coucou {dear}&nbsp;!</p>}
                <p className="pc-fade mt-1 text-[15px] text-[var(--kd-ink-2)]" style={delay(80)}>
                  {EYEBROW[event.type]}
                </p>
                <h1 className={cn(round, "pc-rise mt-2 font-semibold tracking-[-0.01em] text-[var(--kd-accent)]")} style={delay(140)}>
                  {age !== null && <span className="sr-only">{age} ans, </span>}
                  <HostNames view={view} sizeClass={nameSizeClass(longestHost(view), ["text-[clamp(52px,15vw,64px)]", "text-[clamp(42px,12vw,52px)]", "text-[clamp(32px,9vw,40px)]", "text-[clamp(26px,7vw,30px)]"])} lineClassName="leading-[1]" separator={<span className="block text-[26px] leading-[1.4] text-[var(--kd-ink-2)]">&amp;</span>} />
                </h1>

                <ul aria-hidden className="mx-auto mt-6 max-w-[290px] space-y-2.5 text-left">
                  {facts.map((f) => (
                    <li key={f.text} className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${f.color} 18%, white)`, color: f.color }}>
                        <f.icon className="size-[18px]" strokeWidth={2.2} />
                      </span>
                      <span className={cn(round, "min-w-0 text-[17px] font-medium leading-tight first-letter:uppercase [overflow-wrap:anywhere]")}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pc-fade mt-6 w-full max-w-[400px] text-center" style={delay(320)}>
            <HeroCta view={view} id="kd-hero-cta" button={button} noteClassName="text-[var(--kd-ink-2)]" />
            {theme.settings.countdown && event.daysLeft !== null && <p className={cn(round, "mt-1 text-[15px] font-semibold text-[var(--kd-accent)]")}>{countdownText(event.daysLeft)}&nbsp;!</p>}
          </div>
        </header>
      }
      photo={
        <figure className="pc-inview mx-auto mb-4 mt-4 max-w-[400px] rotate-[-1.5deg]">
          <div className="rounded-[30px] bg-[var(--kd-card)] p-3 shadow-[0_3px_0_0_var(--kd-dots)]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[var(--kd-line)]">
              <Image src={event.heroImageUrl!} alt={event.hosts} fill sizes="(max-width: 460px) 90vw, 380px" className="object-cover" />
            </div>
          </div>
        </figure>
      }
      section={({ key, index, title, children }) => (
        <section key={key} className={cn("pc-inview mx-auto mb-4 max-w-[400px]", insert)}>
          {title && (
            <h2 className={cn(styles.heading, "mb-6 flex items-center justify-center gap-2.5 [overflow-wrap:anywhere]")}>
              <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: p.trio[index % 3] }} />
              {title}
            </h2>
          )}
          {children}
        </section>
      )}
      rsvpWrapperClassName={cn("pc-inview mx-auto max-w-[400px]", insert)}
      rsvpTitle={<h2 className={cn(round, "text-[34px] font-semibold leading-tight text-[var(--kd-accent)]")}>Tu viens&nbsp;?</h2>}
      footer={
        <footer className="mt-12 text-center">
          <p className={cn(round, "text-[22px] font-semibold")}>À très vite&nbsp;!</p>
          <p className="mt-1 text-[13px] text-[var(--kd-ink-2)]">
            {event.hostParts.join(" & ")} · {starts.day} {starts.month} {starts.year}
          </p>
        </footer>
      }
    />
  );
}
