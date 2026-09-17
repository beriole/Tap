/**
 * Dates d evenement dans LEUR fuseau (§5 "fuseau").
 *
 * Un mariage a Yaounde commence a 14 h heure de Yaounde, que l organisateur
 * remplisse le formulaire depuis Paris ou Montreal. Le navigateur envoie donc
 * une heure "murale" (2026-12-12T14:00) et le serveur la convertit avec le
 * fuseau de l evenement - jamais avec celui du navigateur ni du serveur.
 *
 * Sans bibliotheque : Intl suffit, et gere les changements d heure.
 */

export const EVENT_TIMEZONES = [
  { value: "Africa/Douala", label: "Cameroun, Gabon, Congo (UTC+1)" },
  { value: "Africa/Lagos", label: "Nigeria, Benin (UTC+1)" },
  { value: "Africa/Kinshasa", label: "RD Congo - Kinshasa (UTC+1)" },
  { value: "Africa/Abidjan", label: "Cote d Ivoire, Senegal, Mali (UTC+0)" },
  { value: "Europe/Paris", label: "France, Belgique, Suisse" },
  { value: "Europe/London", label: "Royaume-Uni" },
  { value: "America/Toronto", label: "Canada - Est" },
  { value: "America/New_York", label: "Etats-Unis - Est" },
] as const;

export function isSupportedTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Decalage (ms) du fuseau par rapport a UTC, a l instant donne. */
function offsetAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant.getTime();
}

/** "2026-12-12T14:00" dans `timeZone` → instant UTC. */
export function wallTimeToUtc(wall: string, timeZone: string): Date {
  const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Heure invalide : ${wall}`);
  const naive = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  // Deux passes : la premiere estimation peut tomber de l autre cote d un
  // changement d heure.
  let guess = naive - offsetAt(new Date(naive), timeZone);
  guess = naive - offsetAt(new Date(guess), timeZone);
  return new Date(guess);
}

/** Instant UTC → "2026-12-12T14:00" dans `timeZone`, pour pre-remplir un champ. */
export function utcToWallTime(instant: Date, timeZone: string): string {
  const shifted = new Date(instant.getTime() + offsetAt(instant, timeZone));
  return shifted.toISOString().slice(0, 16);
}
