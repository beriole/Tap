import Image from "next/image";
import {
  LinkList,
  ProfileFooter,
  QuickActions,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 03 - Creator
 * Grande couverture, portrait qui deborde sur l image, typographie franche.
 * Cible : createurs, artistes, influenceurs.
 *
 * Le chevauchement portrait/couverture est le geste du theme : il casse la
 * grille une seule fois, la ou le regard arrive.
 */
export function ThemeCreator({ profile, preview }: ThemeProps) {
  const { identity, presentation, links, id, cardToken } = profile;

  return (
    <main className="pb-2">
      <div className="relative h-56 w-full overflow-hidden">
        {identity.coverUrl ? (
          <Image src={identity.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            className="size-full"
            style={{
              background:
                "radial-gradient(120% 120% at 12% 0%, var(--accent) 0%, transparent 62%), linear-gradient(160deg, var(--accent), transparent)",
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </div>

      {/* relative + z-10 : la couverture est positionnee et masquerait sinon
          le haut du portrait qui la chevauche. */}
      <Stage className="profile-shell relative z-10 -mt-16">
        <StageItem>
          {identity.avatarUrl ? (
            <Image
              src={identity.avatarUrl}
              alt={identity.displayName}
              width={116}
              height={116}
              priority
              sizes="116px"
              className="size-[116px] rounded-[2rem] border-4 border-[var(--background)] object-cover shadow-[var(--shadow-lift)]"
            />
          ) : (
            <div className="flex size-[116px] items-center justify-center rounded-[2rem] border-4 border-[var(--background)] bg-[var(--accent)] text-3xl text-[var(--accent-foreground)]">
              {initials(identity.displayName)}
            </div>
          )}
        </StageItem>

        <StageItem as="header" className="mt-4">
          <ProfileName preview={preview} className="font-[family-name:var(--font-grotesk)] text-[length:var(--text-display)] font-bold leading-[1.02] tracking-[-0.035em]">
            {identity.displayName}
          </ProfileName>
          {identity.tagline && (
            <p className="mt-1.5 text-[length:var(--text-lead)] font-semibold text-[var(--accent)]">
              {identity.tagline}
            </p>
          )}
          {identity.title && (
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--muted)]">
              {identity.title}
            </p>
          )}
        </StageItem>

        {identity.bio && (
          <StageItem>
            <p className="mt-4 text-[length:var(--text-body)] leading-[1.65] text-[var(--muted)]">
              {identity.bio}
            </p>
          </StageItem>
        )}

        <StageItem className="mt-6">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
          />
        </StageItem>

        <StageItem>
          <QuickActions profile={profile} preview={preview} className="mt-6" />
        </StageItem>

        {presentation.ctaUrl && presentation.ctaLabel && (
          <StageItem>
            <a
              href={presentation.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mt-6 justify-center rounded-[var(--radius-pill)] border-2 border-[var(--foreground)] px-6 font-semibold"
            >
              {presentation.ctaLabel}
            </a>
          </StageItem>
        )}

        <div className="mt-8">
          <LinkList links={links} profileId={id} variant="outline" preview={preview} />
        </div>

        <ProfileFooter />
      </Stage>
    </main>
  );
}
