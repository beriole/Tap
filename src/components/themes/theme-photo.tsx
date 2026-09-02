import Image from "next/image";
import {
  LinkList,
  ProfileFooter,
  QuickActions,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 07 - Photo
 * Image plein ecran, panneau de verre remonte depuis le bas.
 * Cible : photographes, modeles, creatifs.
 *
 * Sans image, ce theme n a plus de sujet : il bascule alors sur un fond de
 * couleur profonde derive de l accent plutot que d afficher un cadre vide.
 */
export function ThemePhoto({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;
  const image = identity.coverUrl ?? identity.avatarUrl;

  return (
    <main className="relative min-h-dvh bg-black text-white">
      {image ? (
        <Image
          src={image}
          alt={identity.displayName}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 15%, color-mix(in srgb, var(--accent) 45%, #000) 0%, #000 75%)",
          }}
        />
      )}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/90"
      />

      <Stage className="relative flex min-h-dvh flex-col justify-end">
        <div className="profile-shell pb-6">
          <StageItem className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-2xl">
            <ProfileName preview={preview} className="font-[family-name:var(--font-display)] text-[length:var(--text-title)] leading-[1.05] tracking-[-0.02em]">
              {identity.displayName}
            </ProfileName>
            {identity.title && (
              <p className="mt-1.5 text-[length:var(--text-caption)] text-white/65">
                {identity.title}
              </p>
            )}
            {identity.bio && (
              <p className="mt-3 text-[length:var(--text-body)] leading-[1.6] text-white/70">
                {identity.bio}
              </p>
            )}

            <div className="mt-5">
              <SaveContactButton
                token={cardToken}
                profileId={id}
                name={identity.displayName}
                preview={preview}
                variant="glass"
              />
            </div>

            <QuickActions profile={profile} tone="glass" preview={preview} className="mt-5" />
          </StageItem>

          <div className="mt-3">
            <LinkList links={links} profileId={id} variant="glass" preview={preview} />
          </div>

          <ProfileFooter compact />
        </div>
      </Stage>
    </main>
  );
}
