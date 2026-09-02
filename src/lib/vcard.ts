import type { PublicProfile } from "@/types/profile";

/**
 * §5.5 - "Le serveur genere une vCard a partir des informations actuelles du
 * profil." Aucun fichier n est stocke : le .vcf est reconstruit a chaque appel,
 * donc toujours a jour apres une modification du profil.
 */

/**
 * Echappement RFC 6350 : l antislash d abord, sinon on echapperait les
 * antislashs que l on vient soi-meme d introduire.
 */
function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Repliage a 75 octets impose par la RFC 6350 pour la compatibilite iOS/Android. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

export function buildVCard(profile: PublicProfile): string {
  const { identity, contact, location, links, canonicalUrl } = profile;
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  const last = identity.lastName ?? "";
  const first = identity.firstName ?? identity.displayName;
  lines.push(`N:${escape(last)};${escape(first)};;;`);
  lines.push(`FN:${escape(identity.displayName)}`);

  if (identity.company) lines.push(`ORG:${escape(identity.company)}`);
  if (identity.title) lines.push(`TITLE:${escape(identity.title)}`);
  if (identity.bio) lines.push(`NOTE:${escape(identity.bio)}`);

  if (contact.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escape(contact.phone)}`);
  if (contact.whatsapp && contact.whatsapp !== contact.phone) {
    lines.push(`TEL;TYPE=CELL:${escape(contact.whatsapp)}`);
  }
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escape(contact.email)}`);
  if (contact.website) lines.push(`URL:${escape(contact.website)}`);

  // Le profil public lui-meme reste joignable depuis le contact enregistre.
  lines.push(`URL;TYPE=PROFILE:${escape(canonicalUrl)}`);

  if (location.address || location.city || location.country) {
    const adr = [
      "",
      "",
      escape(location.address ?? ""),
      escape(location.city ?? ""),
      "",
      "",
      escape(location.country ?? ""),
    ].join(";");
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }
  if (location.lat != null && location.lng != null) {
    lines.push(`GEO:${location.lat};${location.lng}`);
  }

  if (identity.avatarUrl) lines.push(`PHOTO;VALUE=URI:${escape(identity.avatarUrl)}`);

  for (const link of links) {
    if (link.href.startsWith("https://")) {
      lines.push(`X-SOCIALPROFILE;TYPE=${link.type}:${escape(link.href)}`);
    }
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  return lines.map(fold).join("\r\n");
}

export function vcardFileName(profile: PublicProfile): string {
  const base = profile.identity.displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "contact"}.vcf`;
}
