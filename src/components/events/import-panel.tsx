"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ClipboardPaste, FileSpreadsheet } from "lucide-react";
import { Pill } from "@/components/app/ui";
import { splitName } from "@/lib/events/names";
import {
  BLOCKING_ISSUES,
  groupRows,
  IMPORT_ISSUE_LABELS,
  markDuplicates,
  type ExistingGuest,
  type ImportRow,
} from "@/lib/events/paste-import";
import { normalizePhone } from "@/lib/events/phone";
import {
  COLUMN_ROLES,
  csvToEntries,
  decodeCsvBytes,
  guessColumnRoles,
  looksLikeHeader,
  parseCsv,
  type ColumnRole,
} from "@/lib/events/csv";
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson, TextArea } from "./form-kit";

/**
 * Import par copier-coller ou fichier CSV, avec ecran de validation (§8.2, §8.3).
 *
 * Le fichier est lu DANS le navigateur (encodage, separateur, colonnes) : il
 * ne quitte jamais le poste. Seules les lignes retenues partent a l analyse,
 * qui applique exactement les controles du copier-coller.
 *
 * Deux temps, jamais un : on colle, on RELIT, on importe. Chaque ligne montre
 * sa source et ce qui cloche ; une correction relance les controles sur place
 * (numero, doublons) sans repasser par le serveur. Le serveur revalide tout a
 * l enregistrement de toute facon.
 *
 * Charge a la demande (next/dynamic) : la normalisation des numeros pese
 * son poids et ne sert qu ici.
 */

type Row = ImportRow & { include: boolean };

const PLACEHOLDER = `Paul NGONO - 699 12 34 56 - Famille Ngono
Brigitte Ngono ; 677 88 99 00 ; Famille Ngono
Samuel Fotso    +237 655 44 33 22
Tante Rose`;

export function ImportPanel({
  eventId,
  defaultCountry,
  onDone,
  onCancel,
}: {
  eventId: string;
  defaultCountry: string;
  onDone: (created: number) => void;
  onCancel: () => void;
}) {
  const [source, setSource] = useState<"paste" | "csv">("paste");
  const [text, setText] = useState("");
  const [csv, setCsv] = useState<{
    name: string;
    rows: string[][];
    roles: ColumnRole[];
    hasHeader: boolean;
  } | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [existing, setExisting] = useState<ExistingGuest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyse() {
    setBusy(true);
    setError(null);
    const body =
      source === "csv" && csv
        ? { entries: csvToEntries(csv.rows, csv.roles, csv.hasHeader) }
        : { text };
    const result = await sendJson<{ rows: ImportRow[]; existing: ExistingGuest[] }>(
      `/api/organizer/events/${eventId}/import`,
      "POST",
      body,
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (result.data.rows.length === 0) return setError("Aucune ligne reconnue.");
    setExisting(result.data.existing);
    setRows(
      result.data.rows.map((r) => ({
        ...r,
        include: !r.issues.some((i) => BLOCKING_ISSUES.has(i)),
      })),
    );
  }

  /** Correction d une ligne : on refait les controles, localement. */
  function edit(
    line: number,
    patch: Partial<Pick<Row, "fullName" | "phoneRaw" | "groupName" | "include">>,
  ) {
    if (!rows) return;
    // Copie de CHAQUE ligne : markDuplicates modifie ses entrees, et l etat
    // React precedent ne doit jamais etre mute.
    const next = rows.map((row) => {
      if (row.line !== line) return { ...row, issues: [...row.issues] };
      const updated = { ...row, ...patch };
      if ("fullName" in patch || "phoneRaw" in patch) {
        const split = splitName(updated.fullName);
        const phone = updated.phoneRaw?.trim()
          ? normalizePhone(updated.phoneRaw, defaultCountry)
          : null;
        updated.firstName = split.firstName;
        updated.lastName = split.lastName;
        updated.phoneE164 = phone?.e164 ?? null;
        updated.issues = [
          ...(!updated.fullName.trim()
            ? (["missing_name"] as const)
            : !split.separable
              ? (["name_not_separable"] as const)
              : []),
          ...(phone ? (phone.issue ? [phone.issue] : []) : (["no_phone"] as const)),
        ];
      }
      return updated;
    });
    // Memes regles que le serveur, contre la base ET entre lignes cochees :
    // une ligne decochee ne rend pas l autre "doublon".
    for (const row of next)
      if (!row.include)
        row.issues = row.issues.filter(
          (i) => i !== "duplicate_phone" && i !== "probable_duplicate",
        );
    markDuplicates(
      next.filter((r) => r.include),
      existing,
    );
    setRows([...next]);
  }

  const included = useMemo(() => (rows ?? []).filter((r) => r.include), [rows]);
  const groups = useMemo(() => groupRows(included), [included]);
  const stats = useMemo(() => {
    const all = rows ?? [];
    return {
      total: all.length,
      warnings: all.filter((r) => r.issues.length > 0).length,
      duplicates: all.filter(
        (r) => r.issues.includes("duplicate_phone") || r.issues.includes("probable_duplicate"),
      ).length,
      blocked: included.filter((r) => r.issues.some((i) => BLOCKING_ISSUES.has(i))).length,
    };
  }, [rows, included]);

  async function commit() {
    setBusy(true);
    setError(null);
    const payload = groups.map((group) => ({
      name: group.name.trim() || group.members[0]!.fullName,
      maxSeats: Math.max(group.members.length, 1),
      category: null,
      internalNote: null,
      tags: [],
      guests: group.members.map((m) => ({
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phoneRaw?.trim() || null,
        ageCategory: "ADULT" as const,
      })),
    }));
    const result = await sendJson<{ created: number }>(
      `/api/organizer/events/${eventId}/import`,
      "PUT",
      { groups: payload },
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onDone(result.data.created);
  }

  async function readFile(file: File) {
    setError(null);
    if (file.size > 2 * 1024 * 1024) return setError("Fichier trop volumineux (2 Mo maximum).");
    if (/\.(xlsx?|ods)$/i.test(file.name)) {
      return setError(
        "Fichier Excel : enregistrez-le d abord au format CSV (Fichier > Enregistrer sous > CSV), ou copiez-collez les colonnes.",
      );
    }
    const rowsRead = parseCsv(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
    if (rowsRead.length === 0) return setError("Ce fichier ne contient aucune ligne.");
    const hasHeader = looksLikeHeader(rowsRead[0]!);
    const width = Math.max(...rowsRead.map((r) => r.length));
    const guessed = hasHeader ? guessColumnRoles(rowsRead[0]!) : [];
    // Sans en-tete : premiere colonne = nom, deuxieme = telephone ; l organisateur corrige.
    const roles = Array.from(
      { length: width },
      (_, i): ColumnRole => guessed[i] ?? (i === 0 ? "fullName" : i === 1 ? "phone" : "ignore"),
    );
    setCsv({ name: file.name, rows: rowsRead, roles, hasHeader });
  }

  const csvReady = Boolean(
    csv && csv.roles.some((r) => r === "fullName" || r === "firstName" || r === "lastName"),
  );

  if (!rows) {
    return (
      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Source de la liste"
          className="flex w-fit gap-1 rounded-xl bg-[var(--console-paper)] p-1"
        >
          {(
            [
              ["paste", "Coller une liste", ClipboardPaste],
              ["csv", "Fichier CSV", FileSpreadsheet],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={source === key}
              onClick={() => {
                setSource(key);
                setError(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[0.84rem] transition-colors",
                source === key
                  ? "bg-[var(--console-card)] font-semibold shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>

        {source === "csv" && (
          <div className="space-y-4">
            <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
              Un fichier CSV exporte d Excel, de Google Sheets ou de vos contacts. Il est lu sur
              votre appareil ; rien n est enregistre avant votre relecture.
            </p>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--console-hairline)] px-4 py-3 text-[0.87rem] hover:border-[var(--brand-copper)]">
              <FileSpreadsheet className="size-4 text-[var(--muted)]" aria-hidden />
              {csv
                ? `${csv.name} · ${csv.rows.length - (csv.hasHeader ? 1 : 0)} lignes`
                : "Choisir un fichier CSV"}
              <input
                type="file"
                accept=".csv,text/csv,text/plain,.xlsx,.xls"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {csv && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[0.84rem]">
                  <input
                    type="checkbox"
                    checked={csv.hasHeader}
                    onChange={(e) => setCsv({ ...csv, hasHeader: e.target.checked })}
                    className="size-4 accent-[var(--brand-copper-deep)]"
                  />
                  La premiere ligne contient les titres des colonnes
                </label>
                <div className="overflow-x-auto rounded-2xl border border-[var(--console-hairline)]">
                  <table className="w-full min-w-[32rem] text-left text-[0.82rem]">
                    <thead>
                      <tr className="border-b border-[var(--console-hairline)] bg-[var(--console-paper)]">
                        {csv.roles.map((role, i) => (
                          <th key={i} className="p-2 align-top font-normal">
                            <select
                              aria-label={`Colonne ${i + 1}`}
                              value={role}
                              onChange={(e) =>
                                setCsv({
                                  ...csv,
                                  roles: csv.roles.map((r, j) =>
                                    j === i ? (e.target.value as ColumnRole) : r,
                                  ),
                                })
                              }
                              className="w-full rounded-lg border border-[var(--console-hairline)] bg-[var(--console-card)] px-2 py-1.5 text-[0.82rem]"
                            >
                              {COLUMN_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            {csv.hasHeader && (
                              <span className="mt-1 block truncate text-[0.72rem] text-[var(--muted)]">
                                {csv.rows[0]![i]}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--console-hairline)]">
                      {csv.rows
                        .slice(csv.hasHeader ? 1 : 0, (csv.hasHeader ? 1 : 0) + 4)
                        .map((row, r) => (
                          <tr key={r}>
                            {csv.roles.map((role, i) => (
                              <td
                                key={i}
                                className={cn(
                                  "max-w-[12rem] truncate p-2",
                                  role === "ignore" && "text-[var(--muted)] line-through",
                                )}
                              >
                                {row[i]}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!csvReady && (
                  <FormMessage tone="error">Indiquez au moins une colonne de nom.</FormMessage>
                )}
              </div>
            )}
          </div>
        )}

        {source === "paste" && (
          <>
            <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
              Collez votre liste depuis Excel, une note ou un message : une personne par ligne. Nom,
              telephone et groupe, dans l ordre que vous voulez, separes par un tiret, un
              point-virgule ou une tabulation. Rien n est enregistre avant votre relecture.
            </p>
            <TextArea
              aria-label="Liste d invites a coller"
              rows={9}
              value={text}
              placeholder={PLACEHOLDER}
              onChange={(e) => setText(e.target.value)}
              className="font-[family-name:var(--font-mono)] text-[0.85rem]"
            />
          </>
        )}
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <div className="flex flex-wrap gap-2">
          <Button
            busy={busy}
            disabled={source === "csv" ? !csvReady : !text.trim()}
            onClick={analyse}
          >
            <ClipboardPaste className="size-4" aria-hidden /> Analyser la liste
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[0.84rem]">
        <Pill tone="idle">{stats.total} lignes</Pill>
        <Pill tone="live">
          {included.length} a importer · {groups.length} groupe{groups.length > 1 ? "s" : ""}
        </Pill>
        {stats.warnings > 0 && <Pill tone="warn">{stats.warnings} a verifier</Pill>}
        {stats.duplicates > 0 && <Pill tone="stop">{stats.duplicates} doublon(s)</Pill>}
      </div>

      <ul className="divide-y divide-[var(--console-hairline)] overflow-hidden rounded-2xl border border-[var(--console-hairline)]">
        {rows.map((row) => (
          <li
            key={row.line}
            className={cn(
              "grid grid-cols-2 gap-x-2 gap-y-1 p-3 sm:grid-cols-[auto_1.3fr_1fr_1fr] sm:items-start sm:gap-2",
              !row.include && "bg-[var(--console-paper)] opacity-60",
            )}
          >
            <label className="col-span-2 flex items-center gap-2 pt-2 text-[0.76rem] text-[var(--muted)] sm:col-span-1">
              <input
                type="checkbox"
                checked={row.include}
                onChange={(e) => edit(row.line, { include: e.target.checked })}
                className="size-4 accent-[var(--brand-copper-deep)]"
                aria-label={`Importer la ligne ${row.line}`}
              />
              <span className="tabular-nums">L{row.line}</span>
            </label>
            <input
              aria-label={`Nom, ligne ${row.line}`}
              value={row.fullName}
              onChange={(e) => edit(row.line, { fullName: e.target.value })}
              className="col-span-2 rounded-lg font-medium sm:col-span-1 sm:font-normal border border-transparent bg-transparent px-2 py-1.5 text-[0.9rem] hover:border-[var(--console-hairline)] focus:border-[var(--brand-copper)] focus:bg-white focus:outline-none"
            />
            <div>
              <input
                aria-label={`Telephone, ligne ${row.line}`}
                value={row.phoneRaw ?? ""}
                placeholder="Sans numero"
                inputMode="tel"
                onChange={(e) => edit(row.line, { phoneRaw: e.target.value })}
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-[family-name:var(--font-mono)] text-[0.84rem] hover:border-[var(--console-hairline)] focus:border-[var(--brand-copper)] focus:bg-white focus:outline-none"
              />
              {row.phoneE164 && (
                <span className="block px-2 text-[0.72rem] text-[var(--state-live)]">
                  {row.phoneE164}
                </span>
              )}
            </div>
            <input
              aria-label={`Groupe, ligne ${row.line}`}
              value={row.groupName}
              onChange={(e) => edit(row.line, { groupName: e.target.value })}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[0.86rem] text-[var(--muted)] hover:border-[var(--console-hairline)] focus:border-[var(--brand-copper)] focus:bg-white focus:outline-none"
            />
            {row.issues.length > 0 && (
              <p className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.74rem] sm:col-span-4 sm:pl-14">
                <AlertTriangle className="size-3.5 text-[var(--state-warn)]" aria-hidden />
                {row.issues.map((issue) => (
                  <span
                    key={issue}
                    className={
                      BLOCKING_ISSUES.has(issue)
                        ? "text-[var(--state-stop)]"
                        : "text-[var(--state-warn)]"
                    }
                  >
                    {IMPORT_ISSUE_LABELS[issue]}
                    {row.duplicateOf &&
                    (issue === "duplicate_phone" || issue === "probable_duplicate")
                      ? ` - ${row.duplicateOf}`
                      : ""}
                  </span>
                ))}
                <span className="basis-full text-[var(--muted)] sm:basis-auto">
                  Source : « {row.source} »
                </span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {stats.blocked > 0 && (
        <FormMessage tone="error">
          {stats.blocked} ligne(s) cochee(s) ont un probleme bloquant (nom manquant ou numero deja
          present). Corrigez-les ou decochez-les.
        </FormMessage>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="flex flex-wrap gap-2">
        <Button busy={busy} disabled={included.length === 0 || stats.blocked > 0} onClick={commit}>
          <Check className="size-4" aria-hidden /> Importer {groups.length} groupe
          {groups.length > 1 ? "s" : ""}
        </Button>
        <Button variant="secondary" onClick={() => setRows(null)}>
          Modifier le collage
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default ImportPanel;
