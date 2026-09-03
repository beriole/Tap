import Image from "next/image";
import {
  Ambience,
  GlassCard,
  LinkList,
  ProfileFooter,
  ProfileHeader,
  QuickActions,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import type { ThemeProps } from "@/types/profile";

/**
 * 09 - Aurora
 * Une carte de verre posee sur un champ de couleur qui derive lentement.
 * Cible : usage universel haut de gamme, profils qui veulent frapper vite.
 *
 * Le theme repond au moment reel du scan : quelque chose bouge deja quand
 * l ecran s allume, donc la page parait vivante avant meme d etre lue. La
 * derive est lente (22 s) et coupee par prefers-reduced-motion : c est une
 * atmosphere, pas une animation qu on regarde.
 */
export function ThemeAurora({ profile, preview }: ThemeProps) {
  const { identity, presentation, links, id, cardToken } = profile;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#06060a] text-white">
      {/* Si le client a charge une couverture, elle devient le fond : floutee
          et assombrie, elle donne au champ colore les teintes de sa marque. */}
      {identity.coverUrl && (
        <Image
          src={identity.coverUrl}
          alt=""
          fill
          priority
          sizes="25vw"
          className="scale-110 object-cover opacity-45 blur-2xl"
        />
      )}
      <Ambience
        from="var(--accent)"
        to="#7c3aed"
        third="#0ea5e9"
        intensity={identity.coverUrl ? 0.5 : 0.85}
      />

      <Stage className="profile-shell relative flex min-h-dvh flex-col justify-center py-14">
        {/* La carte de verre : un seul plan, pose au centre de l ecran. */}
        <GlassCard className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-[var(--shadow-hero)] backdrop-blur-2xl">
          <ProfileHeader
            preview={preview}
            profile={profile}
            avatarSize={104}
            align="center"
            ringed
            family="grotesk"
          />

          {identity.bio && (
            <p className="mt-5 text-center text-[length:var(--text-body)] leading-[1.6] text-white/65">
              {identity.bio}
            </p>
          )}

          <div className="mt-6">
            <SaveContactButton
              token={cardToken}
              profileId={id}
              name={identity.displayName}
              preview={preview}
            />
          </div>

          <QuickActions profile={profile} tone="glass" preview={preview} className="mt-6" />
        </GlassCard>

        {presentation.ctaUrl && presentation.ctaLabel && (
          <StageItem className="mt-4">
            <a
              href={presentation.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target justify-center rounded-[var(--radius-button)] border border-white/20 bg-white/8 px-6 font-medium backdrop-blur-md"
            >
              {presentation.ctaLabel}
            </a>
          </StageItem>
        )}

        <div className="mt-4">
          <LinkList links={links} profileId={id} variant="glass" preview={preview} />
        </div>

        <ProfileFooter compact />
      </Stage>
    </main>
  );
}
