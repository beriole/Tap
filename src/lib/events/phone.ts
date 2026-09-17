import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/**
 * Normalisation des numeros d invites (§8.2 "normaliser le prefixe pays sans
 * inventer un numero").
 *
 * La regle cardinale : on ne CORRIGE jamais. Un numero incertain ressort avec
 * `e164: null` et un probleme nomme, pour que l organisateur tranche. Envoyer
 * une invitation de mariage au mauvais inconnu coute plus cher qu une case a
 * completer.
 */

export type PhoneIssue = "ambiguous" | "invalid" | "incomplete";

export type NormalizedPhone = {
  raw: string;
  e164: string | null;
  issue: PhoneIssue | null;
};

/** Lettres qu une photo ou une saisie rapide confond avec des chiffres. */
const AMBIGUOUS = /[oOlIiSsBZ]/;

export function normalizePhone(input: string, defaultCountry = "CM"): NormalizedPhone {
  const raw = input.trim();
  if (!raw) return { raw, e164: null, issue: "incomplete" };

  // "69O 12 34 56" : on signale, on ne remplace pas le O par un 0.
  if (AMBIGUOUS.test(raw.replace(/^\s*\(?\+?/, ""))) return { raw, e164: null, issue: "ambiguous" };

  // 00237... est l ecriture internationale courante au Cameroun et en Europe.
  const cleaned = raw.replace(/^00/, "+").replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8) return { raw, e164: null, issue: "incomplete" };

  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) return { raw, e164: null, issue: "invalid" };
  return { raw, e164: parsed.number, issue: null };
}

/** Affichage lisible d un numero deja normalise. */
export function formatPhone(e164: string | null): string {
  if (!e164) return "";
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

export const PHONE_ISSUE_LABELS: Record<PhoneIssue, string> = {
  ambiguous: "Caractere ambigu (lettre a la place d un chiffre ?)",
  invalid: "Numero invalide",
  incomplete: "Numero incomplet",
};

/** Lien wa.me : chiffres seuls, sans le +. */
export function whatsappNumber(e164: string): string {
  return e164.replace(/\D/g, "");
}
