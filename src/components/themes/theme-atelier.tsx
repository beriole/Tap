import Image from "next/image";
import {
  ContactRows,
  InlineQr,
  ProfileFooter,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { LinkList } from "@/components/profile";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 15 - Atelier
 * En-tete sombre, feuille blanche remontee par-dessus, QR loge dans la feuille,
 * bandeau d accent en pied.
 * Cible : agences, artisans, prestataires de service.
 *
 * La feuille blanche qui chevauche l en-tete sombre est le geste du theme :
 * elle separe nettement l identite (en haut, sur fond sombre) de ce qu on peut
 * FAIRE (en bas, sur fond clair). Deux zones, deux intentions de lecture.
 */
export function ThemeAtelier({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;

  return (
    <main className="min-h-dvh bg-[#101318] pb-2">
      {/* Zone identite */}
      <div className="relative overflow-hidden pb-16 pt-12">
        {identity.coverUrl && (
          <Image
            src={identity.coverUrl}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-40"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 0%, color-mix(in srgb, var(--accent) 26%, transparent) 0%, transparent 70%), linear-gradient(180deg, rgba(16,19,24,0.35) 0%, rgba(16,19,24,0.92) 100%)",
          }}
        />
        <Stage className="profile-shell relative text-center text-white">
          <StageItem className="flex justify-center">
            <div
              className="rounded-full p-[3px]"
              style={{ background: "var(--accent)" }}
            >
              {identity.avatarUrl ? (
                <Image
                  src={identity.avatarUrl}
                  alt={identity.displayName}
                  width={104}
                  height={104}
                  priority
                  sizes="104px"
                  className="size-26 rounded-full object-cover"
                  style={{ width: 104, height: 104 }}
                />
              ) : (
                <div className="flex size-[104px] items-center justify-center rounded-full bg-[#1b2029] text-2xl">
                  {initials(identity.displayName)}
                </div>
              )}
            </div>
          </StageItem>

          {identity.logoUrl && (
            <StageItem className="mt-5 flex justify-center">
              <Image
                src={identity.logoUrl}
                alt={identity.company ?? ""}
                width={36}
                height={36}
                className="opacity-85"
              />
            </StageItem>
          )}

          <StageItem as="header" className="mt-4">
            <ProfileName preview={preview} className="text-[1.4rem] font-semibold tracking-[-0.015em]">
              {identity.displayName}
            </ProfileName>
            {identity.title && (
              <p className="mt-1 text-[0.8rem] text-white/55">{identity.title}</p>
            )}
            {identity.company && (
              <p className="mt-2 text-[0.65rem] uppercase tracking-[0.28em]" style={{ color: "var(--accent)" }}>
                {identity.company}
              </p>
            )}
          </StageItem>
        </Stage>
      </div>

      {/* Feuille claire : tout ce sur quoi on peut agir */}
      <Stage className="relative -mt-10 rounded-t-[2rem] bg-white pb-8 pt-7 text-neutral-900">
        <div className="profile-shell">
          <StageItem className="flex items-start gap-4">
            <ContactRows
              profile={profile}
              layout="stacked"
              preview={preview}
              className="min-w-0 flex-1"
            />
            <InlineQr
              token={cardToken}
              profileId={id}
              caption=""
              preview={preview}
              className="w-[7.5rem] shrink-0 border-neutral-200 p-2"
            />
          </StageItem>

          {links.length > 0 && (
            <div className="mt-6">
              <LinkList links={links} profileId={id} variant="outline" preview={preview} />
            </div>
          )}

          <ProfileFooter compact />
        </div>
      </Stage>

      {/* Bandeau d accent : le geste principal ferme la page. */}
      <div className="px-0 pb-0">
        <div style={{ background: "var(--accent)" }} className="px-5 py-4">
          <div className="mx-auto max-w-[27rem]">
            <SaveContactButton
              token={cardToken}
              profileId={id}
              name={identity.displayName}
              preview={preview}
              variant="glass"
              className="border-white/40 bg-white/15"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
