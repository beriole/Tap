import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateSecureToken } from "@/lib/tokens";
import { writeAudit } from "@/server/audit";

/**
 * §16 - Clients : creer, suspendre, reactiver, reinitialiser l acces.
 *
 * Toute operation passe par le journal d audit (§12) : ce sont exactement les
 * actions qu il faut pouvoir reconstituer apres coup.
 */

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  displayName: z.string().trim().min(2).max(80).optional(),
});

const actionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(["SUSPEND", "REACTIVATE", "RESET_ACCESS"]),
});

/** §5.1 - "Inscription controlee ou invitation apres achat de la carte." */
export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides", issues: parsed.error.issues }, { status: 422 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "Cet e-mail existe deja" }, { status: 409 });

  const inviteToken = generateSecureToken();

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "CLIENT",
      status: "INVITED",
      tokens: {
        create: {
          identifier: parsed.data.email,
          token: inviteToken,
          purpose: "INVITE",
          expires: new Date(Date.now() + 14 * 86_400_000),
        },
      },
      profiles: {
        create: { displayName: parsed.data.displayName ?? parsed.data.name },
      },
    },
    include: { profiles: { select: { id: true } } },
  });

  await writeAudit({
    actorId: admin.id,
    action: "client.create",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email },
  });

  // L envoi d e-mail n est pas configure (voir README) : on rend le lien a
  // l administrateur, qui le transmet lui-meme. Mieux vaut un lien visible
  // qu une invitation qu on croit partie et qui n arrive jamais.
  return NextResponse.json(
    {
      user: { id: user.id, email: user.email, status: user.status },
      inviteUrl: `/reset-password?token=${inviteToken}`,
      emailSent: false,
    },
    { status: 201 },
  );
}

/** Suspension, reactivation et reinitialisation d acces. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Un administrateur ne se suspend pas lui-meme, et seul un super-admin peut
  // toucher a un autre administrateur.
  if (target.id === admin.id) {
    return NextResponse.json({ error: "Action impossible sur son propre compte" }, { status: 400 });
  }
  if (target.role !== "CLIENT" && admin.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Reserve au super-administrateur" }, { status: 403 });
  }

  if (parsed.data.action === "RESET_ACCESS") {
    const token = generateSecureToken();
    await prisma.$transaction([
      // Un reset invalide les sessions ouvertes : sinon l ancien acces survit.
      prisma.session.deleteMany({ where: { userId: target.id } }),
      prisma.verificationToken.create({
        data: {
          identifier: target.email,
          token,
          purpose: "PASSWORD_RESET",
          expires: new Date(Date.now() + 86_400_000),
          userId: target.id,
        },
      }),
    ]);

    await writeAudit({
      actorId: admin.id,
      action: "client.reset_access",
      targetType: "User",
      targetId: target.id,
    });

    return NextResponse.json({ resetUrl: `/reset-password?token=${token}`, emailSent: false });
  }

  const status = parsed.data.action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
  const user = await prisma.user.update({
    where: { id: target.id },
    data: { status },
  });

  if (status === "SUSPENDED") {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  await writeAudit({
    actorId: admin.id,
    action: status === "SUSPENDED" ? "client.suspend" : "client.reactivate",
    targetType: "User",
    targetId: target.id,
  });

  return NextResponse.json({ user: { id: user.id, status: user.status } });
}

/** Reservee au super-administrateur : cree un compte administrateur. */
export async function PUT(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (admin?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Reserve au super-administrateur" }, { status: 403 });
  }

  const parsed = createSchema
    .extend({ password: z.string().min(10) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 422 });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await writeAudit({
    actorId: admin.id,
    action: "admin.create",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}
