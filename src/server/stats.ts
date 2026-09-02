import "server-only";
import { prisma } from "@/lib/prisma";

/** §15 - metriques simples et utiles, sans surveillance intrusive. */
export type ProfileStats = {
  totalScans: number;
  scans7d: number;
  scans30d: number;
  clicksByAction: { action: string; count: number }[];
  topLinks: { linkId: string; label: string; count: number }[];
  daily: { date: string; scans: number; clicks: number }[];
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export async function getProfileStats(profileId: string, days = 30): Promise<ProfileStats> {
  const cards = await prisma.nfcCard.findMany({
    where: { assignedProfileId: profileId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);

  const [totalScans, scans7d, scans30d, clicksByAction, links, scanRows, clickRows] =
    await Promise.all([
      prisma.scanEvent.count({ where: { cardId: { in: cardIds } } }),
      prisma.scanEvent.count({ where: { cardId: { in: cardIds }, timestamp: { gte: daysAgo(7) } } }),
      prisma.scanEvent.count({ where: { cardId: { in: cardIds }, timestamp: { gte: daysAgo(30) } } }),
      prisma.clickEvent.groupBy({
        by: ["action"],
        where: { profileId, timestamp: { gte: daysAgo(days) } },
        _count: { _all: true },
      }),
      prisma.clickEvent.groupBy({
        by: ["linkId"],
        where: { profileId, linkId: { not: null }, timestamp: { gte: daysAgo(days) } },
        _count: { _all: true },
        orderBy: { _count: { linkId: "desc" } },
        take: 8,
      }),
      prisma.scanEvent.findMany({
        where: { cardId: { in: cardIds }, timestamp: { gte: daysAgo(days) } },
        select: { timestamp: true },
      }),
      prisma.clickEvent.findMany({
        where: { profileId, timestamp: { gte: daysAgo(days) } },
        select: { timestamp: true },
      }),
    ]);

  const labels = await prisma.profileLink.findMany({
    where: { id: { in: links.map((l) => l.linkId as string) } },
    select: { id: true, label: true },
  });
  const labelById = new Map(labels.map((l) => [l.id, l.label]));

  const buckets = new Map<string, { scans: number; clicks: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(daysAgo(i).toISOString().slice(0, 10), { scans: 0, clicks: 0 });
  }
  for (const row of scanRows) {
    const key = row.timestamp.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.scans += 1;
  }
  for (const row of clickRows) {
    const key = row.timestamp.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.clicks += 1;
  }

  return {
    totalScans,
    scans7d,
    scans30d,
    clicksByAction: clicksByAction.map((c) => ({ action: c.action, count: c._count._all })),
    topLinks: links.map((l) => ({
      linkId: l.linkId as string,
      label: labelById.get(l.linkId as string) ?? "Lien supprime",
      count: l._count._all,
    })),
    daily: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
  };
}

/** §16 - Dashboard admin : vue globale. */
export async function getPlatformStats() {
  const [clients, activeCards, unassignedCards, scans30d, newAccounts30d] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.nfcCard.count({ where: { status: "ACTIVE" } }),
    prisma.nfcCard.count({ where: { status: "UNASSIGNED" } }),
    prisma.scanEvent.count({ where: { timestamp: { gte: daysAgo(30) } } }),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
  ]);
  return { clients, activeCards, unassignedCards, scans30d, newAccounts30d };
}
