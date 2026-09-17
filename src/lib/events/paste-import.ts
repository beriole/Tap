import { normalizePhone, type PhoneIssue } from "./phone";
import { nameKey, splitName } from "./names";

/**
 * Import par copier-coller (§8.3 "lignes Nom - Telephone - Groupe").
 *
 * Ce que l organisateur colle vient d un cahier recopie, d une note de
 * telephone, d un groupe WhatsApp ou d Excel. On accepte donc plusieurs
 * separateurs et un ordre de colonnes libre : le numero se reconnait a sa
 * forme, le premier texte restant est la personne, le suivant son groupe.
 *
 * Rien n est importe ici : on produit des lignes ANNOTEES pour l ecran de
 * validation. Logique pure, testee dans paste-import.test.ts.
 */

export type ImportIssue =
  | PhoneIssue
  | "no_phone"
  | "name_not_separable"
  | "duplicate_phone"
  | "probable_duplicate"
  | "missing_name";

export type ImportRow = {
  line: number;
  source: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  phoneRaw: string | null;
  phoneE164: string | null;
  groupName: string;
  issues: ImportIssue[];
  /** Ligne ou invite existant avec lequel elle entre en collision */
  duplicateOf: string | null;
};

export type ExistingGuest = { firstName: string | null; lastName: string | null; phoneE164: string | null; groupName: string };

// Au moins 3 chiffres et aucune autre lettre que celles confondues avec des
// chiffres : "699 12" est un numero incomplet, pas un nom de groupe.
const PHONE_SHAPE = /^[\s+()\d.\-oOlI]{3,}$/;
const HEADER = /\b(nom|name)\b.*\b(t[ée]l|phone|num[ée]ro|contact)/i;

function splitLine(line: string): string[] {
  const separators = [/\t/, /;/, /\|/, /\s[-–—]\s/, /,/];
  for (const sep of separators) {
    const parts = line.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  // "Paul Ngono 699123456" : le numero colle au nom, sans separateur.
  const tail = line.match(/^(.*?)\s+((?:\+|00)?[\d\s.()-]{8,})$/);
  if (tail) return [tail[1]!.trim(), tail[2]!.trim()];
  return [line.trim()];
}

function looksLikePhone(value: string): boolean {
  return PHONE_SHAPE.test(value) && (value.match(/\d/g)?.length ?? 0) >= 3;
}

/** Une entree deja decoupee : colonnes d un CSV, ou morceaux d une ligne collee. */
export type GuestEntry = { line: number; source: string; fullName: string; phone: string | null; group: string | null };

/**
 * Annotation commune au copier-coller et au CSV : memes controles de nom, de
 * numero et de doublons, quelle que soit la provenance. Deux chemins qui
 * verifieraient chacun a leur facon finiraient par diverger.
 */
export function annotateEntries(
  entries: GuestEntry[],
  options: { defaultCountry?: string; existing?: ExistingGuest[] } = {},
): ImportRow[] {
  const { defaultCountry = "CM", existing = [] } = options;
  const rows = entries.map((entry): ImportRow => {
    const fullName = entry.fullName.trim();
    const split = splitName(fullName);
    const issues: ImportIssue[] = [];
    let phoneE164: string | null = null;
    if (!fullName) issues.push("missing_name");
    else if (!split.separable) issues.push("name_not_separable");

    if (entry.phone) {
      const phone = normalizePhone(entry.phone, defaultCountry);
      phoneE164 = phone.e164;
      if (phone.issue) issues.push(phone.issue);
    } else {
      issues.push("no_phone");
    }

    return {
      line: entry.line,
      source: entry.source,
      fullName,
      firstName: split.firstName,
      lastName: split.lastName,
      phoneRaw: entry.phone,
      phoneE164,
      // Sans groupe, la personne forme son propre groupe.
      groupName: entry.group?.trim() || fullName,
      issues,
      duplicateOf: null,
    };
  });
  markDuplicates(rows, existing);
  return rows;
}

export function parsePastedGuests(
  text: string,
  options: { defaultCountry?: string; existing?: ExistingGuest[] } = {},
): ImportRow[] {
  const entries: GuestEntry[] = [];
  text.split(/\r?\n/).forEach((rawLine, index) => {
    const source = rawLine.trim();
    if (!source) return;
    if (entries.length === 0 && HEADER.test(source)) return;

    const parts = splitLine(source);
    const phonePart = parts.find(looksLikePhone) ?? null;
    const texts = parts.filter((p) => p !== phonePart);
    entries.push({ line: index + 1, source, fullName: texts[0] ?? "", phone: phonePart, group: texts[1] ?? null });
  });
  return annotateEntries(entries, options);
}

/**
 * Doublons, dans le collage ET contre la liste deja en base (§8.2).
 * - meme numero : doublon certain ;
 * - meme nom (cle tolerante) : doublon probable.
 * Seule la seconde occurrence est marquee : la premiere reste importable.
 */
export function markDuplicates(rows: ImportRow[], existing: ExistingGuest[] = []): void {
  const phones = new Map<string, string>();
  const names = new Map<string, string>();

  for (const guest of existing) {
    const label = `deja invite (${guest.groupName})`;
    if (guest.phoneE164) phones.set(guest.phoneE164, label);
    const key = nameKey(guest.firstName, guest.lastName);
    if (key) names.set(key, label);
  }

  for (const row of rows) {
    row.issues = row.issues.filter((i) => i !== "duplicate_phone" && i !== "probable_duplicate");
    row.duplicateOf = null;
    const here = `ligne ${row.line}`;

    if (row.phoneE164) {
      const seen = phones.get(row.phoneE164);
      if (seen) {
        row.issues.push("duplicate_phone");
        row.duplicateOf = seen;
      } else phones.set(row.phoneE164, here);
    }

    const key = nameKey(row.firstName, row.lastName);
    if (key) {
      const seen = names.get(key);
      if (seen && !row.issues.includes("duplicate_phone")) {
        row.issues.push("probable_duplicate");
        row.duplicateOf = seen;
      } else if (!seen) names.set(key, here);
    }
  }
}

export type ImportGroup = { name: string; members: ImportRow[] };

/** Regroupe les lignes par nom de groupe, sans tenir compte de la casse. */
export function groupRows(rows: ImportRow[]): ImportGroup[] {
  const groups = new Map<string, ImportGroup>();
  for (const row of rows) {
    const key = nameKey(row.groupName) || `ligne-${row.line}`;
    const group = groups.get(key) ?? { name: row.groupName, members: [] };
    group.members.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export const IMPORT_ISSUE_LABELS: Record<ImportIssue, string> = {
  ambiguous: "Caractere ambigu dans le numero",
  invalid: "Numero invalide",
  incomplete: "Numero incomplet",
  no_phone: "Sans numero",
  name_not_separable: "Prenom et nom non separables",
  duplicate_phone: "Numero deja present",
  probable_duplicate: "Doublon probable",
  missing_name: "Nom manquant",
};

/** Problemes qui empechent d envoyer une invitation, par opposition aux simples avertissements. */
export const BLOCKING_ISSUES: ReadonlySet<ImportIssue> = new Set(["missing_name", "duplicate_phone"]);
