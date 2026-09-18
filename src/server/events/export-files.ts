import "server-only";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ExportKind } from "@/lib/events/exports";

/**
 * Fichiers d export au-dela du CSV (plan phase 9) : XLSX et PDF.
 *
 * Les deux prennent les MEMES lignes que le CSV (buildExportRows) : un seul
 * calcul, trois formats. Rien ici ne recompte quoi que ce soit.
 */

const TITLES: Record<ExportKind, string> = { guests: "Invités", caterer: "Traiteur", checkin: "Liste d’accueil" };

export async function toXlsx(kind: ExportKind, rows: string[][], eventTitle: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tap";
  const sheet = workbook.addWorksheet(TITLES[kind].slice(0, 31));
  const [header, ...body] = rows;
  sheet.addRow([eventTitle]).font = { bold: true, size: 14 };
  sheet.addRow([]);
  const head = sheet.addRow(header ?? []);
  head.font = { bold: true };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4EDE1" } };
  for (const r of body) {
    // Excel interprete "=..." comme une formule meme en XLSX : on force le texte.
    sheet.addRow(r.map((cell) => (/^[=+\-@]/.test(cell) ? { richText: [{ text: cell }] } : cell)));
  }
  sheet.columns.forEach((column, i) => {
    const longest = Math.max(...rows.map((r) => (r[i] ?? "").length), 8);
    column.width = Math.min(longest + 2, 48);
  });
  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: (header ?? []).length } };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * PDF de la liste d accueil : le plan B papier si le reseau tombe. Une ligne
 * par groupe, une case a cocher, tri alphabetique, numero de page. Police
 * standard (Helvetica) : aucun fichier de police a embarquer, PDF de
 * quelques dizaines de ko pour 200 groupes.
 *
 * pdf-lib n ecrit pas les caracteres hors WinAnsi avec Helvetica : les noms
 * gardent leurs accents (WinAnsi les couvre), les caracteres exotiques sont
 * remplaces par "?" plutot que de faire echouer le fichier.
 */
export async function toPdf(kind: ExportKind, rows: string[][], eventTitle: string, subtitle: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${TITLES[kind]} — ${eventTitle}`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ’…€]/g, "?");

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 40;
  const lineH = 18;
  const [header, ...body] = rows;
  const columns = header ?? [];
  // Largeurs : la premiere colonne (groupe) et la deuxieme (personnes) prennent la place.
  const usable = A4.w - margin * 2 - 16;
  const weights = columns.map((c, i) => (i === 0 ? 1.1 : i === 1 ? 2 : c.length > 12 ? 0.9 : 0.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / total) * usable);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;
  let pageNo = 1;

  const drawHeader = () => {
    page.drawText(safe(eventTitle), { x: margin, y, size: 14, font: bold });
    y -= 16;
    page.drawText(safe(`${TITLES[kind]} — ${subtitle}`), { x: margin, y, size: 9, font, color: rgb(0.4, 0.36, 0.32) });
    y -= 22;
    let x = margin + 16;
    columns.forEach((c, i) => {
      page.drawText(safe(c), { x, y, size: 8, font: bold, color: rgb(0.48, 0.36, 0.2) });
      x += widths[i]!;
    });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: A4.w - margin, y }, thickness: 0.6, color: rgb(0.85, 0.8, 0.72) });
    y -= lineH - 4;
  };
  const drawFooter = () => {
    page.drawText(`Page ${pageNo}`, { x: A4.w - margin - 40, y: margin / 2, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  };

  drawHeader();
  for (const r of body) {
    if (y < margin + lineH) {
      drawFooter();
      page = doc.addPage([A4.w, A4.h]);
      pageNo += 1;
      y = A4.h - margin;
      drawHeader();
    }
    // Case a cocher, pour le crayon.
    page.drawRectangle({ x: margin, y: y - 2, width: 9, height: 9, borderWidth: 0.7, borderColor: rgb(0.3, 0.3, 0.3) });
    let x = margin + 16;
    r.forEach((cell, i) => {
      const w = widths[i]! - 6;
      let text = safe(cell);
      while (text.length > 1 && font.widthOfTextAtSize(text, 9) > w) text = text.slice(0, -2) + "…";
      page.drawText(text, { x, y, size: 9, font: i === 0 ? bold : font });
      x += widths[i]!;
    });
    y -= lineH;
  }
  drawFooter();
  return doc.save();
}
