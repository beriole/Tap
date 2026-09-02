import "server-only";
import { prisma } from "@/lib/prisma";

/** §12 - "Journal d audit pour les operations administratives sensibles." */
export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: (input.metadata ?? {}) as object,
      ip: input.ip ?? null,
    },
  });
}
