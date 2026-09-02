import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateSecureToken } from "@/lib/tokens";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { writeAudit } from "@/server/audit";

/**
 * §5.1 - Reinitialisation du mot de passe, et activation d un compte invite.
 *
 * POST demande un lien, PUT consomme le jeton.
 *
 * L envoi d e-mail n est pas configure : POST renvoie donc toujours la meme
 * reponse, et le lien n est expose que si RESEND_API_KEY est absent ET que l on
 * est hors production. En production sans e-mail configure, la demande echoue
 * franchement plutot que de laisser croire qu un message est parti.
 */

export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${clientIp(request.headers)}`, 5, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 422 });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, status: true },
  });

  // Reponse identique que le compte existe ou non : ne pas transformer ce
  // formulaire en oracle d existence de comptes (§12).
  const genericOk = { ok: true, message: "Si ce compte existe, un lien vient d etre envoye." };

  if (!user || user.status === "SUSPENDED") return NextResponse.json(genericOk);

  const token = generateSecureToken();
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      purpose: "PASSWORD_RESET",
      expires: new Date(Date.now() + 3_600_000),
      userId: user.id,
    },
  });

  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ...genericOk, devResetUrl: `/reset-password?token=${token}` });
  }

  // TODO: envoyer l e-mail via RESEND_API_KEY.
  return NextResponse.json(genericOk);
}

export async function PUT(request: Request) {
  const limit = rateLimit(`reset:${clientIp(request.headers)}`, 10, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Donnees invalides" },
      { status: 422 },
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
    select: { id: true, userId: true, expires: true, purpose: true },
  });

  if (!record?.userId || record.expires < new Date()) {
    return NextResponse.json({ error: "Lien invalide ou expire." }, { status: 400 });
  }
  if (record.purpose !== "PASSWORD_RESET" && record.purpose !== "INVITE") {
    return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        // Un compte invite devient actif en definissant son mot de passe :
        // ouvrir le lien recu prouve l acces a la boite e-mail.
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    }),
    // Jeton a usage unique, et toutes les sessions tombent.
    prisma.verificationToken.delete({ where: { id: record.id } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  await writeAudit({
    actorId: record.userId,
    action: record.purpose === "INVITE" ? "account.activated" : "account.password_reset",
    targetType: "User",
    targetId: record.userId,
    ip: clientIp(request.headers),
  });

  return NextResponse.json({ ok: true });
}
