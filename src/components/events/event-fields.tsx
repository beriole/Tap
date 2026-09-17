"use client";

import { Plus, Trash2 } from "lucide-react";
import { EVENT_TIMEZONES } from "@/lib/events/time";
import { Button, Field, Select, TextInput } from "./form-kit";

/**
 * Champs partages par l assistant de creation et l ecran Contenu : une seule
 * definition, pour qu un evenement se decrive de la meme maniere partout.
 */

export type EventInfoDraft = {
  type: "WEDDING" | "BIRTHDAY" | "CORPORATE" | "MEMORIAL" | "OTHER";
  title: string;
  hosts: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: string;
};

export type VenueDraft = { label: string; name: string; address: string; landmark: string; startsAt: string };

export const EVENT_TYPE_OPTIONS = [
  { value: "WEDDING", label: "Mariage", titled: (h: string) => `Mariage de ${h}` },
  { value: "BIRTHDAY", label: "Anniversaire", titled: (h: string) => `Anniversaire de ${h}` },
  { value: "CORPORATE", label: "Entreprise", titled: (h: string) => h },
  { value: "MEMORIAL", label: "Hommage", titled: (h: string) => `En memoire de ${h}` },
  { value: "OTHER", label: "Autre", titled: (h: string) => h },
] as const;

export const HOSTS_HINT: Record<EventInfoDraft["type"], { label: string; placeholder: string }> = {
  WEDDING: { label: "Les maries", placeholder: "Beriole & Anna" },
  BIRTHDAY: { label: "Qui fete son anniversaire ?", placeholder: "Maeva" },
  CORPORATE: { label: "Nom de l evenement", placeholder: "Lancement Atelier Sahel 2027" },
  MEMORIAL: { label: "En memoire de", placeholder: "Papa Joseph Mbarga" },
  OTHER: { label: "Nom de l evenement", placeholder: "Bapteme de Nathan" },
};

export const emptyVenue = (label = ""): VenueDraft => ({ label, name: "", address: "", landmark: "", startsAt: "" });

export function suggestedTitle(type: EventInfoDraft["type"], hosts: string): string {
  const option = EVENT_TYPE_OPTIONS.find((o) => o.value === type);
  return hosts.trim() && option ? option.titled(hosts.trim()) : "";
}

export function EventInfoFields({
  draft,
  onChange,
  errors = {},
  titleTouched,
}: {
  draft: EventInfoDraft;
  onChange: (next: EventInfoDraft, touchedTitle?: boolean) => void;
  errors?: Partial<Record<keyof EventInfoDraft, string>>;
  titleTouched: boolean;
}) {
  const set = (patch: Partial<EventInfoDraft>) => {
    const next = { ...draft, ...patch };
    // Tant que l organisateur n a pas ecrit son propre titre, il suit le type et les hotes.
    if (!titleTouched && ("hosts" in patch || "type" in patch)) next.title = suggestedTitle(next.type, next.hosts);
    onChange(next);
  };
  const hostsHint = HOSTS_HINT[draft.type];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-[0.78rem] text-[var(--muted)]">Type d evenement</legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-xl border border-[var(--console-hairline)] px-4 py-2.5 text-[0.87rem] transition-colors has-[:checked]:border-[var(--brand-ink)] has-[:checked]:bg-[var(--brand-ink)] has-[:checked]:text-[var(--brand-paper)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--brand-copper)]"
            >
              <input
                type="radio"
                name="event-type"
                value={option.value}
                checked={draft.type === option.value}
                onChange={() => set({ type: option.value })}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={hostsHint.label} error={errors.hosts}>
        <TextInput
          name="hosts"
          value={draft.hosts}
          placeholder={hostsHint.placeholder}
          aria-invalid={Boolean(errors.hosts)}
          onChange={(e) => set({ hosts: e.target.value })}
        />
      </Field>
      <Field label="Titre" hint="Propose d apres les hotes ; modifiable." error={errors.title}>
        <TextInput
          name="title"
          value={draft.title}
          aria-invalid={Boolean(errors.title)}
          onChange={(e) => onChange({ ...draft, title: e.target.value }, true)}
        />
      </Field>

      <Field label="Debut" error={errors.startsAt}>
        <TextInput
          type="datetime-local"
          name="startsAt"
          value={draft.startsAt}
          aria-invalid={Boolean(errors.startsAt)}
          onChange={(e) => set({ startsAt: e.target.value })}
        />
      </Field>
      <Field label="Fin (facultatif)" error={errors.endsAt}>
        <TextInput
          type="datetime-local"
          name="endsAt"
          value={draft.endsAt}
          min={draft.startsAt || undefined}
          aria-invalid={Boolean(errors.endsAt)}
          onChange={(e) => set({ endsAt: e.target.value })}
        />
      </Field>

      <Field label="Fuseau horaire du lieu" hint="Les heures sont celles du lieu, d ou que vous les saisissiez.">
        <Select name="timezone" value={draft.timezone} onChange={(e) => set({ timezone: e.target.value })}>
          {EVENT_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Capacite du lieu (facultatif)" hint="Pour etre alerte en cas de depassement." error={errors.capacity}>
        <TextInput
          type="number"
          inputMode="numeric"
          min={1}
          name="capacity"
          value={draft.capacity}
          aria-invalid={Boolean(errors.capacity)}
          onChange={(e) => set({ capacity: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function VenueFields({
  venues,
  onChange,
}: {
  venues: VenueDraft[];
  onChange: (venues: VenueDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<VenueDraft>) =>
    onChange(venues.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-4">
      {venues.map((venue, index) => (
        <div key={index} className="rounded-2xl border border-[var(--console-hairline)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Moment">
              <TextInput
                value={venue.label}
                placeholder="Ceremonie, Reception..."
                onChange={(e) => update(index, { label: e.target.value })}
              />
            </Field>
            <Field label="Heure (facultatif)">
              <TextInput type="datetime-local" value={venue.startsAt} onChange={(e) => update(index, { startsAt: e.target.value })} />
            </Field>
            <Field label="Nom du lieu">
              <TextInput value={venue.name} placeholder="Hilton Yaounde" onChange={(e) => update(index, { name: e.target.value })} />
            </Field>
            <Field label="Adresse">
              <TextInput value={venue.address} placeholder="Boulevard du 20 Mai, Yaounde" onChange={(e) => update(index, { address: e.target.value })} />
            </Field>
            <Field label="Repere (facultatif)" hint="Souvent plus utile qu une adresse." className="sm:col-span-2">
              <TextInput value={venue.landmark} placeholder="Face a la poste centrale" onChange={(e) => update(index, { landmark: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="danger" onClick={() => onChange(venues.filter((_, i) => i !== index))}>
              <Trash2 className="size-4" aria-hidden /> Retirer ce lieu
            </Button>
          </div>
        </div>
      ))}
      {venues.length < 6 && (
        <Button variant="secondary" onClick={() => onChange([...venues, emptyVenue(venues.length === 0 ? "Ceremonie" : "Reception")])}>
          <Plus className="size-4" aria-hidden /> Ajouter un lieu
        </Button>
      )}
    </div>
  );
}

/** Brouillon → corps de requete. Les champs vides deviennent null, jamais "". */
export function infoPayload(draft: EventInfoDraft) {
  return {
    type: draft.type,
    title: draft.title.trim(),
    hosts: draft.hosts.trim(),
    startsAt: draft.startsAt,
    endsAt: draft.endsAt || null,
    timezone: draft.timezone,
    capacity: draft.capacity ? Number(draft.capacity) : null,
  };
}

export function venuesPayload(venues: VenueDraft[]) {
  return venues
    .filter((v) => v.name.trim() || v.address.trim())
    .map((v) => ({
      label: v.label.trim() || "Lieu",
      name: v.name.trim(),
      address: v.address.trim(),
      landmark: v.landmark.trim() || null,
      startsAt: v.startsAt || null,
    }));
}

/** Premier message d erreur zod, rattache au champ concerne. */
export function fieldErrors(issues: { path: (string | number)[]; message: string }[] | undefined) {
  const out: Record<string, string> = {};
  for (const issue of issues ?? []) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
