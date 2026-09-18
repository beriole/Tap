/**
 * Lecture d un fichier Excel dans le navigateur (cahier §8.3), chargee a la
 * demande : la bibliotheque ne pese que sur l ecran d import, jamais sur
 * l invitation.
 *
 * On rend des lignes de texte, exactement comme le CSV : la suite (roles de
 * colonnes, controles, doublons) est la meme.
 */
export async function readXlsxRows(file: File): Promise<string[][]> {
  const { default: readXlsxFile } = await import("read-excel-file");
  const rows = await readXlsxFile(file);
  return rows
    .map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return "";
        // Un numero saisi comme nombre a perdu son zero initial (699123456 → "699123456" : ok,
        // mais 0699... → "699..." : l organisateur le voit a la relecture, on n invente rien).
        if (cell instanceof Date) return cell.toISOString().slice(0, 10);
        return String(cell).trim();
      }),
    )
    .filter((row) => row.some((cell) => cell !== ""));
}
