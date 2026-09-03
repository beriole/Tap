import Image from "next/image";
import {
  ContactRows,
  ProfileFooter,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { LinkList, QuickActions } from "@/components/profile";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 14 - Onyx
 * Noir profond et or : portrait rond cercle d or, coordonnees en cadres fins
 * avec l etiquette au-dessus de la valeur, barre d enregistrement en degrade
 * dore en pied de page.
 * Cible : consultants, avocats, courtiers, services haut de gamme.
 *
 * La barre de contact est fixee en bas de l ecran plutot que dans le flux :
 * quel que soit le defilement, le geste principal reste sous le pouce. C est le
 * seul theme a le faire, parce que c est le seul dont la liste de coordonnees
 * peut devenir longue.
 */
export function ThemeOnyx({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;

  return (
    <main className="relative min-h-dvh bg-[#0A0A0C] pb-28 text-[#F5F1E8]">
      {identity.coverUrl && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-52 overflow-hidden">
          <Image
            src={identity.coverUrl}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0C]/70 to-[#0A0A0C]" />
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background: "radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 72%)",
        }}
      />

      <Stage className="profile-shell relative pt-12">
        <StageItem className="flex justify-center">
          <div
            className="rounded-full p-[2px]"
            style={{ background: "linear-gradient(150deg, var(--accent), transparent 55%, var(--accent))" }}
          >
            {identity.avatarUrl ? (
              <Image
                src={identity.avatarUrl}
                alt={identity.displayName}
                width={112}
                height={112}
                priority
                sizes="112px"
                className="size-28 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-full bg-[#15151A] text-2xl">
                {initials(identity.displayName)}
              </div>
            )}
          </div>
        </StageItem>

        <StageItem as="header" className="mt-4 text-center">
          <ProfileName preview={preview} className="text-[1.45rem] font-semibold tracking-[-0.015em]">
            {identity.displayName}
          </ProfileName>
          {identity.title && (
            <p className="mt-1 text-[0.82rem]" style={{ color: "var(--accent)" }}>
              {identity.title}
            </p>
          )}
        </StageItem>

        <StageItem>
          <QuickActions profile={profile} tone="ink" preview={preview} className="mt-5" />
        </StageItem>

        <StageItem>
          <ContactRows
            profile={profile}
            layout="boxed"
            tone="dark"
            preview={preview}
            className="mt-6"
          />
        </StageItem>

        {links.length > 0 && (
          <div className="mt-3">
            <LinkList links={links} profileId={id} variant="glass" preview={preview} />
          </div>
        )}

        <ProfileFooter compact />
      </Stage>

      {/* Barre fixe : le geste principal reste atteignable a tout moment. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0A0A0C]/85 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-[27rem]">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
            className="text-neutral-900"
          />
        </div>
      </div>
    </main>
  );
}
