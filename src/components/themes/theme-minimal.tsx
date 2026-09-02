import {
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
 * 01 - Minimal
 * Fond clair, air, une serif qui a une main pour le nom, tout le reste au
 * repos. Cible : consultants, etudiants, developpeurs.
 *
 * La discipline du theme : un seul element colore sur toute la page, le bouton
 * d enregistrement du contact. Rien d autre ne prend l accent.
 */
export function ThemeMinimal({ profile, preview }: ThemeProps) {
  const { identity, presentation, links, id, cardToken } = profile;

  return (
    <Stage as="main" className="profile-shell pb-2 pt-16">
      <StageItem as="header">
        <ProfileHeader preview={preview} profile={profile} avatarSize={100} align="center" family="display" />
      </StageItem>

      {presentation.availability && (
        <StageItem className="mt-5 flex justify-center">
          <span className="tap-target min-h-0 gap-2 rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-[length:var(--text-micro)] text-[var(--muted)]">
            <span
              aria-hidden
              className="live-dot size-1.5 rounded-full bg-[var(--accent)] text-[var(--accent)]"
            />
            {presentation.availability}
          </span>
        </StageItem>
      )}

      {identity.bio && (
        <StageItem>
          <p className="mt-6 text-center text-[length:var(--text-body)] leading-[1.65] text-[var(--muted)]">
            {identity.bio}
          </p>
        </StageItem>
      )}

      <StageItem className="mt-8">
        <SaveContactButton
          token={cardToken}
          profileId={id}
          name={identity.displayName}
          preview={preview}
        />
      </StageItem>

      <StageItem>
        <QuickActions profile={profile} preview={preview} className="mt-7" />
      </StageItem>

      {presentation.ctaUrl && presentation.ctaLabel && (
        <StageItem>
          <a
            href={presentation.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target mt-8 justify-center rounded-[var(--radius-button)] border border-[var(--foreground)] px-6 font-medium"
          >
            {presentation.ctaLabel}
          </a>
        </StageItem>
      )}

      <div className="mt-9">
        <LinkList links={links} profileId={id} variant="outline" preview={preview} />
      </div>

      <ProfileFooter />
    </Stage>
  );
}
