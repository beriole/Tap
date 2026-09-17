"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { SectionTitle, Surface } from "@/components/app/ui";
import { Button, Field, FormMessage, Select, sendJson, TextInput } from "./form-kit";
import { fieldErrors } from "./event-fields";

/**
 * Configuration du RSVP (cahier §7) : reglages, menus, questions.
 *
 * Un seul enregistrement pour les trois blocs : ils se lisent ensemble ("si
 * j ajoute un menu enfant, faut-il une question sur l age ?") et une question
 * qui cite un menu supprime n aurait pas de sens.
 *
 * Supprimer un menu ou une question deja utilises par des invites est
 * signale avant l enregistrement : leurs choix seront perdus.
 */

export type MealDraft = { id?: string; label: string; description: string; forChildren: boolean; used: number };
export type QuestionDraft = {
  id?: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "NUMBER" | "BOOLEAN";
  label: string;
  options: string;
  required: boolean;
  perGuest: boolean;
  used: number;
};

const TYPES: { value: QuestionDraft["type"]; label: string }[] = [
  { value: "SINGLE_CHOICE", label: "Un choix dans une liste" },
  { value: "MULTI_CHOICE", label: "Plusieurs choix" },
  { value: "BOOLEAN", label: "Oui / non" },
  { value: "TEXT", label: "Texte libre" },
  { value: "NUMBER", label: "Nombre" },
];

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function RsvpConfig({
  eventId,
  settings: initialSettings,
  meals: initialMeals,
  questions: initialQuestions,
  responded,
}: {
  eventId: string;
  settings: { allowMaybe: boolean; allowEdit: boolean; deadline: string };
  meals: MealDraft[];
  questions: QuestionDraft[];
  responded: number;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [meals, setMeals] = useState(initialMeals);
  const [questions, setQuestions] = useState(initialQuestions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ce qui disparaitra a l enregistrement alors que des invites l ont deja utilise.
  const lostMeals = initialMeals.filter((m) => m.used > 0 && !meals.some((x) => x.id === m.id));
  const lostQuestions = initialQuestions.filter((q) => q.used > 0 && !questions.some((x) => x.id === q.id));

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await sendJson(`/api/organizer/events/${eventId}/rsvp`, "PUT", {
      settings: { ...settings, deadline: settings.deadline || null },
      meals: meals.map(({ id, label, description, forChildren }) => ({ id, label, description: description || null, forChildren })),
      questions: questions.map(({ id, type, label, options, required, perGuest }) => ({
        id,
        type,
        label,
        options: options
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        required,
        perGuest,
      })),
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(fieldErrors(result.issues));
      return setMessage({ tone: "error", text: result.error });
    }
    setErrors({});
    setMessage({ tone: "success", text: "Formulaire de reponse enregistre." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Surface>
        <SectionTitle hint={`${responded} groupe${responded > 1 ? "s ont" : " a"} deja repondu`}>Reglages</SectionTitle>
        <div className="space-y-4">
          <label className="flex items-start gap-3 text-[0.9rem]">
            <input
              type="checkbox"
              checked={settings.allowMaybe}
              onChange={(e) => setSettings({ ...settings, allowMaybe: e.target.checked })}
              className="mt-1 size-4 accent-[var(--brand-copper-deep)]"
            />
            <span>
              Proposer « Je ne sais pas encore »
              <span className="block text-[0.8rem] text-[var(--muted)]">Ces reponses ne comptent jamais dans les attendus.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-[0.9rem]">
            <input
              type="checkbox"
              checked={settings.allowEdit}
              onChange={(e) => setSettings({ ...settings, allowEdit: e.target.checked })}
              className="mt-1 size-4 accent-[var(--brand-copper-deep)]"
            />
            <span>
              Autoriser les invites a modifier leur reponse
              <span className="block text-[0.8rem] text-[var(--muted)]">Jusqu a la date limite, s il y en a une.</span>
            </span>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Date limite de reponse (heure du lieu)" className="w-full sm:w-72">
              <TextInput type="datetime-local" value={settings.deadline} onChange={(e) => setSettings({ ...settings, deadline: e.target.value })} />
            </Field>
            {settings.deadline && (
              <Button variant="ghost" onClick={() => setSettings({ ...settings, deadline: "" })}>
                Pas de date limite
              </Button>
            )}
          </div>
        </div>
      </Surface>

      <Surface>
        <SectionTitle hint="Proposes a chaque personne presente">Menus</SectionTitle>
        <div className="space-y-3">
          {meals.length === 0 && <p className="text-[0.86rem] text-[var(--muted)]">Aucun menu : l etape « Vos repas » ne sera pas proposee.</p>}
          {meals.map((meal, index) => (
            <div key={meal.id ?? `new-${index}`} className="grid gap-2 rounded-2xl border border-[var(--console-hairline)] p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Menu" error={errors[`meals.${index}.label`]}>
                <TextInput value={meal.label} placeholder="Poulet DG" onChange={(e) => setMeals(meals.map((m, i) => (i === index ? { ...m, label: e.target.value } : m)))} />
              </Field>
              <Field label="Precision (facultatif)">
                {/* Pas d exemple ici : un placeholder "Vegetarien" sous "Poulet DG" se lisait comme une vraie valeur. */}
                <TextInput value={meal.description} onChange={(e) => setMeals(meals.map((m, i) => (i === index ? { ...m, description: e.target.value } : m)))} />
              </Field>
              <div className="flex items-end gap-1">
                <label className="mr-2 flex min-h-11 items-center gap-2 text-[0.82rem]">
                  <input
                    type="checkbox"
                    checked={meal.forChildren}
                    onChange={(e) => setMeals(meals.map((m, i) => (i === index ? { ...m, forChildren: e.target.checked } : m)))}
                    className="size-4 accent-[var(--brand-copper-deep)]"
                  />
                  Enfant
                </label>
                <RowActions
                  onUp={() => setMeals(move(meals, index, -1))}
                  onDown={() => setMeals(move(meals, index, 1))}
                  onRemove={() => setMeals(meals.filter((_, i) => i !== index))}
                  label={meal.label || "ce menu"}
                />
              </div>
              {meal.used > 0 && <p className="text-[0.74rem] text-[var(--muted)] sm:col-span-3">Choisi par {meal.used} personne(s).</p>}
            </div>
          ))}
          <Button variant="secondary" onClick={() => setMeals([...meals, { label: "", description: "", forChildren: false, used: 0 }])}>
            <Plus className="size-4" aria-hidden /> Ajouter un menu
          </Button>
        </div>
      </Surface>

      <Surface>
        <SectionTitle hint="Posees apres les repas">Questions</SectionTitle>
        <div className="space-y-3">
          {questions.map((q, index) => {
            const update = (patch: Partial<QuestionDraft>) => setQuestions(questions.map((x, i) => (i === index ? { ...x, ...patch } : x)));
            const withOptions = q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE";
            return (
              <div key={q.id ?? `new-${index}`} className="space-y-3 rounded-2xl border border-[var(--console-hairline)] p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
                  <Field label="Question" error={errors[`questions.${index}.label`]}>
                    <TextInput value={q.label} placeholder="Avez-vous besoin de la navette ?" onChange={(e) => update({ label: e.target.value })} />
                  </Field>
                  <Field label="Type de reponse">
                    <Select value={q.type} onChange={(e) => update({ type: e.target.value as QuestionDraft["type"] })}>
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <RowActions
                      onUp={() => setQuestions(move(questions, index, -1))}
                      onDown={() => setQuestions(move(questions, index, 1))}
                      onRemove={() => setQuestions(questions.filter((_, i) => i !== index))}
                      label={q.label || "cette question"}
                    />
                  </div>
                </div>
                {withOptions && (
                  <Field label="Choix proposes (un par ligne)" error={errors[`questions.${index}.options`]}>
                    <textarea
                      value={q.options}
                      rows={3}
                      onChange={(e) => update({ options: e.target.value })}
                      className="w-full rounded-xl border border-[var(--console-hairline)] bg-[var(--console-paper)] px-3.5 py-2.5 text-[1rem] outline-none focus:border-[var(--brand-copper)] sm:text-[0.9rem]"
                    />
                  </Field>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.84rem]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={q.required} onChange={(e) => update({ required: e.target.checked })} className="size-4 accent-[var(--brand-copper-deep)]" />
                    Obligatoire
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={q.perGuest} onChange={(e) => update({ perGuest: e.target.checked })} className="size-4 accent-[var(--brand-copper-deep)]" />
                    Posee a chaque personne presente
                  </label>
                  {q.used > 0 && <span className="text-[var(--muted)]">{q.used} reponse(s) recue(s)</span>}
                </div>
              </div>
            );
          })}
          <Button
            variant="secondary"
            onClick={() => setQuestions([...questions, { type: "SINGLE_CHOICE", label: "", options: "", required: false, perGuest: false, used: 0 }])}
          >
            <Plus className="size-4" aria-hidden /> Ajouter une question
          </Button>
        </div>
      </Surface>

      {(lostMeals.length > 0 || lostQuestions.length > 0) && (
        <p className="rounded-xl bg-[var(--state-warn-bg)] px-4 py-3 text-[0.84rem] text-[var(--state-warn)]">
          {lostMeals.length > 0 && `Menus supprimes deja choisis : ${lostMeals.map((m) => m.label).join(", ")} - ces personnes passeront « sans choix ». `}
          {lostQuestions.length > 0 && `Questions supprimees deja repondues : ${lostQuestions.map((q) => q.label).join(", ")} - leurs reponses seront effacees.`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button busy={busy} onClick={save}>
          Enregistrer le formulaire
        </Button>
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      </div>
    </div>
  );
}

function RowActions({ onUp, onDown, onRemove, label }: { onUp: () => void; onDown: () => void; onRemove: () => void; label: string }) {
  const cls = "flex size-11 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--console-paper)] hover:text-[var(--foreground)]";
  return (
    <span className="flex">
      <button type="button" aria-label={`Monter ${label}`} onClick={onUp} className={cls}>
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button type="button" aria-label={`Descendre ${label}`} onClick={onDown} className={cls}>
        <ArrowDown className="size-4" aria-hidden />
      </button>
      <button type="button" aria-label={`Supprimer ${label}`} onClick={onRemove} className={`${cls} hover:text-[var(--state-stop)]`}>
        <Trash2 className="size-4" aria-hidden />
      </button>
    </span>
  );
}
