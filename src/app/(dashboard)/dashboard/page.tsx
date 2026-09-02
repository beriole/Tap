import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight, Copy, Link2, Palette, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cardUrl } from "@/config/site";
import { getProfileStats } from "@/server/stats";
import { previewProfile } from "@/server/card-resolution";
import { EmptyState, PageHeader, Pill, SectionTitle, StatTile, Surface } from "@/components/app/ui";
import { PhoneFrame } from "@/components/marketing/phone";
import { ThemeRenderer } from "@/components/themes/theme-renderer";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardHome() {
  const user = await requireUser();

  const profile = await prisma.profile.findFirst({
    where: { userId: user.id },
    include: {
      cards: { where: { status: "ACTIVE" }, select: { publicToken: true } },
      theme: { include: { theme: true } },
      _count: { select: { links: true } },
    },
  });

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow="Bienvenue"
          title="Votre profil reste a creer"
          description="Renseignez votre identite et vos coordonnees : votre carte pointera dessus des la publication."
        />
        <EmptyState
          title="Aucun profil"
          body="Commencez par votre nom, votre poste et vos coordonnees. Vous choisirez le theme ensuite."
          actionHref="/dashboard/profile"
          actionLabel="Creer mon profil"
        />
      </>
    );
  }

  const stats = await getProfileStats(profile.id, 30);
  const token = profile.cards[0]?.publicToken;
  const preview = await previewProfile(profile.id);

  return (
    <>
      <PageHeader
        eyebrow="Tableau de bord"
        title={profile.displayName}
        description={
          profile.isPublished
            ? "Votre profil est en ligne. Toute modification est visible immediatement."
            : "Votre profil est en brouillon : il n est pas encore visible par les visiteurs."
        }
        action={
          <div className="flex items-center gap-2">
            <Pill tone={profile.isPublished ? "live" : "warn"}>
              {profile.isPublished ? "En ligne" : "Brouillon"}
            </Pill>
            {token && (
              <a
                href={cardUrl(token)}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-[0.85rem] font-medium"
              >
                Voir en ligne
                <ArrowUpRight className="size-4" />
              </a>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Scans" value={stats.totalScans} hint="depuis le debut" />
            <StatTile label="7 jours" value={stats.scans7d} tone="accent" />
            <StatTile label="30 jours" value={stats.scans30d} />
            <StatTile label="Liens" value={profile._count.links} hint="dont masques" />
          </div>

          <Surface>
            <SectionTitle>Votre carte NFC</SectionTitle>
            {token ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="min-w-0 flex-1 truncate rounded-xl bg-[var(--surface)] px-3.5 py-3 font-[family-name:var(--font-mono)] text-[0.82rem]">
                    {cardUrl(token)}
                  </code>
                  <Image
                    src={`/api/qr/${token}`}
                    alt="QR Code de votre carte"
                    width={72}
                    height={72}
                    unoptimized
                    className="shrink-0 rounded-lg bg-white p-1"
                  />
                </div>
                <p className="mt-3 flex items-start gap-2 text-[0.8rem] leading-relaxed text-[var(--muted)]">
                  <Copy className="mt-0.5 size-3.5 shrink-0" />
                  Cette adresse est gravee dans la puce et ne changera jamais. Le QR Code mene
                  exactement au meme endroit.
                </p>
              </>
            ) : (
              <p className="text-[0.87rem] leading-relaxed text-[var(--muted)]">
                Aucune carte active n est encore associee a ce profil. Votre administrateur
                l associera apres l encodage de la puce.
              </p>
            )}
          </Surface>

          <Surface>
            <SectionTitle>Continuer</SectionTitle>
            <ul className="grid gap-2 sm:grid-cols-2">
              <Shortcut href="/dashboard/profile" icon={Pencil} label="Modifier le profil" />
              <Shortcut href="/dashboard/links" icon={Link2} label="Gerer les liens" />
              <Shortcut
                href="/dashboard/theme"
                icon={Palette}
                label={`Theme : ${profile.theme?.theme.name ?? "aucun"}`}
              />
            </ul>
          </Surface>
        </div>

        {/* L apercu n est pas une vignette decorative : c est la page reelle,
            rendue par les memes composants que apres un scan. */}
        <div className="hidden justify-self-center lg:block">
          <PhoneFrame width={252} height={512}>
            <ThemeRenderer profile={preview} preview />
          </PhoneFrame>
          <p className="mt-3 text-center text-[0.72rem] text-[var(--muted)]">
            Apercu en direct
          </p>
        </div>
      </div>
    </>
  );
}

function Shortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-xl border border-[var(--border)] px-3.5 py-3 text-[0.85rem] transition-colors hover:border-[var(--brand-copper)]"
      >
        <Icon className="size-4 shrink-0 text-[var(--muted)]" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ArrowUpRight className="size-3.5 shrink-0 opacity-30 transition-opacity group-hover:opacity-70" />
      </Link>
    </li>
  );
}
