"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ClipboardPaste } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Button, FormMessage, sendJson, TextArea } from "./form-kit";

/**
 * Import par copier-coller avec ecran de validation (§8.2, §8.3).
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
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [existing, setExisting] = useState<ExistingGuest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyse() {
    setBusy(true);
    setError(null);
    const result = await sendJson<{ rows: ImportRow[]; existing: ExistingGuest[] }>(`/api/organizer/events/${eventId}/import`, "POST", { text });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (result.data.rows.length === 0) return setError("Aucune ligne reconnue.");
    setExisting(result.data.existing);
    setRows(result.data.rows.map((r) => ({ ...r, include: !r.issues.some((i) => BLOCKING_ISSUES.has(i)) })));
  }

  /** Correction d une ligne : on refait les controles, localement. */
  function edit(line: number, patch: Partial<Pick<Row, "fullName" | "phoneRaw" | "groupName" | "include">>) {
    if (!rows) return;
    // Copie de CHAQUE ligne : markDuplicates modifie ses entrees, et l etat
    // React precedent ne doit jamais etre mute.
    const next = rows.map((row) => {
      if (row.line !== line) return { ...row, issues: [...row.issues] };
      const updated = { ...row, ...patch };
      if ("fullName" in patch || "phoneRaw" in patch) {
        const split = splitName(updated.fullName);
        const phone = updated.phoneRaw?.trim() ? normalizePhone(updated.phoneRaw, defaultCountry) : null;
        updated.firstName = split.firstName;
        updated.lastName = split.lastName;
        updated.phoneE164 = phone?.e164 ?? null;
        updated.issues = [
          ...(!updated.fullName.trim() ? (["missing_name"] as const) : !split.separable ? (["name_not_separable"] as const) : []),
          ...(phone ? (phone.issue ? [phone.issue] : []) : (["no_phone"] as const)),
        ];
      }
      return updated;
    });
    // Memes regles que le serveur, contre la base ET entre lignes cochees :
    // une ligne decochee ne rend pas l autre "doublon".
    for (const row of next) if (!row.include) row.issues = row.issues.filter((i) => i !== "duplicate_phone" && i !== "probable_duplicate");
    markDuplicates(next.filter((r) => r.include), existing);
    setRows([...next]);
  }

  const included = useMemo(() => (rows ?? []).filter((r) => r.include), [rows]);
  const groups = useMemo(() => groupRows(included), [included]);
  const stats = useMemo(() => {
    const all = rows ?? [];
    return {
      total: all.length,
      warnings: all.filter((r) => r.issues.length > 0).length,
      duplicates: all.filter((r) => r.issues.includes("duplicate_phone") || r.issues.includes("probable_duplicate")).length,
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
    const result = await sendJson<{ created: number }>(`/api/organizer/events/${eventId}/import`, "PUT", { groups: payload });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onDone(result.data.created);
  }

  if (!rows) {
    return (
      <div className="space-y-4">
        <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
          Collez votre liste depuis Excel, une note ou un message : une personne par ligne. Nom, telephone et groupe, dans
          l ordre que vous voulez, separes par un tiret, un point-virgule ou une tabulation. Rien n est enregistre avant
          votre relecture.
        </p>
        <TextArea
          aria-label="Liste d invites a coller"
          rows={9}
          value={text}
          placeholder={PLACEHOLDER}
          onChange={(e) => setText(e.target.value)}
          className="font-[family-name:var(--font-mono)] text-[0.85rem]"
        />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <div className="flex flex-wrap gap-2">
          <Button busy={busy} disabled={!text.trim()} onClick={analyse}>
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
          <li key={row.line} className={cn("grid grid-cols-2 gap-x-2 gap-y-1 p-3 sm:grid-cols-[auto_1.3fr_1fr_1fr] sm:items-start sm:gap-2", !row.include && "bg-[var(--console-paper)] opacity-60")}>
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
              {row.phoneE164 && <span className="block px-2 text-[0.72rem] text-[var(--state-live)]">{row.phoneE164}</span>}
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
                  <span key={issue} className={BLOCKING_ISSUES.has(issue) ? "text-[var(--state-stop)]" : "text-[var(--state-warn)]"}>
                    {IMPORT_ISSUE_LABELS[issue]}
                    {row.duplicateOf && (issue === "duplicate_phone" || issue === "probable_duplicate") ? ` - ${row.duplicateOf}` : ""}
                  </span>
                ))}
                <span className="basis-full text-[var(--muted)] sm:basis-auto">Source : « {row.source} »</span>
              </p>
            )}
          </li>
        ))}
      </ul>

      {stats.blocked > 0 && (
        <FormMessage tone="error">
          {stats.blocked} ligne(s) cochee(s) ont un probleme bloquant (nom manquant ou numero deja present). Corrigez-les ou
          decochez-les.
        </FormMessage>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="flex flex-wrap gap-2">
        <Button busy={busy} disabled={included.length === 0 || stats.blocked > 0} onClick={commit}>
          <Check className="size-4" aria-hidden /> Importer {groups.length} groupe{groups.length > 1 ? "s" : ""}
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
