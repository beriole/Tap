/**
 * Lecture de fichiers CSV d invites (cahier §8.3) - logique pure, testee.
 *
 * Le fichier le plus probable est un export Excel sous Windows en francais :
 * separateur point-virgule, encodage Windows-1252 (les accents deviennent des
 * losanges si on le lit en UTF-8), parfois un BOM. On gere ces trois cas sans
 * demander quoi que ce soit a l organisateur.
 */

/** UTF-8 si le fichier est valide en UTF-8, sinon Windows-1252. */
export function decodeCsvBytes(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1252").decode(bytes);
  }
  return text.replace(/^﻿/, "");
}

/** Le separateur le plus frequent HORS guillemets sur les premieres lignes. */
export function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 10).join("\n");
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let quoted = false;
  for (const char of sample) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char]! += 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0]
    : ",";
}

/** RFC 4180 : guillemets, guillemets doubles echappes, retours a la ligne dans un champ. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }
  // Lignes entierement vides (fin de fichier Excel) ecartees.
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

export type ColumnRole = "fullName" | "firstName" | "lastName" | "phone" | "group" | "ignore";

export const COLUMN_ROLES: { value: ColumnRole; label: string }[] = [
  { value: "fullName", label: "Nom complet" },
  { value: "firstName", label: "Prénom" },
  { value: "lastName", label: "Nom" },
  { value: "phone", label: "Téléphone" },
  { value: "group", label: "Groupe / famille" },
  { value: "ignore", label: "Ne pas importer" },
];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Devine le role de chaque colonne d apres l en-tete ; l organisateur corrige si besoin. */
export function guessColumnRoles(header: string[]): ColumnRole[] {
  const roles = header.map((cell): ColumnRole => {
    const h = normalize(cell);
    if (/^(prenom|first ?name|given)/.test(h)) return "firstName";
    if (/^(nom de famille|last ?name|surname|family name)$/.test(h)) return "lastName";
    if (/(tel|phone|mobile|portable|whatsapp|numero|contact)/.test(h)) return "phone";
    if (/(groupe|famille|foyer|group|family|table|categorie)/.test(h)) return "group";
    if (/^(nom complet|nom et prenom|nom|name|invite|full ?name|personne)$/.test(h)) return "fullName";
    return "ignore";
  });
  // "Nom" seul a cote d une colonne "Prenom" est un nom de famille.
  if (roles.includes("firstName")) {
    return roles.map((r) => (r === "fullName" ? "lastName" : r));
  }
  return roles;
}

/** Une ligne d en-tete ? Oui si aucune cellule ne ressemble a un numero et qu un role est reconnu. */
export function looksLikeHeader(row: string[]): boolean {
  return !row.some((cell) => (cell.match(/\d/g)?.length ?? 0) >= 6) && guessColumnRoles(row).some((r) => r !== "ignore");
}

export type CsvEntry = { fullName: string; phone: string | null; group: string | null; line: number };

export function csvToEntries(rows: string[][], roles: ColumnRole[], hasHeader: boolean): CsvEntry[] {
  const at = (row: string[], role: ColumnRole) =>
    roles
      .map((r, i) => (r === role ? (row[i] ?? "").trim() : ""))
      .filter(Boolean)
      .join(" ");
  return rows.slice(hasHeader ? 1 : 0).flatMap((row, index) => {
    const fullName = at(row, "fullName") || [at(row, "firstName"), at(row, "lastName")].filter(Boolean).join(" ");
    const phone = at(row, "phone") || null;
    if (!fullName && !phone) return [];
    return [{ fullName, phone, group: at(row, "group") || null, line: index + (hasHeader ? 2 : 1) }];
  });
}
