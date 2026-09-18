import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationSection, InvitationVenue, InvitationView, RsvpFormData } from "@/types/invitation";
import { RsvpForm } from "./rsvp-form";

/**
 * Socle commun des themes d invitation (cahier §12.1 "une composition forte
 * par theme, pas 20 recolorations" ; plan phase 9 "decliner les autres
 * themes a partir des memes donnees, sans dupliquer la logique metier").
 *
 * Ce qui est ICI est du comportement : quand montrer le formulaire, quoi
 * afficher si les reponses sont closes, comment lister un programme ou une
 * FAQ. Ce qui reste DANS chaque theme est la composition : grille, typo,
 * rythme, ornements. Un theme passe ses classes ; le socle place les bonnes
 * donnees au bon endroit.
 */

export type SectionStyles = {
  /** Titre de section */
  heading: string;
  /** Texte courant */
  body: string;
  /** Texte secondaire */
  muted: string;
  /** Petites capitales / etiquettes */
  label: string;
  /** Filet horizontal */
  rule: string;
  /** Valeur mise en avant (heure, plat) */
  emphasis: string;
  /** Lien souligne */
  link: string;
};

export function VenueList({ venues, styles, preview, align = "center" }: { venues: InvitationVenue[]; styles: SectionStyles; preview: boolean; align?: "center" | "left" }) {
  return (
    <ul className={cn("divide-y", styles.rule)}>
      {venues.map((venue) => (
        <li key={`${venue.label}-${venue.name}`} className={cn("py-7 first:pt-0 last:pb-0", align === "center" && "text-center")}>
          <p className={styles.label}>
            {venue.label}
            {venue.time && <span className="tracking-[0.12em]"> · {venue.time}</span>}
          </p>
          <p className={cn("mt-3 [overflow-wrap:anywhere]", styles.emphasis)}>{venue.name}</p>
          <p className={cn("mt-2", styles.muted)}>{venue.address}</p>
          {venue.landmark && <p className={cn("mt-1 italic", styles.muted)}>{venue.landmark}</p>}
          <a href={preview ? undefined : venue.directionsUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-4 inline-flex min-h-11 items-center gap-1.5", styles.link)}>
            Itinéraire
            <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.5} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SectionBody({ section, styles, align = "center" }: { section: InvitationSection; styles: SectionStyles; align?: "center" | "left" }) {
  const centered = align === "center";
  switch (section.kind) {
    case "program":
      return (
        <ol className={cn("divide-y", styles.rule, centered && "mx-auto max-w-[340px]")}>
          {section.data.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[4.75rem_1fr] items-baseline gap-4 py-4">
              <span className={cn("text-right tabular-nums", styles.emphasis)}>{item.time.replace(":", " h ")}</span>
              <span className={cn("text-left [overflow-wrap:anywhere]", styles.body)}>{item.label}</span>
            </li>
          ))}
        </ol>
      );
    case "dresscode":
      return (
        <div className={cn(centered && "text-center")}>
          {section.data.text && <p className={cn("whitespace-pre-line", styles.body, centered && "mx-auto max-w-[340px]")}>{section.data.text}</p>}
          {section.data.palette.length > 0 && (
            <ul className={cn("mt-7 flex flex-wrap gap-3", centered && "justify-center")} aria-label="Couleurs conseillées">
              {section.data.palette.map((color) => (
                <li key={color}>
                  <span className="block size-9 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "menu":
      return (
        <div className={cn("space-y-9", centered && "text-center")}>
          {section.data.courses.map((course, i) => (
            <div key={i}>
              <p className={styles.label}>{course.label}</p>
              <ul className="mt-3 space-y-1.5">
                {course.items.map((dish, k) => (
                  <li key={k} className={cn("[overflow-wrap:anywhere]", styles.emphasis)}>
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
        <div className={cn("divide-y border-y text-left", styles.rule)}>
          {section.data.items.map((item, i) => (
            <details key={i} className="group">
              <summary className={cn("flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden", styles.body)}>
                <span className="[overflow-wrap:anywhere]">{item.q}</span>
                <span aria-hidden className="relative size-3 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-current opacity-60" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-current opacity-60 transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className={cn("whitespace-pre-line pb-5", styles.muted)}>{item.a}</p>
            </details>
          ))}
        </div>
      );
    default:
      return <p className={cn("whitespace-pre-line", styles.body, centered && "mx-auto max-w-[360px] text-center")}>{section.data.text}</p>;
  }
}

/**
 * Bloc de reponse : ferme, formulaire reel, ou apercu organisateur.
 * `rsvpStyle` porte les variables --rsvp-* du theme.
 */
export function RsvpBlock({
  view,
  rsvpForm,
  rsvpStyle,
  styles,
  button,
  title,
  align = "center",
}: {
  view: InvitationView;
  rsvpForm?: RsvpFormData | null;
  rsvpStyle: React.CSSProperties;
  styles: SectionStyles;
  button: string;
  title: React.ReactNode;
  align?: "center" | "left";
}) {
  const { event, guest, rsvp } = view;
  const centered = align === "center";
  const seats = rsvpForm?.maxSeats ?? guest?.seats ?? null;
  const intro = (
    <p className={cn("max-w-[330px] [text-wrap:pretty]", centered && "mx-auto", styles.body)}>
      {seats !== null ? (
        <>
          Nous vous avons réservé <strong className="font-medium">{seats} place{seats > 1 ? "s" : ""}</strong>
          {rsvp.deadline ? `. Merci de répondre avant le ${rsvp.deadline.long}.` : "."}
        </>
      ) : (
        "Chaque invité voit ici le nombre de places réservées pour lui."
      )}
    </p>
  );

  return (
    <section id="rsvp" className={cn("scroll-mt-6", centered && "text-center")}>
      {title}
      {rsvp.closed && (!rsvpForm || rsvpForm.status === "PENDING") ? (
        <p className={cn("mt-5 max-w-[320px]", centered && "mx-auto", styles.muted)}>Les réponses sont closes. Pour toute question, contactez directement {event.hosts}.</p>
      ) : rsvpForm ? (
        <div className="mt-8" style={rsvpStyle}>
          <RsvpForm data={rsvpForm} intro={<div className="mb-8">{intro}</div>} />
        </div>
      ) : (
        <>
          <div className="mt-5">{intro}</div>
          <div className={cn("mt-8 max-w-[320px]", centered && "mx-auto")}>
            {/* Apercu organisateur : aucun invite reel, le formulaire n est pas actif. */}
            <span aria-disabled className={cn(button, "cursor-default")}>
              Répondre
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export function ctaLabel(view: InvitationView): string {
  return view.rsvp.closed ? "Voir les informations" : "Répondre à l’invitation";
}

export function monogram(view: InvitationView): string {
  const parts = view.event.hostParts;
  return parts.length === 2 ? `${parts[0]!.charAt(0)} & ${parts[1]!.charAt(0)}` : parts[0]!.charAt(0);
}

export function salutation(view: InvitationView): string | null {
  const g = view.guest;
  if (!g) return null;
  return g.firstNames.length > 0 && g.firstNames.length <= 2 ? g.firstNames.join(" & ") : g.groupName;
}

export function countdownText(days: number): string {
  return days === 0 ? "C’est aujourd’hui" : days === 1 ? "C’est demain" : `Dans ${days} jours`;
}
