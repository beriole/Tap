import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canReadInvitation } from "@/lib/events/invitation-access";
import { checkRsvp, parseRsvpSettings, type RsvpErrorCode } from "@/lib/events/rsvp";
import type { RsvpSubmission } from "@/lib/validations/rsvp";

/**
 * Enregistrement d une reponse (§7, §17 RSVPService).
 *
 * Tout se joue dans une seule transaction : presences, accompagnants, repas,
 * allergies, reponses aux questions, historique, etat de l invitation. Une
 * reponse a moitie enregistree fausserait les totaux du traiteur.
 *
 * Deux onglets, deux telephones d une meme famille : le numero de version est
 * verifie DANS la transaction (update conditionnel). Le second envoi echoue
 * proprement au lieu d ecraser le premier en silence.
 */

export type RsvpResult =
  | { ok: true; version: number; status: "ATTENDING" | "DECLINED" | "MAYBE" }
  | { ok: false; code: RsvpErrorCode | "NOT_FOUND"; message: string };

class ConflictError extends Error {}

export async function submitRsvp(input: RsvpSubmission, now = new Date()): Promise<RsvpResult> {
  const invitation = await prisma.invitation.findUnique({
    where: { token: input.token },
    select: {
      id: true,
      revokedAt: true,
      expiresAt: true,
      response: { select: { id: true, status: true, version: true } },
      group: {
        select: {
          id: true,
          maxSeats: true,
          guests: { select: { id: true, isPlusOne: true } },
          event: {
            select: {
              status: true,
              rsvpSettings: true,
              meals: { select: { id: true } },
              questions: { select: { id: true, type: true, options: true, required: true, perGuest: true } },
            },
          },
        },
      },
    },
  });

  if (!invitation) return { ok: false, code: "NOT_FOUND", message: "Invitation introuvable." };
  const { group } = invitation;
  const { event } = group;
  if (!canReadInvitation({ revokedAt: invitation.revokedAt, expiresAt: invitation.expiresAt, eventStatus: event.status }, now)) {
    return { ok: false, code: "NOT_FOUND", message: "Invitation introuvable." };
  }

  const check = checkRsvp(input, {
    now,
    settings: parseRsvpSettings(event.rsvpSettings),
    eventStatus: event.status,
    maxSeats: group.maxSeats,
    currentStatus: invitation.response?.status ?? "PENDING",
    currentVersion: invitation.response?.version ?? 0,
    members: group.guests,
    mealIds: event.meals.map((m) => m.id),
    questions: event.questions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === "string") : [],
    })),
  });
  if (!check.ok) return check;
  const { plan } = check;

  try {
    const version = await prisma.$transaction(async (tx) => {
      // --- Personnes ------------------------------------------------------
      const idByKey = new Map<string, string>();
      for (const member of plan.members) {
        idByKey.set(member.key, member.existingId!);
        await tx.guest.update({ where: { id: member.existingId! }, data: { attending: member.attending } });
      }
      if (plan.removedPlusOneIds.length) {
        await tx.guest.deleteMany({ where: { id: { in: plan.removedPlusOneIds }, groupId: group.id, isPlusOne: true } });
      }
      for (const [index, person] of plan.newPlusOnes.entries()) {
        const created = await tx.guest.create({
          data: {
            groupId: group.id,
            firstName: person.firstName,
            lastName: person.lastName,
            ageCategory: person.ageCategory,
            isPlusOne: true,
            attending: true,
            position: 100 + index,
          },
          select: { id: true },
        });
        idByKey.set(person.key, created.id);
      }

      // --- Repas et allergies --------------------------------------------
      // Les absents ne gardent ni repas ni allergie : pas de donnee sans usage.
      const present = [...plan.members, ...plan.newPlusOnes].filter((p) => p.attending === true);
      const absentIds = plan.members.filter((m) => m.attending !== true).map((m) => m.existingId!);
      if (absentIds.length) await tx.guestPreference.deleteMany({ where: { guestId: { in: absentIds } } });
      for (const person of present) {
        const guestId = idByKey.get(person.key)!;
        const data = { mealOptionId: plan.meals[person.key] ?? null, allergies: plan.allergies[person.key] ?? null };
        await tx.guestPreference.upsert({ where: { guestId }, create: { guestId, ...data }, update: data });
      }

      // --- Reponse, avec verrou optimiste ---------------------------------
      const responseData = {
        status: plan.status,
        message: plan.message,
        respondedAt: now,
        sensitiveConsentAt: plan.consent ? now : null,
      };
      let responseId: string;
      let nextVersion: number;
      if (!invitation.response) {
        const created = await tx.rsvpResponse.create({
          data: { invitationId: invitation.id, version: 1, ...responseData },
          select: { id: true },
        });
        responseId = created.id;
        nextVersion = 1;
      } else {
        const updated = await tx.rsvpResponse.updateMany({
          where: { id: invitation.response.id, version: invitation.response.version },
          data: { ...responseData, version: { increment: 1 } },
        });
        if (updated.count === 0) throw new ConflictError();
        responseId = invitation.response.id;
        nextVersion = invitation.response.version + 1;
      }

      await tx.rsvpAnswer.deleteMany({ where: { responseId } });
      if (plan.answers.length) {
        await tx.rsvpAnswer.createMany({
          data: plan.answers.map((a) => ({
            responseId,
            questionId: a.questionId,
            guestId: a.key ? (idByKey.get(a.key) ?? null) : null,
            value: a.value as Prisma.InputJsonValue,
          })),
        });
      }

      // Historique : ce qui a change et quand. Jamais le texte des allergies,
      // qui doit pouvoir etre purge (D12) sans survivre dans l historique.
      await tx.rsvpHistory.create({
        data: {
          responseId,
          snapshot: {
            version: nextVersion,
            status: plan.status,
            present: present.map((p) => ({ name: [p.firstName, p.lastName].filter(Boolean).join(" ") || null, age: p.ageCategory, plusOne: p.isPlusOne })),
            meals: Object.values(plan.meals),
            allergies: Object.values(plan.allergies).filter(Boolean).length,
            answers: plan.answers.length,
          },
        },
      });

      await tx.invitation.update({ where: { id: invitation.id }, data: { state: "RESPONDED" } });
      return nextVersion;
    });
    return { ok: true, version, status: plan.status };
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (error instanceof ConflictError || duplicate) {
      return { ok: false, code: "CONFLICT", message: "Votre réponse a été modifiée entre-temps, depuis un autre appareil. Rechargez la page." };
    }
    throw error;
  }
}
