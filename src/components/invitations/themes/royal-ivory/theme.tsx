import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationSection, InvitationView } from "@/types/invitation";
import { Envelope } from "../../envelope";
import { RsvpDock } from "../../rsvp-dock";
import { royalIvoryDisplay } from "./font";

/**
 * ROYAL IVORY - papeterie gravee.
 *
 * Le parti pris : un faire-part qu on aurait pu recevoir sous pli, pas une
 * application. Pas une carte posee sur un fond : la page EST le papier.
 *
 * La signature est le cartouche de date - le jour en didone monumentale entre
 * deux filets verticaux, le jour de la semaine et le mois graves en petites
 * capitales de part et d autre. C est l information que l invite doit
 * retenir ; c est donc la seule audace de la page. Tout le reste est calme :
 * filets d un pixel, petites capitales espacees, italique pour les heures.
 *
 * L accent (champagne, rose poudre, sauge) sert a SIGNALER - filets, fleurons,
 * heures - jamais a remplir une surface. Le bouton est a l encre.
 *
 * Premier ecran, de 360 a 430 px : destinataire, noms, date, bouton de
 * reponse. La photo, les lieux et le reste viennent apres (§12.1 hierarchie).
 *
 * Mouvement : l ESSENTIEL du premier ecran - noms, date, bouton - n a aucune
 * entree. Il est la au premier rendu, meme sur un telephone lent (§12.1 "les
 * animations ne doivent jamais retarder l acces aux informations
 * essentielles"). Mesure en 4G lente : les entrees retardaient l affichage
 * des noms. Seuls les ornements (filets, esperluette, mentions secondaires)
 * gardent une entree CSS, neutralisee par prefers-reduced-motion.
 */

type Palette = { bg: string; paper: string; ink: string; ink2: string; line: string; rule: string; accentText: string };

/** Papier de l enveloppe : un ton sous la page, pour que l objet se detache sans ombre lourde. */
const ENVELOPE: Record<string, { paper: string; fold: string; flap: string; edge: string; card: string; cardInk: string }> = {
  ivoire: { paper: "#EAE0CC", fold: "#E2D6BF", flap: "#DCCDB2", edge: "#C9B797", card: "#FBF7EF", cardInk: "#2B231F" },
  nuit: { paper: "#2C2521", fold: "#26201C", flap: "#383029", edge: "#4A4038", card: "#F3EBDD", cardInk: "#2B231F" },
};

const VARIANTS: Record<string, Omit<Palette, "rule" | "accentText">> = {
  ivoire: { bg: "#F6F0E4", paper: "#EEE5D5", ink: "#2B231F", ink2: "#675B52", line: "#E0D3BE" },
  nuit: { bg: "#1D1916", paper: "#27211D", ink: "#F3EBDD", ink2: "#B7AA97", line: "#3A322C" },
};

/** [filet, texte] par variante : le texte d accent garde 4,5:1 de contraste sur le papier. */
const ACCENTS: Record<string, Record<string, [string, string]>> = {
  champagne: { ivoire: ["#B08D57", "#7A5D33"], nuit: ["#C6A66D", "#D4B784"] },
  poudre: { ivoire: ["#C29792", "#895752"], nuit: ["#D1A6A1", "#DDB5B0"] },
  sauge: { ivoire: ["#95A284", "#55664A"], nuit: ["#A7B596", "#B7C4A6"] },
};

function palette(variant: string, accent: string): Palette {
  const base = VARIANTS[variant] ?? VARIANTS.ivoire!;
  const [rule, accentText] = ACCENTS[accent]?.[variant] ?? ACCENTS.champagne![variant] ?? ACCENTS.champagne!.ivoire!;
  return { ...base, rule, accentText };
}

const EYEBROW: Record<InvitationView["event"]["type"], string> = {
  WEDDING: "Nous nous marions",
  BIRTHDAY: "Vous êtes invité",
  CORPORATE: "Invitation",
  MEMORIAL: "En mémoire",
  OTHER: "Invitation",
};

const smallCaps = "text-[11px] font-medium uppercase tracking-[0.3em]";
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/** Taille des noms selon leur longueur : un prenom de douze lettres ne doit pas deborder a 360 px. */
function nameSize(longest: number): string {
  if (longest <= 8) return "text-[clamp(52px,16vw,68px)]";
  if (longest <= 12) return "text-[clamp(42px,12.5vw,56px)]";
  if (longest <= 18) return "text-[clamp(34px,9.5vw,44px)]";
  return "text-[clamp(28px,7.5vw,36px)]";
}

export function RoyalIvory({ view }: { view: InvitationView }) {
  const { event, venues, sections, guest, rsvp, theme, preview } = view;
  const p = palette(theme.settings.variant, theme.settings.accent);
  const longest = Math.max(...event.hostParts.map((h) => h.length));
  const salutation = guest
    ? guest.firstNames.length > 0 && guest.firstNames.length <= 2
      ? guest.firstNames.join(" & ")
      : guest.groupName
    : null;

  const style = {
    "--ri-bg": p.bg,
    "--ri-paper": p.paper,
    "--ri-ink": p.ink,
    "--ri-ink-2": p.ink2,
    "--ri-line": p.line,
    "--ri-rule": p.rule,
    "--ri-accent": p.accentText,
  } as React.CSSProperties;

  const paper = ENVELOPE[theme.settings.variant] ?? ENVELOPE.ivoire!;
  const envelopeStyle = {
    "--env-bg": p.bg,
    "--env-ink": p.ink,
    "--env-ink-2": p.ink2,
    "--env-line": p.line,
    "--env-paper": paper.paper,
    "--env-fold": paper.fold,
    "--env-flap": paper.flap,
    "--env-edge": paper.edge,
    "--env-card": paper.card,
    "--env-card-ink": paper.cardInk,
    "--env-liner": p.rule,
    "--env-seal": p.rule,
    "--env-seal-ink": p.bg,
    "--env-font": "var(--ri-display)",
  } as React.CSSProperties;
  const monogram =
    event.hostParts.length === 2 ? `${event.hostParts[0]!.charAt(0)} & ${event.hostParts[1]!.charAt(0)}` : event.hostParts[0]!.charAt(0);

  const ctaLabel = rsvp.closed ? "Voir les informations" : "Répondre à l’invitation";

  return (
    <main
      style={style}
      className={cn(
        royalIvoryDisplay.variable,
        "min-h-dvh bg-[var(--ri-bg)] font-[family-name:var(--app-font-sans)] text-[var(--ri-ink)] antialiased [color-scheme:light]",
        theme.settings.variant === "nuit" && "[color-scheme:dark]",
      )}
    >
      {/* break-words : tout texte saisi par l organisateur peut contenir un mot
          interminable. Il ne se coupe qu en dernier recours, sans changer la
          largeur minimale des grilles (contrairement a overflow-wrap:anywhere). */}
      {view.envelope && (
        <div style={envelopeStyle}>
          <Envelope recipient={salutation} monogram={monogram} />
        </div>
      )}

      <div className="mx-auto w-full max-w-[460px] break-words px-6 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
        {event.updatedNote && (
          <p className={cn(smallCaps, "pc-fade pt-1 text-center text-[10px] text-[var(--ri-accent)]")}>{event.updatedNote}</p>
        )}

        {/* ------------------------------------------------ PREMIER ECRAN -- */}
        <header className="flex min-h-[calc(100svh-40px)] flex-col items-center justify-center py-10 text-center">
          {salutation && (
            <p className="pc-fade mb-7 text-[14px] italic text-[var(--ri-ink-2)] [font-family:var(--ri-display)]" style={delay(0)}>
              À l’attention de {salutation}
            </p>
          )}

          <p className={cn(smallCaps, "pc-fade text-[var(--ri-accent)]")} style={delay(80)}>
            {EYEBROW[event.type]}
          </p>

          <h1 className="mt-7 font-normal [font-family:var(--ri-display)] [font-optical-sizing:auto]">
            {event.hostParts.length === 2 ? (
              <>
                <span className={cn("block leading-[0.95] tracking-[-0.015em] [overflow-wrap:anywhere]", nameSize(longest))}>
                  {event.hostParts[0]}
                </span>
                <span className="pc-fade my-2 flex items-center justify-center gap-4" style={delay(260)}>
                  <span aria-hidden className="pc-draw h-px w-10 bg-[var(--ri-rule)]" style={{ ...delay(320), transformOrigin: "right" }} />
                  <span className="text-[34px] italic leading-none text-[var(--ri-accent)]">&amp;</span>
                  <span aria-hidden className="pc-draw h-px w-10 bg-[var(--ri-rule)]" style={delay(320)} />
                </span>
                <span className={cn("block leading-[0.95] tracking-[-0.015em] [overflow-wrap:anywhere]", nameSize(longest))}>
                  {event.hostParts[1]}
                </span>
              </>
            ) : (
              <span className={cn("block leading-[1] tracking-[-0.015em] [overflow-wrap:anywhere] [text-wrap:balance]", nameSize(longest))}>
                {event.hostParts[0]}
              </span>
            )}
          </h1>

          <DateCartouche view={view} />

          {theme.settings.countdown && event.daysLeft !== null && (
            <p className="pc-fade mt-4 text-[15px] italic text-[var(--ri-ink-2)] [font-family:var(--ri-display)]" style={delay(560)}>
              {event.daysLeft === 0 ? "C’est aujourd’hui" : event.daysLeft === 1 ? "C’est demain" : `Dans ${event.daysLeft} jours`}
            </p>
          )}

          <div id="ri-hero-cta" className="mt-9 w-full max-w-[320px]">
            <a href="#rsvp" className={button}>
              {ctaLabel}
            </a>
            {rsvp.deadline && !rsvp.closed && (
              <p className="mt-3 text-[12.5px] text-[var(--ri-ink-2)]">
                Réponse souhaitée avant le {rsvp.deadline.day} {rsvp.deadline.month}
              </p>
            )}
          </div>
        </header>

        {/* ------------------------------------------------------ PHOTO -- */}
        {event.heroImageUrl && (
          <figure className="pc-inview -mx-6 mb-20">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--ri-paper)]">
              <Image
                src={event.heroImageUrl}
                alt={`${event.hosts}`}
                fill
                sizes="(max-width: 460px) 100vw, 460px"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        {/* ------------------------------------------------------ LIEUX -- */}
        {venues.length > 0 && (
          <Section title={venues.length > 1 ? "Les lieux" : "Le lieu"}>
            <ul className="divide-y divide-[var(--ri-line)]">
              {venues.map((venue) => (
                <li key={`${venue.label}-${venue.name}`} className="py-7 text-center first:pt-0 last:pb-0">
                  <p className={cn(smallCaps, "text-[var(--ri-accent)]")}>
                    {venue.label}
                    {venue.time && <span className="tracking-[0.12em]"> · {venue.time}</span>}
                  </p>
                  <p className="mt-3 text-[25px] leading-[1.15] [font-family:var(--ri-display)] [overflow-wrap:anywhere]">{venue.name}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--ri-ink-2)]">{venue.address}</p>
                  {venue.landmark && (
                    <p className="mt-1 text-[15px] italic text-[var(--ri-ink-2)] [font-family:var(--ri-display)]">{venue.landmark}</p>
                  )}
                  <a
                    href={preview ? undefined : venue.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center gap-1.5 border-b border-[var(--ri-rule)] text-[13px] font-medium uppercase tracking-[0.16em] transition-colors hover:text-[var(--ri-accent)]"
                  >
                    Itinéraire
                    <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {sections.map((section) => (
          <Section key={section.id} title={section.title}>
            <SectionContent section={section} />
          </Section>
        ))}

        {/* ------------------------------------------------- REPONSE -- */}
        <section id="rsvp" className="scroll-mt-6 pt-4 text-center">
          <Fleuron />
          <h2 className="mt-5 text-[32px] italic leading-tight [font-family:var(--ri-display)]">Votre réponse</h2>
          {rsvp.closed ? (
            <p className="mx-auto mt-5 max-w-[320px] text-[15px] leading-relaxed text-[var(--ri-ink-2)]">
              Les réponses sont closes. Pour toute question, contactez directement {event.hosts}.
            </p>
          ) : (
            <>
              <p className="mx-auto mt-5 max-w-[330px] text-[15.5px] leading-relaxed text-[var(--ri-ink-2)] [text-wrap:pretty]">
                {guest ? (
                  <>
                    Nous vous avons réservé{" "}
                    <strong className="font-medium text-[var(--ri-ink)]">
                      {guest.seats} place{guest.seats > 1 ? "s" : ""}
                    </strong>
                    .
                  </>
                ) : (
                  "Chaque invité voit ici le nombre de places réservées pour lui."
                )}
              </p>
              {rsvp.deadline && (
                <p className="mt-2 text-[13px] text-[var(--ri-ink-2)]">
                  Merci de répondre avant le {rsvp.deadline.long}.
                </p>
              )}
              <div className="mx-auto mt-8 max-w-[320px]">
                {/* Le formulaire de reponse arrive en phase 5 ; le bouton garde sa place. */}
                <span aria-disabled className={cn(button, "cursor-default")}>
                  Répondre
                </span>
              </div>
            </>
          )}
        </section>

        <footer className="mt-24 text-center">
          <p className="text-[22px] leading-none [font-family:var(--ri-display)]">
            {event.hostParts.length === 2 ? (
              <>
                {event.hostParts[0]!.charAt(0)}
                <span className="mx-1.5 italic text-[var(--ri-accent)]">&amp;</span>
                {event.hostParts[1]!.charAt(0)}
              </>
            ) : (
              event.hostParts[0]
            )}
          </p>
          <p className={cn(smallCaps, "mt-3 text-[10px] text-[var(--ri-ink-2)]")}>
            {event.starts.day} {event.starts.month} {event.starts.year}
          </p>
        </footer>
      </div>

      {!rsvp.closed && (
        <RsvpDock
          heroId="ri-hero-cta"
          targetId="rsvp"
          label="Répondre à l’invitation"
          className="border-t border-[var(--ri-line)] bg-[var(--ri-bg)] px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
          buttonClassName={cn(button, "mx-auto max-w-[412px]")}
        />
      )}
    </main>
  );
}

const button =
  "flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--ri-ink)] px-6 text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--ri-bg)] transition-[transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ri-rule)]";

/**
 * Le cartouche : SAMEDI | 12 | DECEMBRE 2026.
 * Le jour en chiffres de titrage, les deux cotes en capitales gravees.
 */
function DateCartouche({ view }: { view: InvitationView }) {
  const { starts } = view.event;
  return (
    <div className="mt-11 w-full">
      <p className="sr-only">
        {starts.long}, {starts.time}
      </p>
      <div aria-hidden className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span className={cn(smallCaps, "text-right text-[var(--ri-ink-2)]")}>
          {starts.weekday}
        </span>
        <span
          className="mx-5 border-x border-[var(--ri-rule)] px-5 text-[clamp(64px,19vw,88px)] leading-[0.9] tabular-nums [font-family:var(--ri-display)] [font-variant-numeric:lining-nums]"
        >
          {starts.day}
        </span>
        <span className={cn(smallCaps, "text-left leading-[1.9] text-[var(--ri-ink-2)]")}>
          {starts.month}
          <br />
          {starts.year}
        </span>
      </div>
      <p aria-hidden className="pc-fade mt-4 text-[15px] italic text-[var(--ri-accent)] [font-family:var(--ri-display)]" style={delay(520)}>
        {starts.time.replace(" h 00", " heures")}
      </p>
    </div>
  );
}

function Fleuron() {
  return (
    <span aria-hidden className="flex items-center justify-center gap-3">
      <span className="h-px w-7 bg-[var(--ri-rule)]" />
      <span className="size-[5px] rotate-45 bg-[var(--ri-rule)]" />
      <span className="h-px w-7 bg-[var(--ri-rule)]" />
    </span>
  );
}

function Section({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <section className="pc-inview mb-20">
      <Fleuron />
      {title && <h2 className="mb-9 mt-5 text-center text-[32px] italic leading-tight [font-family:var(--ri-display)] [overflow-wrap:anywhere]">{title}</h2>}
      {!title && <div className="mb-9" />}
      {children}
    </section>
  );
}

function SectionContent({ section }: { section: InvitationSection }) {
  switch (section.kind) {
    case "program":
      return (
        <ol className="mx-auto max-w-[340px] divide-y divide-[var(--ri-line)]">
          {section.data.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[4.75rem_1fr] items-baseline gap-4 py-4">
              <span className="text-right text-[19px] italic tabular-nums text-[var(--ri-accent)] [font-family:var(--ri-display)]">
                {item.time.replace(":", " h ")}
              </span>
              <span className="text-[16px] leading-snug [overflow-wrap:anywhere]">{item.label}</span>
            </li>
          ))}
        </ol>
      );
    case "dresscode":
      return (
        <div className="text-center">
          {section.data.text && (
            <p className="mx-auto max-w-[340px] whitespace-pre-line text-[16px] leading-relaxed text-[var(--ri-ink-2)]">{section.data.text}</p>
          )}
          {section.data.palette.length > 0 && (
            <ul className="mt-7 flex flex-wrap justify-center gap-3" aria-label="Couleurs conseillées">
              {section.data.palette.map((color) => (
                <li key={color}>
                  <span
                    className="block size-9 rounded-full ring-1 ring-[var(--ri-line)] ring-offset-4 ring-offset-[var(--ri-bg)]"
                    style={{ backgroundColor: color }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "menu":
      return (
        <div className="space-y-9 text-center">
          {section.data.courses.map((course, i) => (
            <div key={i}>
              <p className={cn(smallCaps, "text-[var(--ri-accent)]")}>{course.label}</p>
              <ul className="mt-3 space-y-1.5">
                {course.items.map((dish, k) => (
                  <li key={k} className="text-[20px] leading-snug [font-family:var(--ri-display)] [overflow-wrap:anywhere]">
                    {dish}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "faq":
      return (
        <div className="divide-y divide-[var(--ri-line)] border-y border-[var(--ri-line)]">
          {section.data.items.map((item, i) => (
            <details key={i} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] leading-snug [&::-webkit-details-marker]:hidden">
                <span className="[overflow-wrap:anywhere]">{item.q}</span>
                <span aria-hidden className="relative size-3 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--ri-accent)]" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--ri-accent)] transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="whitespace-pre-line pb-5 text-[15px] leading-relaxed text-[var(--ri-ink-2)]">{item.a}</p>
            </details>
          ))}
        </div>
      );
    default:
      return (
        <p className="mx-auto max-w-[360px] whitespace-pre-line text-center text-[16px] leading-relaxed text-[var(--ri-ink-2)]">
          {section.data.text}
        </p>
      );
  }
}
