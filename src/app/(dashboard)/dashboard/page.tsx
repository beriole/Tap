import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight, Copy, Link2, Palette, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cardUrl } from "@/config/site";
import { getProfileStats } from "@/server/stats";
import { previewProfile } from "@/server/card-resolution";
import {
  EmptyState,
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  Surface,
} from "@/components/app/ui";
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
        <PageBody>
          <EmptyState
            title="Aucun profil"
            body="Commencez par votre nom, votre poste et vos coordonnees. Vous choisirez le theme ensuite."
            actionHref="/dashboard/profile"
            actionLabel="Creer mon profil"
          />
        </PageBody>
      </>
    );
  }

  const stats = await getProfileStats(profile.id, 30);
  const token = profile.cards[0]?.publicToken;
  const preview = await previewProfile(profile.id);
  const topLinks = stats.topLinks.slice(0, 3);

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
                className="tap-target rounded-xl border border-[var(--console-hair-strong)] bg-white/5 px-4 text-[0.85rem] font-medium text-[var(--console-on-band)] transition-colors hover:bg-white/10"
              >
                Voir en ligne
                <ArrowUpRight className="size-4" />
              </a>
            )}
          </div>
        }
        stats={[
          {
            label: "Scans",
            value: stats.totalScans,
            trend: stats.daily.map((d) => d.scans),
          },
          { label: "7 jours", value: stats.scans7d, tone: "plain" },
          { label: "30 jours", value: stats.scans30d, tone: "plain" },
          { label: "Liens publies", value: profile._count.links, tone: "plain" },
        ]}
        /* L apercu vit DANS la bande et deborde vers le bas : ce n est pas une
           vignette posee a cote du texte, c est la piece maitresse de l ecran -
           la page reelle, rendue par les memes composants qu apres un scan. */
        aside={
          <div className="relative -mb-40">
            {/* Le telephone est noir et la bande aussi : sans lumiere derriere
                lui, il disparaissait purement et simplement dans l encre.
                La lueur s arrete au tiers superieur : plus bas, l appareil
                repose deja sur le papier - et une lueur qui debordait la
                delavait la carte voisine, QR Code compris. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -top-12 h-2/5 bg-[radial-gradient(closest-side,rgb(217_142_90/0.24),transparent_75%)]"
            />
            <div className="relative rounded-[2.2rem] shadow-[0_30px_90px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
              <PhoneFrame width={248} height={504}>
                <ThemeRenderer profile={preview} preview />
              </PhoneFrame>
            </div>
            <p className="relative mt-3 flex items-center justify-center gap-2 text-[0.72rem] text-[var(--console-on-band-dim)]">
              {/* live-dot peint tout son cadre : il lui faut un element a lui,
                  sinon la pastille recouvre le texte qu elle accompagne. */}
              <span className="live-dot size-1.5 shrink-0 text-[var(--state-live)]" aria-hidden />
              Apercu en direct
            </p>
          </div>
        }
      />

      {/* La colonne de gauche laisse la place a l apercu qui redescend de la
          bande : sans cette reserve, les fiches passeraient dessous. */}
      <PageBody className="lg:pr-[19rem]">
        <div className="grid gap-6">
          <div className="space-y-5">
            <Surface>
              <SectionTitle>Votre carte NFC</SectionTitle>
              {token ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="min-w-0 flex-1 truncate rounded-xl bg-[var(--console-paper)] px-3.5 py-3 font-[family-name:var(--font-mono)] text-[0.82rem]">
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
        </div>

        {/* Sous l apercu, la page reprend toute sa largeur : reserver la
            colonne de droite jusqu en bas laissait un vide inutile. */}
        {topLinks.length > 0 && (
          <Surface className="mt-6 lg:-mr-[19rem]">
            <SectionTitle
              hint={
                <Link href="/dashboard/stats" className="hover:underline">
                  Toutes les statistiques
                </Link>
              }
            >
              Ce que vos visiteurs ouvrent le plus
            </SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-3">
              {topLinks.map((l, i) => (
                <li
                  key={l.linkId}
                  className="rounded-xl border border-[var(--console-hairline)] bg-[var(--console-paper)] p-3.5"
                >
                  <p className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-[0.68rem] text-[var(--muted)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.86rem] font-medium">
                      {l.label}
                    </span>
                  </p>
                  <p className="console-figure mt-1.5 text-[1.35rem] text-[var(--brand-copper-deep)]">
                    {l.count}
                    <span className="ml-1.5 font-[family-name:var(--font-sans)] text-[0.72rem] font-normal text-[var(--muted)]">
                      ouverture{l.count > 1 ? "s" : ""}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </Surface>
        )}
      </PageBody>
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
        className="group flex items-center gap-3 rounded-xl border border-[var(--console-hairline)] px-3.5 py-3 text-[0.85rem] transition-all hover:-translate-y-0.5 hover:border-[var(--brand-copper)] hover:bg-[var(--console-paper)]"
      >
        <Icon className="size-4 shrink-0 text-[var(--muted)]" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ArrowUpRight className="size-3.5 shrink-0 opacity-30 transition-opacity group-hover:opacity-70" />
      </Link>
    </li>
  );
}
