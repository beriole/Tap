"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { displayName, splitName } from "@/lib/events/names";
import { Button, Field, FormMessage, Select, TextArea, TextInput } from "./form-kit";

/**
 * Edition d un groupe : une famille, un couple, une personne seule.
 *
 * Pense pour la saisie rapide au clavier (§2.1) : un seul champ "nom complet"
 * par personne - prenom et nom sont separes automatiquement, capitales
 * comprises -, Entree enregistre, et le nom du groupe se deduit tant qu on ne
 * l a pas ecrit soi-meme.
 */

export type GuestDraft = {
  id?: string;
  fullName: string;
  phone: string;
  ageCategory: "ADULT" | "CHILD" | "BABY";
};

export type GroupDraft = {
  id?: string;
  name: string;
  maxSeats: number;
  category: string;
  internalNote: string;
  guests: GuestDraft[];
};

export const emptyGroup = (): GroupDraft => ({
  name: "",
  maxSeats: 1,
  category: "",
  internalNote: "",
  guests: [{ fullName: "", phone: "", ageCategory: "ADULT" }],
});

function suggestedGroupName(guests: GuestDraft[]): string {
  const named = guests.filter((g) => g.fullName.trim());
  if (named.length === 0) return "";
  if (named.length === 1) return named[0]!.fullName.trim();
  const last = splitName(named[0]!.fullName).lastName;
  return last ? `Famille ${last}` : `${named[0]!.fullName.trim()} et leurs proches`;
}

export function toGroupPayload(draft: GroupDraft) {
  return {
    name: draft.name.trim() || suggestedGroupName(draft.guests),
    maxSeats: draft.maxSeats,
    category: draft.category.trim() || null,
    internalNote: draft.internalNote.trim() || null,
    tags: [],
    guests: draft.guests
      .filter((g) => g.fullName.trim() || g.phone.trim())
      .map((g) => {
        const split = splitName(g.fullName);
        return { id: g.id, firstName: split.firstName, lastName: split.lastName, phone: g.phone.trim() || null, ageCategory: g.ageCategory };
      }),
  };
}

export function GroupEditor({
  initial,
  canEditSensitive,
  onSave,
  onCancel,
  onDelete,
  hasResponse,
}: {
  initial: GroupDraft;
  canEditSensitive: boolean;
  onSave: (draft: GroupDraft) => Promise<string | null>;
  onCancel: () => void;
  onDelete?: () => Promise<string | null>;
  hasResponse?: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [nameTouched, setNameTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputs = useRef<(HTMLInputElement | null)[]>([]);

  const people = draft.guests.filter((g) => g.fullName.trim() || g.phone.trim()).length;

  function setGuests(guests: GuestDraft[]) {
    setDraft((d) => ({
      ...d,
      guests,
      // Le quota suit la liste tant qu il ne lui est pas inferieur.
      maxSeats: Math.max(d.maxSeats, guests.filter((g) => g.fullName.trim() || g.phone.trim()).length, 1),
      name: nameTouched ? d.name : suggestedGroupName(guests),
    }));
  }

  function addPerson() {
    setGuests([...draft.guests, { fullName: "", phone: "", ageCategory: draft.guests.length >= 2 ? "CHILD" : "ADULT" }]);
    requestAnimationFrame(() => nameInputs.current[draft.guests.length]?.focus());
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (people === 0) {
      setError("Ajoutez au moins une personne.");
      return;
    }
    if (draft.maxSeats < people) {
      setError("Plus de personnes que de places.");
      return;
    }
    setBusy("save");
    setError(await onSave(draft));
    setBusy(null);
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-label={initial.id ? "Modifier le groupe" : "Nouveau groupe"}>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Personnes
        </legend>
        {draft.guests.map((guest, index) => (
          <div key={guest.id ?? `new-${index}`} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.4fr_1fr_8rem_auto]">
            <Field label={index === 0 ? "Nom complet" : `Personne ${index + 1}`} className="col-span-2 sm:col-span-1">
              <TextInput
                ref={(el) => {
                  nameInputs.current[index] = el;
                }}
                value={guest.fullName}
                autoFocus={index === 0 && !initial.id}
                placeholder={index === 0 ? "Paul NGONO" : "Prenom Nom"}
                autoComplete="off"
                onChange={(e) => setGuests(draft.guests.map((g, i) => (i === index ? { ...g, fullName: e.target.value } : g)))}
              />
            </Field>
            <Field label="Telephone" hint={index === 0 ? "Le lien sera envoye a ce numero." : undefined}>
              <TextInput
                type="tel"
                inputMode="tel"
                value={guest.phone}
                placeholder="699 12 34 56"
                autoComplete="off"
                onChange={(e) => setGuests(draft.guests.map((g, i) => (i === index ? { ...g, phone: e.target.value } : g)))}
              />
            </Field>
            <Field label="Age">
              <Select
                value={guest.ageCategory}
                onChange={(e) =>
                  setGuests(draft.guests.map((g, i) => (i === index ? { ...g, ageCategory: e.target.value as GuestDraft["ageCategory"] } : g)))
                }
              >
                <option value="ADULT">Adulte</option>
                <option value="CHILD">Enfant</option>
                <option value="BABY">Bebe</option>
              </Select>
            </Field>
            <div className="flex items-end pb-0.5">
              {draft.guests.length > 1 && (
                <button
                  type="button"
                  aria-label={`Retirer ${displayName(splitName(guest.fullName), `la personne ${index + 1}`)}`}
                  onClick={() => setGuests(draft.guests.filter((_, i) => i !== index))}
                  className="tap-target flex size-11 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--console-paper)] hover:text-[var(--state-stop)]"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        ))}
        {draft.guests.length < 30 && (
          <Button variant="secondary" onClick={addPerson}>
            <Plus className="size-4" aria-hidden /> Ajouter une personne
          </Button>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-[1.4fr_10rem_1fr]">
        <Field label="Nom du groupe" hint={nameTouched ? undefined : "Deduit des personnes ; modifiable."}>
          <TextInput
            value={draft.name}
            placeholder="Famille Ngono"
            onChange={(e) => {
              setNameTouched(true);
              setDraft({ ...draft, name: e.target.value });
            }}
          />
        </Field>
        <Field label="Places" hint={draft.maxSeats > people ? `dont ${draft.maxSeats - people} accompagnant(s) libre(s)` : "Aucun +1"}>
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              inputMode="numeric"
              min={Math.max(people, 1)}
              max={30}
              value={draft.maxSeats}
              onChange={(e) => setDraft({ ...draft, maxSeats: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </Field>
        <Field label="Categorie (facultatif)">
          <TextInput value={draft.category} placeholder="Famille de la mariee" onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        </Field>
      </div>

      {canEditSensitive && (
        <Field label="Note interne (jamais visible par l invite)">
          <TextArea
            rows={2}
            className="min-h-0"
            value={draft.internalNote}
            onChange={(e) => setDraft({ ...draft, internalNote: e.target.value })}
          />
        </Field>
      )}

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" busy={busy === "save"}>
          {initial.id ? "Enregistrer" : "Ajouter le groupe"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        {onDelete && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-[0.8rem] text-[var(--muted)]">
                  {hasResponse ? "Ce groupe a deja repondu. Supprimer quand meme ?" : "Supprimer ce groupe et son lien ?"}
                </span>
                <Button
                  variant="danger"
                  busy={busy === "delete"}
                  onClick={async () => {
                    setBusy("delete");
                    setError(await onDelete());
                    setBusy(null);
                  }}
                >
                  Oui, supprimer
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Non
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden /> Supprimer
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
