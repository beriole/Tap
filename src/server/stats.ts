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

/**
 * De quoi remplir le tableau de bord d administration.
 *
 * Il n affichait que cinq nombres sur une page vide aux deux tiers. Un
 * back-office doit dire ce qui demande une intervention, pas seulement
 * combien de choses existent : on remonte donc aussi la tendance, les
 * dernieres arrivees, et ce qui reste en souffrance.
 */
export type AdminOverview = {
  trend: number[];
  attention: { lost: number; suspended: number; invited: number; unlinked: number };
  recentCards: { token: string; label: string | null; status: string; owner: string | null; at: Date }[];
  recentClients: { name: string | null; email: string; status: string; at: Date }[];
  topProfiles: { name: string; token: string | null; scans: number }[];
};

export async function getAdminOverview(days = 30): Promise<AdminOverview> {
  const since = daysAgo(days);

  const [scanRows, lost, suspended, invited, unlinked, recentCards, recentClients, topCards] =
    await Promise.all([
      prisma.scanEvent.findMany({ where: { timestamp: { gte: since } }, select: { timestamp: true } }),
      prisma.nfcCard.count({ where: { status: "LOST" } }),
      prisma.nfcCard.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { status: "INVITED" } }),
      // Un client actif sans aucune carte : compte cree, carte jamais remise.
      prisma.user.count({
        where: { role: "CLIENT", status: "ACTIVE", profiles: { every: { cards: { none: {} } } } },
      }),
      prisma.nfcCard.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          publicToken: true,
          label: true,
          status: true,
          createdAt: true,
          assignedProfile: { select: { displayName: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "CLIENT" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { name: true, email: true, status: true, createdAt: true },
      }),
      prisma.nfcCard.findMany({
        where: { assignedProfileId: { not: null } },
        select: {
          publicToken: true,
          assignedProfile: { select: { displayName: true } },
          _count: { select: { scans: true } },
        },
      }),
    ]);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(daysAgo(i).toISOString().slice(0, 10), 0);
  }
  for (const row of scanRows) {
    const key = row.timestamp.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    trend: [...buckets.values()],
    attention: { lost, suspended, invited, unlinked },
    recentCards: recentCards.map((c) => ({
      token: c.publicToken,
      label: c.label,
      status: c.status,
      owner: c.assignedProfile?.displayName ?? null,
      at: c.createdAt,
    })),
    recentClients: recentClients.map((u) => ({
      name: u.name,
      email: u.email,
      status: u.status,
      at: u.createdAt,
    })),
    topProfiles: topCards
      .map((c) => ({
        name: c.assignedProfile?.displayName ?? "Profil supprime",
        token: c.publicToken,
        scans: c._count.scans,
      }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5),
  };
}
