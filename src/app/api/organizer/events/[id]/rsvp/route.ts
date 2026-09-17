import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { wallTimeToUtc } from "@/lib/events/time";
import { rsvpConfigSchema } from "@/lib/validations/rsvp";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

/**
 * Configuration du RSVP : reglages, menus, questions (§7).
 *
 * Menus et questions gardent leur identifiant quand ils sont modifies : les
 * choix deja faits par les invites y restent attaches. Un identifiant qui
 * n appartient pas a CET evenement est ignore (creation d un nouvel element).
 * Supprimer un menu remet a "sans choix" ceux qui l avaient pris ; supprimer
 * une question efface ses reponses - l ecran le dit avant d enregistrer.
 */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, rsvpConfigSchema);
  if (!body.ok) return body.response;
  const { settings, meals, questions } = body.value;

  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    select: { timezone: true, meals: { select: { id: true } }, questions: { select: { id: true } } },
  });
  const ownMeals = new Set(event.meals.map((m) => m.id));
  const ownQuestions = new Set(event.questions.map((q) => q.id));
  const keptMeals = meals.map((m) => m.id).filter((mid): mid is string => Boolean(mid && ownMeals.has(mid)));
  const keptQuestions = questions.map((q) => q.id).filter((qid): qid is string => Boolean(qid && ownQuestions.has(qid)));

  await prisma.$transaction([
    prisma.event.update({
      where: { id },
      data: {
        rsvpSettings: {
          allowMaybe: settings.allowMaybe,
          allowEdit: settings.allowEdit,
          deadline: settings.deadline ? wallTimeToUtc(settings.deadline, event.timezone).toISOString() : null,
        },
      },
    }),
    prisma.mealOption.deleteMany({ where: { eventId: id, id: { notIn: keptMeals } } }),
    ...meals.map((meal, position) => {
      const data = { label: meal.label, description: meal.description, forChildren: meal.forChildren, position };
      return meal.id && ownMeals.has(meal.id)
        ? prisma.mealOption.update({ where: { id: meal.id }, data })
        : prisma.mealOption.create({ data: { eventId: id, ...data } });
    }),
    prisma.rsvpQuestion.deleteMany({ where: { eventId: id, id: { notIn: keptQuestions } } }),
    ...questions.map((question, position) => {
      const data = {
        type: question.type,
        label: question.label,
        options: (["SINGLE_CHOICE", "MULTI_CHOICE"].includes(question.type) ? question.options : []) as Prisma.InputJsonValue,
        required: question.required,
        perGuest: question.perGuest,
        position,
      };
      return question.id && ownQuestions.has(question.id)
        ? prisma.rsvpQuestion.update({ where: { id: question.id }, data })
        : prisma.rsvpQuestion.create({ data: { eventId: id, ...data } });
    }),
  ]);

  return NextResponse.json({ ok: true });
}
