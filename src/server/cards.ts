import "server-only";
import { prisma } from "@/lib/prisma";
import { generateCardToken } from "@/lib/tokens";
import { cardUrl } from "@/config/site";
import { writeAudit } from "@/server/audit";

/** §14 - creation d un lot puis encodage NDEF des URL generees. */
export async function createCardBatch(input: {
  quantity: number;
  batch?: string;
  label?: string;
  actorId: string;
}) {
  const created: { id: string; publicToken: string; url: string }[] = [];

  for (let i = 0; i < input.quantity; i += 1) {
    // Collision extremement improbable, mais la contrainte unique la couvre.
    let token = generateCardToken();
    while (await prisma.nfcCard.findUnique({ where: { publicToken: token }, select: { id: true } })) {
      token = generateCardToken();
    }
    const card = await prisma.nfcCard.create({
      data: { publicToken: token, batch: input.batch, label: input.label },
      select: { id: true, publicToken: true },
    });
    created.push({ ...card, url: cardUrl(card.publicToken) });
  }

  await writeAudit({
    actorId: input.actorId,
    action: "card.batch.create",
    targetType: "NfcCard",
    metadata: { quantity: input.quantity, batch: input.batch ?? null },
  });

  return created;
}

/**
 * §11 - "Le client ne peut ni changer le token public ni reaffecter lui-meme
 * une carte." L association est donc exclusivement administrative.
 */
export async function assignCard(input: {
  cardId: string;
  profileId: string | null;
  actorId: string;
}) {
  const card = await prisma.nfcCard.update({
    where: { id: input.cardId },
    data: {
      assignedProfileId: input.profileId,
      status: input.profileId ? "ACTIVE" : "UNASSIGNED",
      activatedAt: input.profileId ? new Date() : null,
    },
  });

  await writeAudit({
    actorId: input.actorId,
    action: input.profileId ? "card.assign" : "card.unassign",
    targetType: "NfcCard",
    targetId: card.id,
    metadata: { profileId: input.profileId },
  });

  return card;
}

/** §12 - "Possibilite de revoquer/suspendre immediatement une carte perdue." */
export async function setCardStatus(input: {
  cardId: string;
  status: "UNASSIGNED" | "ACTIVE" | "SUSPENDED" | "LOST" | "REPLACED";
  replacedByCardId?: string | null;
  notes?: string;
  actorId: string;
}) {
  const card = await prisma.nfcCard.update({
    where: { id: input.cardId },
    data: {
      status: input.status,
      suspendedAt: input.status === "ACTIVE" ? null : new Date(),
      replacedByCardId: input.replacedByCardId ?? undefined,
      notes: input.notes,
    },
  });

  await writeAudit({
    actorId: input.actorId,
    action: `card.status.${input.status.toLowerCase()}`,
    targetType: "NfcCard",
    targetId: card.id,
    metadata: { notes: input.notes ?? null },
  });

  return card;
}
