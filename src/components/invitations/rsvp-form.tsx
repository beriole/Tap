"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RsvpFormData } from "@/types/invitation";

/**
 * Formulaire de reponse d un groupe (cahier §7, plan phase 5).
 *
 * Objectif §2.1 : repondre en 3 a 6 gestes. Les etapes n existent que si elles
 * servent : "Qui vient" disparait pour une personne seule sans accompagnant,
 * "Repas" sans menu, "Questions" sans question. Le choix de presence avance
 * de lui-meme. Un meme menu vaut pour toute la famille par defaut ; le detail
 * par personne reste a un geste.
 *
 * Le serveur revalide tout (lib/events/rsvp.ts). Ici on ne fait que guider :
 * aucune regle de quota ou de date n est "garantie" par ce composant.
 *
 * Habillage : variables --rsvp-* posees par le theme.
 */

type Status = "ATTENDING" | "DECLINED" | "MAYBE";
type Age = "ADULT" | "CHILD" | "BABY";
type Person = {
  key: string;
  firstName: string | null;
  lastName: string | null;
  ageCategory: Age;
  isPlusOne: boolean;
  attending: boolean;
  isNew: boolean;
};
type Step = "presence" | "who" | "meals" | "questions" | "recap";

const AGE_LABEL: Record<Age, string> = { ADULT: "Adulte", CHILD: "Enfant", BABY: "Bébé" };
const STEP_TITLE: Record<Step, string> = {
  presence: "Serez-vous des nôtres ?",
  who: "Qui vient ?",
  meals: "Vos repas",
  questions: "Quelques questions",
  recap: "Vérifiez avant d’envoyer",
};

const personName = (p: { firstName: string | null; lastName: string | null }, fallback: string) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || fallback;

const answerKey = (questionId: string, key: string | null) => `${questionId}|${key ?? ""}`;

export function RsvpForm({ data, intro }: { data: RsvpFormData; intro?: React.ReactNode }) {
  const [version, setVersion] = useState(data.version);
  const [savedStatus, setSavedStatus] = useState(data.status);
  const [mode, setMode] = useState<"form" | "summary" | "done">(
    data.status === "PENDING" ? "form" : "summary",
  );
  const [status, setStatus] = useState<Status | null>(
    data.status === "PENDING" ? null : data.status,
  );
  const [people, setPeople] = useState<Person[]>(() =>
    data.members.map((m) => ({
      ...m,
      isNew: false,
      attending: data.status === "PENDING" ? !m.isPlusOne : m.attending === true,
    })),
  );
  const [stepIndex, setStepIndex] = useState(0);

  const adultMeals = data.meals.filter((m) => !m.forChildren);
  const childMeal = data.meals.find((m) => m.forChildren) ?? null;
  const initialMeals = Object.fromEntries(data.members.map((m) => [m.key, m.mealOptionId]));
  const firstAdultMeal =
    data.members.find((m) => m.ageCategory === "ADULT" && m.mealOptionId)?.mealOptionId ?? null;
  const allSame = data.members
    .filter((m) => m.ageCategory === "ADULT" && m.attending)
    .every((m) => m.mealOptionId === firstAdultMeal);
  const [mealMode, setMealMode] = useState<"same" | "each">(allSame ? "same" : "each");
  const [sameMeal, setSameMeal] = useState<string | null>(firstAdultMeal);
  const [perMeal, setPerMeal] = useState<Record<string, string | null>>(initialMeals);
  const [allergies, setAllergies] = useState<Record<string, string>>(
    Object.fromEntries(data.members.filter((m) => m.allergies).map((m) => [m.key, m.allergies!])),
  );
  const [allergyOpen, setAllergyOpen] = useState(data.members.some((m) => m.allergies));
  const [consent, setConsent] = useState(data.members.some((m) => m.allergies));
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    Object.fromEntries(data.answers.map((a) => [answerKey(a.questionId, a.key), a.value])),
  );
  const [message, setMessage] = useState(data.message ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Adresse du QR : connue au chargement, ou renvoyee par le serveur a la confirmation.
  const [ticketHref, setTicketHref] = useState(data.ticketUrl);

  const present = people.filter((p) => p.attending);
  const freeSeats = data.maxSeats - present.length;
  const newCount = people.filter((p) => p.isNew).length;

  const steps = useMemo<Step[]>(() => {
    const out: Step[] = ["presence"];
    if (status === "ATTENDING") {
      if (
        data.members.length > 1 ||
        data.maxSeats > data.members.filter((m) => !m.isPlusOne).length
      )
        out.push("who");
      if (data.meals.length > 0) out.push("meals");
      if (data.questions.length > 0) out.push("questions");
    }
    out.push("recap");
    return out;
  }, [status, data.members, data.maxSeats, data.meals.length, data.questions.length]);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;

  const mealFor = (p: Person): string | null => {
    if (p.ageCategory === "BABY") return null;
    if (mealMode === "each") return perMeal[p.key] ?? null;
    if (p.ageCategory === "CHILD" && childMeal) return childMeal.id;
    return sameMeal;
  };

  /** Ce qui manque pour quitter l etape en cours. Le serveur revalide de toute facon. */
  function blocker(): string | null {
    if (step === "presence" && !status) return "Choisissez une réponse.";
    if (step === "who" && present.length === 0)
      return "Cochez au moins une personne, ou indiquez que vous ne venez pas.";
    if (step === "who" && freeSeats < 0)
      return `Cette invitation est prévue pour ${data.maxSeats} personne${data.maxSeats > 1 ? "s" : ""} au maximum.`;
    if (step === "meals") {
      if (adultMeals.length > 0 && present.some((p) => p.ageCategory !== "BABY" && !mealFor(p)))
        return "Choisissez un menu pour chacun.";
      if (
        Object.entries(allergies).some(([k, v]) => v.trim() && present.some((p) => p.key === k)) &&
        !consent
      ) {
        return "Cochez la case d’accord pour transmettre une allergie.";
      }
    }
    if (step === "questions") {
      for (const q of data.questions.filter((x) => x.required)) {
        const keys = q.perGuest ? present.map((p) => p.key) : [null];
        for (const key of keys) {
          const v = answers[answerKey(q.id, key)];
          if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
            return "Une question obligatoire attend votre réponse.";
        }
      }
    }
    return null;
  }

  function next() {
    const why = blocker();
    setError(why);
    if (!why) setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  async function submit() {
    if (!status) return;
    setBusy(true);
    setError(null);
    const attendingStatus = status === "ATTENDING";
    const payload = {
      token: data.token,
      version,
      status,
      people: people.map((p) => ({
        key: p.key,
        firstName: p.firstName,
        lastName: p.lastName,
        ageCategory: p.ageCategory,
        attending: attendingStatus && p.attending,
      })),
      meals: attendingStatus ? Object.fromEntries(present.map((p) => [p.key, mealFor(p)])) : {},
      allergies:
        attendingStatus && allergyOpen
          ? Object.fromEntries(present.map((p) => [p.key, (allergies[p.key] ?? "").trim()]))
          : {},
      consent: attendingStatus && allergyOpen && consent,
      answers: attendingStatus
        ? data.questions.flatMap((q) =>
            (q.perGuest ? present.map((p) => p.key) : [null]).map((key) => ({
              questionId: q.id,
              key,
              value: answers[answerKey(q.id, key)] ?? null,
            })),
          )
        : [],
      message: message.trim() || null,
    };
    try {
      const response = await fetch("/api/invitations/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "L’envoi a échoué. Réessayez.");
      } else {
        setVersion(body.version);
        setSavedStatus(body.status);
        setTicketHref(body.ticketUrl ?? null);
        setMode("done");
      }
    } catch {
      setError("Connexion impossible. Vérifiez le réseau et réessayez : vos choix sont conservés.");
    }
    setBusy(false);
  }

  // ------------------------------------------------------------ RESUMES --
  if (mode !== "form") {
    const shownStatus = mode === "done" ? savedStatus : data.status;
    const count = mode === "done" ? present.length : data.members.filter((m) => m.attending).length;
    return (
      <div className="mx-auto max-w-[340px] text-center" aria-live="polite">
        {mode === "done" && (
          <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full border border-[var(--rsvp-rule)] text-[var(--rsvp-accent)]">
            <Check className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
        )}
        <p className="text-[22px] leading-snug [font-family:var(--rsvp-font)]">
          {mode === "done" ? "Merci, votre réponse est enregistrée." : "Vous avez déjà répondu."}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--rsvp-ink-2)]">
          {shownStatus === "ATTENDING"
            ? `Présents : ${count} personne${count > 1 ? "s" : ""}.`
            : shownStatus === "DECLINED"
              ? "Vous ne pourrez pas être présents."
              : "Vous n’êtes pas encore sûrs de venir."}
        </p>
        {shownStatus === "ATTENDING" && ticketHref && (
          <a
            href={ticketHref}
            className="mt-7 flex min-h-[52px] w-full items-center justify-center rounded-[2px] bg-[var(--rsvp-ink)] px-6 text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--rsvp-bg)]"
          >
            Voir mon accès (QR)
          </a>
        )}
        {shownStatus === "ATTENDING" && ticketHref && (
          <p className="mt-2 text-[12.5px] text-[var(--rsvp-ink-2)]">À présenter à l’entrée, une fois pour toute la famille.</p>
        )}
        {data.allowEdit && !data.closed && (
          <button
            type="button"
            onClick={() => {
              setStepIndex(0);
              setError(null);
              setMode("form");
            }}
            className="mt-6 inline-flex min-h-11 items-center border-b border-[var(--rsvp-rule)] text-[13px] font-medium uppercase tracking-[0.16em] hover:text-[var(--rsvp-accent)]"
          >
            Modifier ma réponse
          </button>
        )}
      </div>
    );
  }

  // --------------------------------------------------------- FORMULAIRE --
  return (
    <>
      {/* L introduction ("nous vous avons reserve...") n a de sens qu avant la
        premiere reponse : apres l envoi, elle contredirait le remerciement. */}
      {intro && data.status === "PENDING" && version === 0 && intro}
      <form
        className="mx-auto max-w-[360px] text-left"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "recap") void submit();
          else next();
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--rsvp-accent)]">
            Étape {stepIndex + 1} sur {steps.length}
          </p>
          <span aria-hidden className="flex gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-px w-5",
                  i <= stepIndex ? "bg-[var(--rsvp-rule)]" : "bg-[var(--rsvp-line)]",
                )}
              />
            ))}
          </span>
        </div>

        <h3 className="mb-6 text-[26px] italic leading-tight [font-family:var(--rsvp-font)]">
          {STEP_TITLE[step]}
        </h3>

        {step === "presence" && (
          <fieldset className="space-y-2.5">
            <legend className="sr-only">{STEP_TITLE.presence}</legend>
            {(
              [
                [
                  "ATTENDING",
                  data.members.length > 1 || data.maxSeats > 1
                    ? "Oui, avec plaisir"
                    : "Oui, je serai là",
                ],
                ["DECLINED", "Non, je ne pourrai pas venir"],
                ...(data.allowMaybe ? [["MAYBE", "Je ne sais pas encore"] as const] : []),
              ] as const
            ).map(([value, label]) => (
              <Choice
                key={value}
                name="presence"
                checked={status === value}
                onSelect={() => {
                  setStatus(value);
                  setError(null);
                  // Le choix de presence avance de lui-meme : un geste de moins.
                  setStepIndex(1);
                }}
              >
                {label}
              </Choice>
            ))}
          </fieldset>
        )}

        {step === "who" && (
          <div className="space-y-2.5">
            {people.map((person, index) =>
              person.isNew ? (
                <div
                  key={person.key}
                  className="flex items-end gap-2 border-b border-[var(--rsvp-line)] pb-3"
                >
                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-[12px] text-[var(--rsvp-ink-2)]">
                      Accompagnant
                    </span>
                    <input
                      value={person.firstName ?? ""}
                      placeholder="Prénom (facultatif)"
                      onChange={(e) =>
                        setPeople(
                          people.map((p, i) =>
                            i === index ? { ...p, firstName: e.target.value || null } : p,
                          ),
                        )
                      }
                      className={field}
                    />
                  </label>
                  <select
                    aria-label="Âge"
                    value={person.ageCategory}
                    onChange={(e) =>
                      setPeople(
                        people.map((p, i) =>
                          i === index ? { ...p, ageCategory: e.target.value as Age } : p,
                        ),
                      )
                    }
                    className={cn(field, "w-28")}
                  >
                    {(Object.keys(AGE_LABEL) as Age[]).map((a) => (
                      <option key={a} value={a}>
                        {AGE_LABEL[a]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Retirer cet accompagnant"
                    onClick={() => setPeople(people.filter((_, i) => i !== index))}
                    className="flex size-11 shrink-0 items-center justify-center text-[var(--rsvp-ink-2)] hover:text-[var(--rsvp-ink)]"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <Choice
                  key={person.key}
                  type="checkbox"
                  name={`who-${person.key}`}
                  checked={person.attending}
                  onSelect={() =>
                    setPeople(
                      people.map((p, i) => (i === index ? { ...p, attending: !p.attending } : p)),
                    )
                  }
                  hint={person.isPlusOne ? "Accompagnant" : AGE_LABEL[person.ageCategory]}
                >
                  {personName(person, "Accompagnant")}
                </Choice>
              ),
            )}
            {freeSeats > 0 && newCount < 10 && (
              <button
                type="button"
                onClick={() =>
                  setPeople([
                    ...people,
                    {
                      key: `new:${newCount}`,
                      firstName: null,
                      lastName: null,
                      ageCategory: "ADULT",
                      isPlusOne: true,
                      attending: true,
                      isNew: true,
                    },
                  ])
                }
                className="flex min-h-12 w-full items-center gap-2 text-[14px] text-[var(--rsvp-ink-2)] hover:text-[var(--rsvp-ink)]"
              >
                <Plus className="size-4 text-[var(--rsvp-accent)]" aria-hidden />
                Ajouter un accompagnant
                <span className="ml-auto text-[12px]">
                  {freeSeats} place{freeSeats > 1 ? "s" : ""} libre{freeSeats > 1 ? "s" : ""}
                </span>
              </button>
            )}
          </div>
        )}

        {step === "meals" && (
          <div className="space-y-6">
            {mealMode === "same" ? (
              <fieldset className="space-y-2.5">
                <legend className="mb-3 text-[14px] text-[var(--rsvp-ink-2)]">
                  {present.filter((p) => p.ageCategory === "ADULT").length > 1
                    ? "Un même menu pour tous"
                    : "Votre menu"}
                </legend>
                {adultMeals.map((meal) => (
                  <Choice
                    key={meal.id}
                    name="same-meal"
                    checked={sameMeal === meal.id}
                    onSelect={() => setSameMeal(meal.id)}
                    hint={meal.description}
                  >
                    {meal.label}
                  </Choice>
                ))}
                {childMeal && present.some((p) => p.ageCategory === "CHILD") && (
                  <p className="pt-1 text-[13px] text-[var(--rsvp-ink-2)]">
                    Les enfants auront le {childMeal.label.toLowerCase()}.
                  </p>
                )}
              </fieldset>
            ) : (
              <div className="space-y-4">
                {present
                  .filter((p) => p.ageCategory !== "BABY")
                  .map((p) => (
                    <label key={p.key} className="block">
                      <span className="mb-1 block text-[14px]">
                        {personName(p, "Accompagnant")}
                      </span>
                      <select
                        value={perMeal[p.key] ?? ""}
                        onChange={(e) =>
                          setPerMeal({ ...perMeal, [p.key]: e.target.value || null })
                        }
                        className={field}
                      >
                        <option value="">Choisir un menu</option>
                        {data.meals.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
              </div>
            )}
            {present.filter((p) => p.ageCategory !== "BABY").length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (mealMode === "same")
                    setPerMeal(Object.fromEntries(present.map((p) => [p.key, mealFor(p)])));
                  setMealMode(mealMode === "same" ? "each" : "same");
                }}
                className="border-b border-[var(--rsvp-rule)] text-[13px] text-[var(--rsvp-ink-2)] hover:text-[var(--rsvp-ink)]"
              >
                {mealMode === "same"
                  ? "Choisir un menu différent par personne"
                  : "Un même menu pour tous"}
              </button>
            )}

            <div className="border-t border-[var(--rsvp-line)] pt-5">
              <Choice
                type="checkbox"
                name="allergy"
                checked={allergyOpen}
                onSelect={() => setAllergyOpen(!allergyOpen)}
              >
                Une allergie ou un régime à signaler
              </Choice>
              {allergyOpen && (
                <div className="mt-4 space-y-3">
                  {present.map((p) => (
                    <label key={p.key} className="block">
                      <span className="mb-1 block text-[13px] text-[var(--rsvp-ink-2)]">
                        {personName(p, "Accompagnant")}
                      </span>
                      <input
                        value={allergies[p.key] ?? ""}
                        maxLength={300}
                        placeholder="Arachides, sans porc, végétarien…"
                        onChange={(e) => setAllergies({ ...allergies, [p.key]: e.target.value })}
                        className={field}
                      />
                    </label>
                  ))}
                  <label className="flex items-start gap-3 pt-2 text-[13px] leading-relaxed text-[var(--rsvp-ink-2)]">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 size-4 shrink-0 accent-[var(--rsvp-ink)]"
                    />
                    J’accepte que ces informations de santé soient transmises aux hôtes et au
                    traiteur. Elles seront supprimées 30 jours après l’événement.
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-7">
            {data.questions.map((q) => (
              <fieldset key={q.id}>
                <legend className="mb-3 text-[15px] leading-snug">
                  {q.label}
                  {!q.required && (
                    <span className="ml-1 text-[12px] text-[var(--rsvp-ink-2)]">(facultatif)</span>
                  )}
                </legend>
                <div className="space-y-3">
                  {(q.perGuest ? present : [null]).map((p) => {
                    const key = answerKey(q.id, p?.key ?? null);
                    return (
                      <div key={key}>
                        {p && (
                          <p className="mb-1.5 text-[13px] text-[var(--rsvp-ink-2)]">
                            {personName(p, "Accompagnant")}
                          </p>
                        )}
                        <QuestionInput
                          question={q}
                          value={answers[key]}
                          onChange={(v) => setAnswers({ ...answers, [key]: v })}
                        />
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {step === "recap" && (
          <div className="space-y-5">
            <dl className="divide-y divide-[var(--rsvp-line)] border-y border-[var(--rsvp-line)] text-[15px]">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-[var(--rsvp-ink-2)]">Réponse</dt>
                <dd className="text-right">
                  {status === "ATTENDING"
                    ? "Présents"
                    : status === "DECLINED"
                      ? "Absents"
                      : "Peut-être"}
                </dd>
              </div>
              {status === "ATTENDING" &&
                present.map((p) => {
                  const meal = data.meals.find((m) => m.id === mealFor(p));
                  return (
                    <div key={p.key} className="flex justify-between gap-4 py-3">
                      <dt>{personName(p, "Accompagnant")}</dt>
                      <dd className="text-right text-[var(--rsvp-ink-2)]">
                        {p.ageCategory === "BABY" ? "Bébé" : (meal?.label ?? "—")}
                      </dd>
                    </div>
                  );
                })}
            </dl>
            <label className="block">
              <span className="mb-1 block text-[13px] text-[var(--rsvp-ink-2)]">
                Un mot pour les hôtes (facultatif)
              </span>
              <textarea
                value={message}
                maxLength={500}
                rows={3}
                onChange={(e) => setMessage(e.target.value)}
                className={cn(field, "resize-none rounded-[2px] border px-3")}
              />
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 text-[14px] leading-snug text-[var(--rsvp-error)]">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStepIndex(stepIndex - 1);
              }}
              className="flex size-[52px] shrink-0 items-center justify-center rounded-[2px] border border-[var(--rsvp-line)] text-[var(--rsvp-ink-2)] hover:text-[var(--rsvp-ink)]"
              aria-label="Étape précédente"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          )}
          {step !== "presence" && (
            <button type="submit" disabled={busy} className={button}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {step === "recap" ? "Confirmer ma réponse" : "Continuer"}
            </button>
          )}
        </div>
        {data.deadlineLabel && step === "recap" && (
          <p className="mt-3 text-center text-[12.5px] text-[var(--rsvp-ink-2)]">
            {data.allowEdit
              ? `Modifiable jusqu’au ${data.deadlineLabel}.`
              : "Une fois confirmée, la réponse ne pourra plus être modifiée."}
          </p>
        )}
      </form>
    </>
  );
}

const field =
  "w-full rounded-none border-0 border-b border-[var(--rsvp-line)] bg-transparent px-0 py-2.5 text-[16px] text-[var(--rsvp-ink)] outline-none transition-colors placeholder:text-[var(--rsvp-ink-2)]/60 focus:border-[var(--rsvp-rule)]";

const button =
  "flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[2px] bg-[var(--rsvp-ink)] px-6 text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--rsvp-bg)] transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rsvp-rule)]";

function Choice({
  name,
  checked,
  onSelect,
  children,
  hint,
  type = "radio",
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  hint?: string | null;
  type?: "radio" | "checkbox";
}) {
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center gap-4 rounded-[2px] border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--rsvp-rule)]",
        checked
          ? "border-[var(--rsvp-ink)]"
          : "border-[var(--rsvp-line)] hover:border-[var(--rsvp-rule)]",
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border transition-colors",
          type === "radio" ? "rounded-full" : "rounded-[2px]",
          checked
            ? "border-[var(--rsvp-ink)] bg-[var(--rsvp-ink)] text-[var(--rsvp-bg)]"
            : "border-[var(--rsvp-line)]",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={2.5} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] leading-snug">{children}</span>
        {hint && (
          <span className="mt-0.5 block text-[12.5px] text-[var(--rsvp-ink-2)]">{hint}</span>
        )}
      </span>
    </label>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: RsvpFormData["questions"][number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.type) {
    case "SINGLE_CHOICE":
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <Choice
              key={option}
              name={`${question.id}-${option}`}
              checked={value === option}
              onSelect={() => onChange(option)}
            >
              {option}
            </Choice>
          ))}
        </div>
      );
    case "MULTI_CHOICE": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <Choice
              key={option}
              type="checkbox"
              name={`${question.id}-${option}`}
              checked={selected.includes(option)}
              onSelect={() =>
                onChange(
                  selected.includes(option)
                    ? selected.filter((s) => s !== option)
                    : [...selected, option],
                )
              }
            >
              {option}
            </Choice>
          ))}
        </div>
      );
    }
    case "BOOLEAN":
      return (
        <div className="grid grid-cols-2 gap-2">
          {([true, false] as const).map((option) => (
            <Choice
              key={String(option)}
              name={`${question.id}-${option}`}
              checked={value === option}
              onSelect={() => onChange(option)}
            >
              {option ? "Oui" : "Non"}
            </Choice>
          ))}
        </div>
      );
    case "NUMBER":
      return (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={field}
        />
      );
    default:
      return (
        <input
          value={typeof value === "string" ? value : ""}
          maxLength={500}
          onChange={(e) => onChange(e.target.value)}
          className={field}
        />
      );
  }
}
