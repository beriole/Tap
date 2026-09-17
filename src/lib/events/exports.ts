import { computeHeadcount, type HeadcountGroup } from "./headcount";

/**
 * Exports operationnels (cahier §9 "Exports", §22 "les exports correspondent
 * aux totaux affiches du dashboard").
 *
 * Les lignes sont derivees des MEMES groupes que computeHeadcount, avec les
 * MEMES regles de presence : la somme d un export vaut le chiffre du
 * dashboard par construction, et exports.test.ts le verifie sur des donnees
 * variees.
 *
 * Logique pure ; le chargement Prisma et la permission "exports" sont dans
 * la route.
 */

export type ExportGuest = HeadcountGroup["guests"][number] & {
  name: string;
  mealLabel: string | null;
  /** Texte des allergies ; null si absent ou si l export n y a pas droit */
  allergies: string | null;
};

// Omit : sans lui, `guests` garderait le type de base par intersection.
export type ExportGroup = Omit<HeadcountGroup, "guests"> & {
  name: string;
  category: string | null;
  primaryPhone: string | null;
  responseStatus: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  guests: ExportGuest[];
};

export type ExportKind = "guests" | "caterer" | "checkin";

export const EXPORT_LABELS: Record<ExportKind, { label: string; description: string }> = {
  guests: { label: "Tous les invites", description: "Un groupe par ligne : personnes, places, reponse, telephone." },
  caterer: { label: "Traiteur", description: "Une personne presente par ligne : menu, age, allergie si l organisateur y a droit." },
  checkin: { label: "Liste d accueil", description: "Groupes attendus, personnes et places : le plan B papier si le reseau tombe." },
};

const STATUS_LABEL = { PENDING: "Sans reponse", ATTENDING: "Present", DECLINED: "Absent", MAYBE: "Peut-etre" } as const;
const AGE_LABEL = { ADULT: "Adulte", CHILD: "Enfant", BABY: "Bebe" } as const;

/** Une personne compte comme presente si son groupe a confirme ET si elle est cochee. */
const isPresent = (group: ExportGroup, guest: ExportGuest) =>
  group.responseStatus === "ATTENDING" && guest.attending === true;

export function buildExportRows(kind: ExportKind, groups: readonly ExportGroup[]): string[][] {
  switch (kind) {
    case "guests":
      return [
        ["Groupe", "Categorie", "Personnes", "Places", "Reponse", "Presents", "Telephone"],
        ...groups.map((g) => [
          g.name,
          g.category ?? "",
          g.guests.filter((x) => !(x.isPlusOne && x.attending === false)).map((x) => x.name).join(", "),
          String(g.maxSeats),
          STATUS_LABEL[g.responseStatus],
          String(g.guests.filter((x) => isPresent(g, x)).length),
          g.primaryPhone ?? "",
        ]),
      ];
    case "caterer":
      return [
        ["Groupe", "Personne", "Age", "Menu", "Allergie / regime"],
        ...groups.flatMap((g) =>
          g.guests
            .filter((x) => isPresent(g, x))
            .map((x) => [g.name, x.name, AGE_LABEL[x.ageCategory], x.ageCategory === "BABY" ? "Aucun (bebe)" : (x.mealLabel ?? "Sans choix"), x.allergies ?? ""]),
        ),
      ];
    case "checkin":
      return [
        ["Groupe", "Personnes presentes", "Places", "Telephone", "Entree"],
        ...groups
          .filter((g) => g.responseStatus === "ATTENDING" && g.guests.some((x) => isPresent(g, x)))
          .sort((a, b) => a.name.localeCompare(b.name, "fr"))
          .map((g) => {
            const present = g.guests.filter((x) => isPresent(g, x));
            return [g.name, present.map((x) => x.name).join(", "), String(present.length), g.primaryPhone ?? "", ""];
          }),
      ];
  }
}

/**
 * Sommes de controle d un export, a comparer a computeHeadcount.
 * Utilisees par le test ET par la route, qui refuse d envoyer un fichier dont
 * les totaux ne colleraient pas au dashboard - plutot que de livrer au
 * traiteur un chiffre faux.
 */
export function exportTotals(kind: ExportKind, rows: string[][]): { people: number } {
  const body = rows.slice(1);
  switch (kind) {
    case "guests":
      return { people: body.reduce((n, r) => n + Number(r[5]), 0) };
    case "caterer":
      return { people: body.length };
    case "checkin":
      return { people: body.reduce((n, r) => n + Number(r[2]), 0) };
  }
}

export function exportMatchesHeadcount(kind: ExportKind, groups: readonly ExportGroup[]): boolean {
  return exportTotals(kind, buildExportRows(kind, groups)).people === computeHeadcount(groups).people.expected;
}

/**
 * CSV pour Excel en francais : point-virgule, BOM UTF-8 (sinon Excel lit les
 * accents en Windows-1252 et affiche des losanges), CRLF, guillemets doubles.
 * Une cellule qui commence par = + - @ est prefixee d une apostrophe : un
 * nom d invite "=HYPERLINK(...)" ne doit pas s executer dans le tableur.
 */
export function toCsv(rows: string[][]): string {
  const cell = (value: string) => {
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

/** Nom de fichier sans accent ni caractere reserve, quel que soit le titre. */
export function exportFileName(kind: ExportKind, title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);
  return `${slug || "evenement"}-${kind === "guests" ? "invites" : kind === "caterer" ? "traiteur" : "accueil"}.csv`;
}
