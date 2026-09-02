import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/server/audit";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    password: z
      .string()
      .min(10, "10 caracteres minimum.")
      .regex(/[a-z]/, "Une minuscule requise.")
      .regex(/[A-Z]/, "Une majuscule requise.")
      .regex(/[0-9]/, "Un chiffre requis."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

/** §12 - Changement de mot de passe par le client, avec limitation de debit. */
export async function PUT(request: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const limit = rateLimit(`password:${clientIp(request.headers)}`, 5, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Reessayez plus tard." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Donnees invalides" },
      { status: 422 },
    );
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record?.passwordHash) {
    return NextResponse.json({ error: "Aucun mot de passe defini sur ce compte." }, { status: 400 });
  }

  const valid = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  // Les autres sessions tombent : un changement de mot de passe doit
  // deconnecter un appareil vole ou prete.
  await prisma.session.deleteMany({ where: { userId: user.id } });

  await writeAudit({
    actorId: user.id,
    action: "account.password_changed",
    targetType: "User",
    targetId: user.id,
    ip: clientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
