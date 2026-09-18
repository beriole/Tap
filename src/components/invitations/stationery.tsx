import { cn } from "@/lib/utils";
import type { InvitationView } from "@/types/invitation";

/**
 * Papeterie : ce qui fait qu une invitation se lit comme un CARTON et pas
 * comme une page web.
 *
 * Une invitation imprimee est un objet - un carton pose sur une table, avec
 * son grain, son epaisseur, ses marges genereuses - suivi d encarts plus
 * petits (informations, programme, carte-reponse). Les themes Anniversaire
 * reprennent cette logique : le premier ecran montre le carton, la suite de
 * la page deroule les encarts.
 *
 * Tout est CSS ou SVG en ligne : aucune image a telecharger.
 */

/**
 * Grain de papier : bruit fractal en SVG, applique en surimpression.
 * Tres faible opacite : on doit le sentir plus que le voir.
 */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Surimpression de grain, a placer dans un parent `relative`. */
export function Grain({ opacity = 0.08, className }: { opacity?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-multiply", className)}
      style={{ backgroundImage: GRAIN, opacity }}
    />
  );
}

/**
 * Ombre d un carton pose : un contact net au bord, puis une ombre portee
 * longue et diffuse. Deux couches, jamais une seule grosse ombre floue.
 */
export const PAPER_SHADOW =
  "shadow-[0_1px_1px_rgba(40,30,20,0.06),0_2px_4px_-1px_rgba(40,30,20,0.06),0_24px_48px_-24px_rgba(40,30,20,0.28),0_60px_90px_-60px_rgba(40,30,20,0.35)]";

export const PAPER_SHADOW_DARK =
  "shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_2px_4px_rgba(0,0,0,0.3),0_30px_60px_-30px_rgba(0,0,0,0.8)]";

/**
 * Age fete, lu dans le titre : "Les 30 ans de Maeva" -> 30.
 * Le cahier n a pas de champ "age" : le titre le porte presque toujours, et
 * un titre sans age donne simplement un carton sans chiffre.
 */
export function ageOf(view: InvitationView): number | null {
  const m = view.event.title.match(/\b(\d{1,3})\s*(?:ans|ème|e|th)\b/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 && n < 130 ? n : null;
}

const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

/**
 * Nombre en toutes lettres (1 a 129), orthographe rectifiee de 1990 : les
 * traits d union partout. "trente ans" se lit mieux sur un carton que "30 ans".
 */
export function inWords(n: number): string {
  if (n < 20) return UNITS[n]!;
  if (n >= 100) return n === 100 ? "cent" : `cent-${inWords(n - 100)}`;
  const t = Math.floor(n / 10);
  let u = n % 10;
  if (t === 7 || t === 9) u += 10;
  const tens = TENS[t]!;
  if (u === 0) return t === 8 ? "quatre-vingts" : tens;
  if ((u === 1 || u === 11) && t !== 8 && t !== 9) return `${tens}-et-${UNITS[u]}`;
  return `${tens}-${UNITS[u]}`;
}

/** Ville seule, tiree de l adresse du premier lieu : "Rue X, Yaoundé" -> "Yaoundé". */
export function cityOf(view: InvitationView): string | null {
  const address = view.venues[0]?.address;
  if (!address) return null;
  const last = address.split(",").pop()?.trim();
  return last && last.length <= 32 ? last : null;
}

/** Trois lettres de mois sans point final orphelin : "novembre" -> "nov." */
export function shortMonth(month: string): string {
  return month.length <= 4 ? month : `${month.slice(0, month.startsWith("juil") ? 4 : 3)}.`;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** "novembre" -> "11" : le mois deja formate dans le fuseau du lieu, jamais recalcule. */
export function monthNumber(month: string): string {
  const i = MONTHS.indexOf(month.toLowerCase());
  return i < 0 ? month.slice(0, 3) : String(i + 1).padStart(2, "0");
}
