import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInvitationTheme, INVITATION_THEMES, resolveThemeSettings } from "@/config/invitation-themes";
import { eventPlan } from "@/config/event-plans";
import { eventRoute, parseBody } from "@/server/events/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  themeKey: z.enum(Object.keys(INVITATION_THEMES) as [string, ...string[]]),
  settings: z.record(z.unknown()).default({}),
});

/**
 * Enregistre le theme et ses reglages.
 *
 * Les reglages sont filtres par resolveThemeSettings : ce qui est stocke est
 * toujours une combinaison valide du theme. Changer de theme ne touche a rien
 * d autre - les donnees de l evenement ne sont pas dans ce fichier (§22
 * "le changement de theme conserve toutes les donnees metier").
 */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await eventRoute(id, "design");
  if (!access.ok) return access.response;

  const body = await parseBody(request, schema);
  if (!body.ok) return body.response;

  const event = await prisma.event.findUniqueOrThrow({ where: { id }, select: { plan: true } });
  const plan = eventPlan(event.plan);
  const theme = getInvitationTheme(body.value.themeKey);
  if (plan.themeKeys !== "all" && !plan.themeKeys.includes(theme.key)) {
    return NextResponse.json({ error: `Le theme ${theme.name} n est pas inclus dans l offre ${plan.name}.` }, { status: 409 });
  }

  const settings = resolveThemeSettings(theme.key, body.value.settings);
  await prisma.event.update({ where: { id }, data: { themeKey: theme.key, themeSettings: settings } });
  return NextResponse.json({ themeKey: theme.key, settings });
}
