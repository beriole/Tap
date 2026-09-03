import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * Alphabet sans caracteres ambigus (0/O, 1/I/L) : le token est lu et saisi par
 * des humains lors de l encodage NDEF et du SAV.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * §5.6 / §12 - Jeton public aleatoire non sequentiel, ex. A7K2M9Q.
 * 7 caracteres sur 31 symboles ~= 2.7e10 combinaisons : enumeration simple
 * impraticable, et l URL reste tres courte pour la NTAG213 (144 octets, §14).
 */
export function generateCardToken(length = 7): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function isValidCardToken(token: string): boolean {
  return new RegExp(`^[${ALPHABET}]{6,12}$`).test(token);
}

/**
 * Jeton d un lien de partage restreint (§ liens par niveau).
 *
 * Volontairement EN MINUSCULES et plus long que celui d une carte : les deux
 * cohabitent dans les memes routes publiques (vCard, QR), et l oeil comme le
 * code doivent pouvoir les distinguer sans ambiguite. Un jeton de carte se lit
 * A7K2M9Q, un lien de partage se lit k3m9pq7rst.
 *
 * Dix caracteres sur 31 symboles : personne ne devine le lien d une ceremonie.
 */
const SHARE_ALPHABET = ALPHABET.toLowerCase();

export function generateShareSlug(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += SHARE_ALPHABET[randomInt(SHARE_ALPHABET.length)];
  return out;
}

export function isValidShareSlug(slug: string): boolean {
  return new RegExp(`^[${SHARE_ALPHABET}]{8,16}$`).test(slug);
}

/** Jetons opaques pour invitation, verification e-mail et reinitialisation. */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** L UID de puce n est jamais stocke en clair (§12). */
export function hashUid(uid: string): string {
  return createHash("sha256").update(uid.trim().toUpperCase()).digest("hex");
}
