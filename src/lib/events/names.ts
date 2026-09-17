/**
 * Noms de personnes : decoupage prenom / nom et comparaison tolerante.
 *
 * Au Cameroun comme ailleurs, les listes melangent "Paul NGONO", "NGONO Paul"
 * et "Ngono Paul". La seule information fiable est la casse : un mot ecrit
 * tout en capitales est presque toujours le nom de famille.
 */

export type SplitName = { firstName: string | null; lastName: string | null; separable: boolean };

const isShouting = (word: string) => word.length > 1 && word === word.toUpperCase() && /\p{L}/u.test(word);

export function splitName(full: string): SplitName {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { firstName: null, lastName: null, separable: false };
  if (words.length === 1) return { firstName: words[0]!, lastName: null, separable: false };

  const upper = words.filter(isShouting);
  if (upper.length > 0 && upper.length < words.length) {
    return {
      firstName: words.filter((w) => !isShouting(w)).join(" "),
      lastName: upper.map(titleCase).join(" "),
      separable: true,
    };
  }
  return { firstName: words[0]!, lastName: words.slice(1).join(" "), separable: true };
}

function titleCase(word: string): string {
  return word
    .toLowerCase()
    .replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * Cle de comparaison : sans accents, sans casse, mots tries. "NGONO Paul" et
 * "Paul Ngono" donnent la meme cle - c est un doublon PROBABLE, jamais certain :
 * deux cousins peuvent porter le meme nom.
 */
export function nameKey(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function displayName(guest: { firstName: string | null; lastName: string | null }, fallback = "Accompagnant"): string {
  return [guest.firstName, guest.lastName].filter(Boolean).join(" ") || fallback;
}
