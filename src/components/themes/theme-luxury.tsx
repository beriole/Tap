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
 * 05 - Luxury
 * Noir/ivoire, portrait en 4:5, serif editoriale, un filet dore, presque rien
 * d autre. Cible : marques premium, immobilier, mode.
 *
 * La contrainte du theme est sa valeur : cinq liens au maximum. Une maison de
 * luxe ne presente pas un mur de boutons, elle choisit. La regle est appliquee
 * ici plutot que laissee a la discipline du client.
 */
export function ThemeLuxury({ profile, preview }: ThemeProps) {
  const { identity, presentation, links, id, cardToken } = profile;

  return (
    <main className="min-h-dvh bg-[#0a0908] text-[#f4f0e6]">
      <Stage className="profile-shell pb-2 pt-16">
        {identity.avatarUrl && (
          <StageItem>
            <Image
              src={identity.avatarUrl}
              alt={identity.displayName}
              width={480}
              height={600}
              priority
              sizes="(max-width: 480px) 100vw, 16rem"
              className="mx-auto mb-10 aspect-[4/5] w-full max-w-[15rem] object-cover"
            />
          </StageItem>
        )}

        <StageItem as="header" className="text-center">
          {identity.company && (
            <p
              className="mb-4 text-[length:var(--text-micro)] uppercase tracking-[0.42em]"
              style={{ color: "var(--accent)" }}
            >
              {identity.company}
            </p>
          )}
          <ProfileName preview={preview} className="font-[family-name:var(--font-display)] text-[length:var(--text-display)] leading-[1.08] tracking-[-0.015em]">
            {identity.displayName}
          </ProfileName>
          {identity.title && (
            <p className="mt-3 text-[length:var(--text-micro)] uppercase tracking-[0.3em] text-white/45">
              {identity.title}
            </p>
          )}
        </StageItem>

        <StageItem>
          <div className="mx-auto my-9 h-px w-14" style={{ background: "var(--accent)" }} aria-hidden />
        </StageItem>

        {identity.bio && (
          <StageItem>
            <p className="text-center font-[family-name:var(--font-display)] text-[length:var(--text-lead)] leading-[1.6] text-white/70">
              {identity.bio}
            </p>
          </StageItem>
        )}

        <StageItem className="mt-10">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
            variant="outline"
            label="Enregistrer le contact"
            className="rounded-none text-[length:var(--text-caption)] uppercase tracking-[0.28em]"
          />
        </StageItem>

        {presentation.ctaUrl && presentation.ctaLabel && (
          <StageItem>
            <a
              href={presentation.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mt-3 justify-center border border-white/20 px-8 text-[length:var(--text-micro)] uppercase tracking-[0.28em] text-white/70"
            >
              {presentation.ctaLabel}
            </a>
          </StageItem>
        )}

        <div className="mt-10">
          <LinkList links={links.slice(0, 5)} profileId={id} variant="ghost" preview={preview} />
        </div>

        <StageItem>
          <QuickActions profile={profile} tone="ink" preview={preview} className="mt-10" />
        </StageItem>

        <ProfileFooter />
      </Stage>
    </main>
  );
}
