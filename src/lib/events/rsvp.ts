import type { RsvpSettings, RsvpSubmission } from "@/lib/validations/rsvp";

/**
 * Regles du RSVP (cahier §7, plan phase 5) - logique pure, testee dans
 * rsvp.test.ts. Le service n applique qu un plan deja valide par ces regles.
 *
 * Le serveur decide de TOUT : le formulaire peut etre modifie, rejoue,
 * appele directement. Le quota d une famille ne peut pas etre depasse sans
 * regle explicite (§22) - meme en ecrivant la requete a la main.
 */

export function parseRsvpSettings(raw: unknown): RsvpSettings {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const deadline = typeof input.deadline === "string" && !Number.isNaN(Date.parse(input.deadline)) ? new Date(input.deadline).toISOString() : null;
  return {
    // "Peut-etre" desactive par defaut (D3) ; modification autorisee par defaut.
    allowMaybe: input.allowMaybe === true,
    allowEdit: input.allowEdit !== false,
    deadline,
  };
}

export type RsvpQuestionRule = {
  id: string;
  type: "TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "NUMBER" | "BOOLEAN";
  options: string[];
  required: boolean;
  perGuest: boolean;
};

export type RsvpContext = {
  now: Date;
  settings: RsvpSettings;
  eventStatus: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  maxSeats: number;
  currentStatus: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  /** 0 si aucune reponse n existe encore */
  currentVersion: number;
  members: { id: string; isPlusOne: boolean }[];
  mealIds: string[];
  questions: RsvpQuestionRule[];
};

export type RsvpErrorCode = "CLOSED" | "LOCKED" | "CONFLICT" | "QUOTA" | "CONSENT" | "INVALID";

export type RsvpPerson = {
  key: string;
  existingId: string | null;
  firstName: string | null;
  lastName: string | null;
  ageCategory: "ADULT" | "CHILD" | "BABY";
  isPlusOne: boolean;
  attending: boolean | null;
};

export type RsvpPlan = {
  status: "ATTENDING" | "DECLINED" | "MAYBE";
  /** Invites existants, avec leur nouvelle presence */
  members: RsvpPerson[];
  /** Accompagnants a creer (presents uniquement) */
  newPlusOnes: RsvpPerson[];
  /** Accompagnants existants a retirer */
  removedPlusOneIds: string[];
  meals: Record<string, string | null>;
  allergies: Record<string, string | null>;
  answers: { questionId: string; key: string | null; value: unknown }[];
  consent: boolean;
  message: string | null;
};

export type RsvpCheck = { ok: true; plan: RsvpPlan } | { ok: false; code: RsvpErrorCode; message: string };

const fail = (code: RsvpErrorCode, message: string): RsvpCheck => ({ ok: false, code, message });

function validAnswer(rule: RsvpQuestionRule, value: unknown): boolean {
  switch (rule.type) {
    case "TEXT":
      return typeof value === "string" && value.trim().length > 0 && value.length <= 500;
    case "SINGLE_CHOICE":
      return typeof value === "string" && rule.options.includes(value);
    case "MULTI_CHOICE":
      return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string" && rule.options.includes(v)) && new Set(value).size === value.length;
    case "NUMBER":
      return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10_000;
    case "BOOLEAN":
      return typeof value === "boolean";
  }
}

const isEmptyAnswer = (value: unknown) =>
  value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

export function checkRsvp(input: RsvpSubmission, ctx: RsvpContext): RsvpCheck {
  // --- Ouverture --------------------------------------------------------
  if (ctx.eventStatus !== "PUBLISHED") return fail("CLOSED", "Les réponses sont closes.");
  if (ctx.settings.deadline && new Date(ctx.settings.deadline) < ctx.now) {
    return fail("CLOSED", "La date limite de réponse est passée. Contactez directement les hôtes.");
  }
  if (ctx.currentStatus !== "PENDING" && !ctx.settings.allowEdit) {
    return fail("LOCKED", "Votre réponse est déjà enregistrée et ne peut plus être modifiée.");
  }
  if (input.version !== ctx.currentVersion) {
    return fail("CONFLICT", "Votre réponse a été modifiée entre-temps, depuis un autre appareil. Rechargez la page.");
  }
  if (input.status === "MAYBE" && !ctx.settings.allowMaybe) return fail("INVALID", "Réponse non proposée.");

  // --- Personnes ---------------------------------------------------------
  const memberById = new Map(ctx.members.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const members: RsvpPerson[] = [];
  const newPlusOnes: RsvpPerson[] = [];

  for (const person of input.people) {
    if (seen.has(person.key)) return fail("INVALID", "Personne en double.");
    seen.add(person.key);
    const isNew = person.key.startsWith("new:");
    const existing = isNew ? null : memberById.get(person.key);
    if (!isNew && !existing) return fail("INVALID", "Personne inconnue pour cette invitation.");

    const attending = input.status === "ATTENDING" ? person.attending : input.status === "DECLINED" ? false : null;
    const entry: RsvpPerson = {
      key: person.key,
      existingId: existing?.id ?? null,
      firstName: person.firstName,
      lastName: person.lastName,
      ageCategory: person.ageCategory,
      isPlusOne: isNew || Boolean(existing?.isPlusOne),
      attending,
    };
    if (isNew) {
      // Un accompagnant annonce mais absent n a pas a exister.
      if (attending) newPlusOnes.push(entry);
    } else {
      members.push(entry);
    }
  }

  // Un invite du groupe absent de la requete n est pas present.
  for (const member of ctx.members) {
    if (!seen.has(member.id)) {
      members.push({
        key: member.id,
        existingId: member.id,
        firstName: null,
        lastName: null,
        ageCategory: "ADULT",
        isPlusOne: member.isPlusOne,
        attending: input.status === "MAYBE" ? null : false,
      });
    }
  }

  // Les accompagnants existants qui ne viennent plus disparaissent de la liste.
  const removedPlusOneIds = members.filter((m) => m.isPlusOne && m.attending !== true && input.status !== "MAYBE").map((m) => m.existingId!);
  const keptMembers = members.filter((m) => !removedPlusOneIds.includes(m.existingId!));

  const present = [...keptMembers, ...newPlusOnes].filter((p) => p.attending === true);
  if (input.status === "ATTENDING") {
    if (present.length === 0) return fail("INVALID", "Indiquez au moins une personne présente.");
    if (present.length > ctx.maxSeats) {
      return fail("QUOTA", `Cette invitation est prévue pour ${ctx.maxSeats} personne${ctx.maxSeats > 1 ? "s" : ""} au maximum.`);
    }
  }
  const presentKeys = new Set(present.map((p) => p.key));

  // --- Repas et allergies -----------------------------------------------
  const meals: Record<string, string | null> = {};
  const allergies: Record<string, string | null> = {};
  if (input.status === "ATTENDING") {
    const mealIds = new Set(ctx.mealIds);
    for (const [key, mealId] of Object.entries(input.meals)) {
      if (!presentKeys.has(key)) continue;
      if (mealId !== null && !mealIds.has(mealId)) return fail("INVALID", "Menu inconnu.");
      meals[key] = mealId;
    }
    let anyAllergy = false;
    for (const [key, text] of Object.entries(input.allergies)) {
      if (!presentKeys.has(key)) continue;
      allergies[key] = text ? text : null;
      if (text) anyAllergy = true;
    }
    if (anyAllergy && !input.consent) {
      return fail("CONSENT", "Pour transmettre une allergie, cochez la case d’accord.");
    }
  }

  // --- Questions ---------------------------------------------------------
  const answers: RsvpPlan["answers"] = [];
  const rules = new Map(ctx.questions.map((q) => [q.id, q]));
  for (const answer of input.answers) {
    const rule = rules.get(answer.questionId);
    if (!rule) return fail("INVALID", "Question inconnue.");
    if (input.status !== "ATTENDING") continue;
    if (isEmptyAnswer(answer.value)) continue;
    if (rule.perGuest && (!answer.key || !presentKeys.has(answer.key))) continue;
    if (!validAnswer(rule, answer.value)) return fail("INVALID", "Réponse invalide à une question.");
    answers.push({ questionId: rule.id, key: rule.perGuest ? answer.key! : null, value: answer.value });
  }
  if (input.status === "ATTENDING") {
    for (const rule of ctx.questions.filter((q) => q.required)) {
      const expected = rule.perGuest ? present.map((p) => p.key) : [null];
      for (const key of expected) {
        if (!answers.some((a) => a.questionId === rule.id && a.key === key)) {
          return fail("INVALID", "Une question obligatoire est restée sans réponse.");
        }
      }
    }
  }

  return {
    ok: true,
    plan: {
      status: input.status,
      members: keptMembers,
      newPlusOnes,
      removedPlusOneIds,
      meals,
      allergies,
      answers,
      consent: input.consent,
      message: input.message ?? null,
    },
  };
}
