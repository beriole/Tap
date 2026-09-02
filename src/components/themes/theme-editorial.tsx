import Image from "next/image";
import {
  ContactRows,
  ProfileFooter,
  SaveContactButton,
  SocialRail,
  Stage,
  StageItem,
} from "@/components/profile";
import { LinkList } from "@/components/profile";
import { nonSocialLinks } from "@/lib/link-groups";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 12 - Editorial
 * Blanc, photo en carre arrondi, rail vertical de reseaux avec le pseudo ecrit
 * dans la tranche, nom en grandes capitales interlettrees, coordonnees en
 * tableau, deux boutons rectangulaires.
 * Cible : immobilier, courtage, professions ou l on inspire confiance.
 *
 * Aucune couleur en dehors du noir et du blanc : le seul contraste vient de la
 * graisse typographique. C est ce qui distingue ce theme des autres - il n a
 * pas d accent du tout, meme quand le client en choisit un.
 */
export function ThemeEditorial({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;
  const others = nonSocialLinks(links);
  const handle = identity.company ? `@${identity.company.toLowerCase().replace(/\s+/g, "")}` : null;

  return (
    <main className="min-h-dvh bg-white pb-2 text-neutral-950">
      <Stage className="profile-shell pt-10">
        <StageItem className="flex gap-3">
          {identity.avatarUrl ? (
            <Image
              src={identity.avatarUrl}
              alt={identity.displayName}
              width={420}
              height={420}
              priority
              sizes="(max-width: 480px) 80vw, 20rem"
              className="aspect-square min-w-0 flex-1 rounded-[1.25rem] bg-neutral-100 object-cover"
            />
          ) : (
            <div className="aspect-square flex-1 rounded-[1.25rem] bg-neutral-100" />
          )}

          <SocialRail
            links={links}
            profileId={id}
            handle={handle}
            preview={preview}
            className="shrink-0 pt-1"
          />
        </StageItem>

        {/* Le nom en deux graisses : patronyme leger, prenom lourd. */}
        <StageItem as="header" className="mt-6">
          <ProfileName preview={preview} className="leading-[0.95]">
            <span className="block text-[1.9rem] font-extrabold uppercase tracking-[-0.01em]">
              {identity.firstName ?? identity.displayName}
            </span>
            {identity.lastName && (
              <span className="mt-1 block text-[1.55rem] font-light uppercase tracking-[0.22em]">
                {identity.lastName}
              </span>
            )}
          </ProfileName>
          {identity.title && (
            <p className="mt-3 text-[0.78rem] uppercase tracking-[0.2em] text-neutral-500">
              {identity.title}
            </p>
          )}
          <div className="mt-4 h-[2px] w-12 bg-neutral-950" aria-hidden />
        </StageItem>

        <StageItem>
          <ContactRows profile={profile} layout="table" preview={preview} className="mt-6" />
        </StageItem>

        <StageItem className="mt-6">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
            className="rounded-none bg-neutral-950 text-white"
          />
        </StageItem>

        {others.length > 0 && (
          <div className="mt-3">
            <LinkList
              links={others}
              profileId={id}
              variant="outline"
              preview={preview}
            />
          </div>
        )}

        <ProfileFooter />
      </Stage>
    </main>
  );
}
