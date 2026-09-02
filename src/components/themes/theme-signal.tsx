import Image from "next/image";
import {
  InlineQr,
  PillLink,
  ProfileFooter,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 11 - Signal
 * Bandeau organique colore, portrait rond en debord, pilules aux couleurs des
 * services, QR pose dans la page, bouton de contact noir en pied.
 * Cible : commerciaux, formateurs, profils grand public.
 *
 * Le geste du theme est la forme organique du bandeau : une carte de visite
 * imprimee ne peut pas se permettre une decoupe pareille, un ecran si. C est ce
 * qui signale immediatement qu on n est pas devant un scan de papier.
 */
export function ThemeSignal({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;

  return (
    <main className="min-h-dvh bg-white pb-2 text-neutral-900">
      {/* Bandeau : deux ellipses qui se chevauchent, decoupees en bas. */}
      <div className="relative h-40 overflow-hidden">
        <div
          aria-hidden
          className="absolute -left-[15%] -top-[70%] h-[150%] w-[130%] rounded-[50%]"
          style={{ background: "var(--accent)" }}
        />
      </div>

      {/* relative + z-10 : le bandeau ci-dessus est positionne, il peindrait
          sinon par-dessus le portrait qui le chevauche. */}
      <Stage className="profile-shell relative z-10 -mt-24">
        <StageItem className="flex justify-center">
          <div className="rounded-full bg-white p-1.5 shadow-[var(--shadow-lift)]">
            {identity.avatarUrl ? (
              <Image
                src={identity.avatarUrl}
                alt={identity.displayName}
                width={124}
                height={124}
                priority
                sizes="124px"
                className="size-[124px] rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-[124px] items-center justify-center rounded-full text-3xl font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {initials(identity.displayName)}
              </div>
            )}
          </div>
        </StageItem>

        <StageItem as="header" className="mt-4 text-center">
          <ProfileName preview={preview} className="font-[family-name:var(--font-grotesk)] text-[1.6rem] font-extrabold italic leading-[1.05] tracking-[-0.03em]">
            {identity.displayName}
          </ProfileName>
          {identity.title && (
            <p className="mt-1.5 text-[0.8rem] font-semibold italic text-neutral-600">
              {identity.title}
            </p>
          )}
          {identity.company && (
            <p className="text-[0.8rem] font-semibold italic text-neutral-600">
              {identity.company}
            </p>
          )}
        </StageItem>

        {/* Le coeur du theme : une pilule par service, a ses couleurs. */}
        <ul className="mt-7 flex flex-col gap-3">
          {links.map((link) => (
            <StageItem key={link.id} as="li">
              <PillLink link={link} profileId={id} preview={preview} />
            </StageItem>
          ))}
        </ul>

        <StageItem className="mt-7">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
            className="bg-neutral-900 text-white"
          />
        </StageItem>

        <StageItem className="mt-6 flex justify-center">
          <InlineQr token={cardToken} profileId={id} preview={preview} />
        </StageItem>

        <ProfileFooter />
      </Stage>
    </main>
  );
}
