"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { SectionTitle, Surface } from "@/components/app/ui";
import type { SectionKind } from "@/lib/validations/event";
import { Button, Field, FormMessage, sendJson, TextArea, TextInput } from "./form-kit";
import {
  EventInfoFields,
  fieldErrors,
  infoPayload,
  VenueFields,
  venuesPayload,
  type EventInfoDraft,
  type VenueDraft,
} from "./event-fields";

/**
 * Ecran "Contenu" : informations, lieux et sections de la page evenement (§6.3).
 *
 * Trois blocs, trois boutons Enregistrer. Un seul bouton pour tout obligerait
 * a tout revalider au moindre accent corrige dans la FAQ - et une erreur dans
 * le menu bloquerait le changement d heure urgent.
 */

type ProgramData = { items: { time: string; label: string; venueLabel?: string | null }[] };
type DresscodeData = { text: string; palette: string[] };
type MenuData = { courses: { label: string; items: string[] }[] };
type FaqData = { items: { q: string; a: string }[] };
type CustomData = { text: string };

export type SectionDraft =
  | { kind: "program"; title: string; isVisible: boolean; data: ProgramData }
  | { kind: "dresscode"; title: string; isVisible: boolean; data: DresscodeData }
  | { kind: "menu"; title: string; isVisible: boolean; data: MenuData }
  | { kind: "faq"; title: string; isVisible: boolean; data: FaqData }
  | { kind: "custom"; title: string; isVisible: boolean; data: CustomData };

const KINDS: { kind: SectionKind; label: string; title: string; empty: () => SectionDraft }[] = [
  { kind: "program", label: "Programme", title: "Programme", empty: () => ({ kind: "program", title: "Programme", isVisible: true, data: { items: [{ time: "", label: "" }] } }) },
  { kind: "dresscode", label: "Dress code", title: "Dress code", empty: () => ({ kind: "dresscode", title: "Dress code", isVisible: true, data: { text: "", palette: [] } }) },
  { kind: "menu", label: "Menu", title: "Menu", empty: () => ({ kind: "menu", title: "Menu", isVisible: true, data: { courses: [{ label: "Entree", items: [""] }] } }) },
  { kind: "faq", label: "Questions pratiques", title: "Questions pratiques", empty: () => ({ kind: "faq", title: "Questions pratiques", isVisible: true, data: { items: [{ q: "", a: "" }] } }) },
  { kind: "custom", label: "Texte libre", title: "", empty: () => ({ kind: "custom", title: "", isVisible: true, data: { text: "" } }) },
];

const kindLabel = (kind: SectionKind) => KINDS.find((k) => k.kind === kind)?.label ?? kind;

/** Retire les lignes vides avant envoi : un programme a moitie rempli ne doit pas etre refuse pour une ligne blanche. */
function cleanSection(section: SectionDraft) {
  const base = { kind: section.kind, title: section.title.trim() || null, isVisible: section.isVisible };
  switch (section.kind) {
    case "program":
      return { ...base, data: { items: section.data.items.filter((i) => i.time || i.label.trim()).map((i) => ({ time: i.time, label: i.label.trim(), venueLabel: i.venueLabel || null })) } };
    case "dresscode":
      return { ...base, data: { text: section.data.text.trim(), palette: section.data.palette } };
    case "menu":
      return { ...base, data: { courses: section.data.courses.map((c) => ({ label: c.label.trim(), items: c.items.map((i) => i.trim()).filter(Boolean) })).filter((c) => c.label || c.items.length) } };
    case "faq":
      return { ...base, data: { items: section.data.items.filter((i) => i.q.trim() || i.a.trim()).map((i) => ({ q: i.q.trim(), a: i.a.trim() })) } };
    default:
      return { ...base, data: { text: section.data.text.trim() } };
  }
}

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  async function save(url: string, method: "PATCH" | "PUT", body: unknown) {
    setBusy(true);
    setMessage(null);
    const result = await sendJson(url, method, body);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return result;
    }
    setMessage({ tone: "success", text: "Enregistre." });
    router.refresh();
    return result;
  }
  return { busy, message, save };
}

export function ContentEditor({
  eventId,
  info: initialInfo,
  venues: initialVenues,
  sections: initialSections,
  published,
}: {
  eventId: string;
  info: EventInfoDraft;
  venues: VenueDraft[];
  sections: SectionDraft[];
  published: boolean;
}) {
  const [info, setInfo] = useState(initialInfo);
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});
  const [venues, setVenues] = useState(initialVenues);
  const [sections, setSections] = useState(initialSections);
  const infoSave = useSave();
  const venueSave = useSave();
  const sectionSave = useSave();

  const updateSection = (index: number, next: SectionDraft) => setSections(sections.map((s, i) => (i === index ? next : s)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSections(next);
  };

  return (
    <div className="space-y-6">
      {published && (
        <p className="rounded-xl bg-[var(--state-warn-bg)] px-4 py-3 text-[0.84rem] text-[var(--state-warn)]">
          L invitation est publiee : chaque modification enregistree s affichera aux invites avec la mention « mis a jour ».
        </p>
      )}

      <Surface>
        <SectionTitle>Informations</SectionTitle>
        <EventInfoFields draft={info} errors={infoErrors} titleTouched onChange={setInfo} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            busy={infoSave.busy}
            onClick={async () => {
              const r = await infoSave.save(`/api/organizer/events/${eventId}`, "PATCH", infoPayload(info));
              setInfoErrors(r.ok ? {} : fieldErrors(r.issues));
            }}
          >
            Enregistrer les informations
          </Button>
          {infoSave.message && <FormMessage tone={infoSave.message.tone}>{infoSave.message.text}</FormMessage>}
        </div>
      </Surface>

      <Surface>
        <SectionTitle hint="Adresse, repere et heure de chaque moment">Lieux</SectionTitle>
        <VenueFields venues={venues} onChange={setVenues} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button busy={venueSave.busy} onClick={() => venueSave.save(`/api/organizer/events/${eventId}/venues`, "PUT", { venues: venuesPayload(venues) })}>
            Enregistrer les lieux
          </Button>
          {venueSave.message && <FormMessage tone={venueSave.message.tone}>{venueSave.message.text}</FormMessage>}
        </div>
      </Surface>

      <Surface>
        <SectionTitle hint="Dans l ordre de la page invite">Sections de la page</SectionTitle>
        <div className="space-y-4">
          {sections.length === 0 && (
            <p className="text-[0.86rem] text-[var(--muted)]">Aucune section. Ajoutez le programme, le menu ou les questions pratiques.</p>
          )}
          {sections.map((section, index) => (
            <div key={index} className="rounded-2xl border border-[var(--console-hairline)] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{kindLabel(section.kind)}</span>
                <div className="ml-auto flex items-center gap-1">
                  <IconButton label="Monter" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Descendre" onClick={() => move(index, 1)} disabled={index === sections.length - 1}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton
                    label={section.isVisible ? "Masquer aux invites" : "Afficher aux invites"}
                    onClick={() => updateSection(index, { ...section, isVisible: !section.isVisible })}
                  >
                    {section.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconButton>
                  <IconButton label="Supprimer la section" onClick={() => setSections(sections.filter((_, i) => i !== index))}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
              <Field label="Titre affiche" className="mb-3">
                <TextInput value={section.title} onChange={(e) => updateSection(index, { ...section, title: e.target.value })} />
              </Field>
              <SectionBody section={section} onChange={(next) => updateSection(index, next)} venueLabels={venues.map((v) => v.label).filter(Boolean)} />
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Button key={k.kind} variant="secondary" onClick={() => setSections([...sections, k.empty()])}>
                <Plus className="size-4" aria-hidden /> {k.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button busy={sectionSave.busy} onClick={() => sectionSave.save(`/api/organizer/events/${eventId}/sections`, "PUT", { sections: sections.map(cleanSection) })}>
            Enregistrer les sections
          </Button>
          {sectionSave.message && <FormMessage tone={sectionSave.message.tone}>{sectionSave.message.text}</FormMessage>}
        </div>
      </Surface>
    </div>
  );
}

function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--console-paper)] hover:text-[var(--foreground)] disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

function RemoveRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <IconButton label={label} onClick={onClick}>
      <X className="size-4" />
    </IconButton>
  );
}

function SectionBody({
  section,
  onChange,
  venueLabels,
}: {
  section: SectionDraft;
  onChange: (next: SectionDraft) => void;
  venueLabels: string[];
}) {
  switch (section.kind) {
    case "program": {
      const items = section.data.items;
      const set = (next: ProgramData["items"]) => onChange({ ...section, data: { items: next } });
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[6.5rem_1fr_auto] items-end gap-2">
              <Field label={i === 0 ? "Heure" : ""}>
                <TextInput type="time" value={item.time} onChange={(e) => set(items.map((it, j) => (j === i ? { ...it, time: e.target.value } : it)))} />
              </Field>
              <Field label={i === 0 ? "Moment" : ""}>
                <TextInput
                  value={item.label}
                  placeholder="Ceremonie religieuse"
                  list={venueLabels.length ? "venue-labels" : undefined}
                  onChange={(e) => set(items.map((it, j) => (j === i ? { ...it, label: e.target.value } : it)))}
                />
              </Field>
              <RemoveRow label="Retirer ce moment" onClick={() => set(items.filter((_, j) => j !== i))} />
            </div>
          ))}
          <datalist id="venue-labels">
            {venueLabels.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <Button variant="ghost" onClick={() => set([...items, { time: "", label: "" }])}>
            <Plus className="size-4" aria-hidden /> Ajouter un moment
          </Button>
        </div>
      );
    }
    case "dresscode":
      return (
        <div className="space-y-3">
          <Field label="Consignes">
            <TextArea value={section.data.text} placeholder="Tenue de soiree. Couleurs du mariage : ivoire et champagne." onChange={(e) => onChange({ ...section, data: { ...section.data, text: e.target.value } })} />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-[0.78rem] text-[var(--muted)]">Palette (6 couleurs maximum)</legend>
            <div className="flex flex-wrap items-center gap-2">
              {section.data.palette.map((color, i) => (
                <span key={i} className="flex items-center gap-1 rounded-xl border border-[var(--console-hairline)] p-1">
                  <input
                    type="color"
                    aria-label={`Couleur ${i + 1}`}
                    value={color}
                    onChange={(e) => onChange({ ...section, data: { ...section.data, palette: section.data.palette.map((c, j) => (j === i ? e.target.value.toUpperCase() : c)) } })}
                    className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <RemoveRow label={`Retirer la couleur ${i + 1}`} onClick={() => onChange({ ...section, data: { ...section.data, palette: section.data.palette.filter((_, j) => j !== i) } })} />
                </span>
              ))}
              {section.data.palette.length < 6 && (
                <Button variant="ghost" onClick={() => onChange({ ...section, data: { ...section.data, palette: [...section.data.palette, "#D8C3A5"] } })}>
                  <Plus className="size-4" aria-hidden /> Couleur
                </Button>
              )}
            </div>
          </fieldset>
        </div>
      );
    case "menu": {
      const courses = section.data.courses;
      const set = (next: MenuData["courses"]) => onChange({ ...section, data: { courses: next } });
      return (
        <div className="space-y-4">
          {courses.map((course, i) => (
            <div key={i} className="space-y-2 border-l-2 border-[var(--console-hairline)] pl-3">
              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <Field label="Service">
                  <TextInput value={course.label} placeholder="Plat" onChange={(e) => set(courses.map((c, j) => (j === i ? { ...c, label: e.target.value } : c)))} />
                </Field>
                <RemoveRow label="Retirer ce service" onClick={() => set(courses.filter((_, j) => j !== i))} />
              </div>
              {course.items.map((dish, k) => (
                <div key={k} className="grid grid-cols-[1fr_auto] gap-2">
                  <TextInput
                    aria-label={`Plat ${k + 1}`}
                    value={dish}
                    placeholder="Poulet DG"
                    onChange={(e) => set(courses.map((c, j) => (j === i ? { ...c, items: c.items.map((d, m) => (m === k ? e.target.value : d)) } : c)))}
                  />
                  <RemoveRow label="Retirer ce plat" onClick={() => set(courses.map((c, j) => (j === i ? { ...c, items: c.items.filter((_, m) => m !== k) } : c)))} />
                </div>
              ))}
              <Button variant="ghost" onClick={() => set(courses.map((c, j) => (j === i ? { ...c, items: [...c.items, ""] } : c)))}>
                <Plus className="size-4" aria-hidden /> Plat
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => set([...courses, { label: "", items: [""] }])}>
            <Plus className="size-4" aria-hidden /> Service
          </Button>
        </div>
      );
    }
    case "faq": {
      const items = section.data.items;
      const set = (next: FaqData["items"]) => onChange({ ...section, data: { items: next } });
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
              <div className="space-y-2">
                <TextInput aria-label={`Question ${i + 1}`} value={item.q} placeholder="Les enfants sont-ils invites ?" onChange={(e) => set(items.map((it, j) => (j === i ? { ...it, q: e.target.value } : it)))} />
                <TextArea aria-label={`Reponse ${i + 1}`} rows={2} className="min-h-0" value={item.a} placeholder="Oui, ceux mentionnes sur votre invitation." onChange={(e) => set(items.map((it, j) => (j === i ? { ...it, a: e.target.value } : it)))} />
              </div>
              <RemoveRow label="Retirer cette question" onClick={() => set(items.filter((_, j) => j !== i))} />
            </div>
          ))}
          <Button variant="ghost" onClick={() => set([...items, { q: "", a: "" }])}>
            <Plus className="size-4" aria-hidden /> Question
          </Button>
        </div>
      );
    }
    default:
      return (
        <Field label="Texte">
          <TextArea value={section.data.text} onChange={(e) => onChange({ ...section, data: { text: e.target.value } })} />
        </Field>
      );
  }
}
