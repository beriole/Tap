import Image from "next/image";
import { BadgeCheck, Mail, Phone, UserRoundPlus } from "lucide-react";
import {
  BrandTileGrid,
  ProfileFooter,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { LinkList } from "@/components/profile";
import { nonTileLinks, tileLinks } from "@/lib/link-groups";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 13 - Hub
 * Couverture, portrait rond en debord, badge de verification, trois actions
 * rondes, bouton noir pleine largeur, puis un panneau "Mes liens" en grille
 * d applications.
 * Cible : createurs, community managers, profils a nombreux reseaux.
 *
 * Le theme repond a un cas precis : quand il y a huit ou dix reseaux, une liste
 * verticale devient un mur. La grille de tuiles les rend parcourables d un coup
 * d oeil ; les liens qui ne sont pas des applications restent en liste dessous.
 */
export function ThemeHub({ profile, preview }: ThemeProps) {
  const { identity, contact, links, id, cardToken } = profile;
  const tiles = tileLinks(links);
  const rows = nonTileLinks(links);

  return (
    <main className="min-h-dvh bg-white pb-2 text-neutral-900">
      <div className="relative h-36 w-full overflow-hidden">
        {identity.coverUrl ? (
          <Image src={identity.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="size-full" style={{ background: "var(--accent)" }} />
        )}
      </div>

      {/* relative + z-10 : sans cela la couverture positionnee recouvre le
          portrait en debord. */}
      <Stage className="profile-shell relative z-10 -mt-12">
        <StageItem className="flex justify-center">
          <div className="rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
            {identity.avatarUrl ? (
              <Image
                src={identity.avatarUrl}
                alt={identity.displayName}
                width={96}
                height={96}
                priority
                sizes="96px"
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-24 items-center justify-center rounded-full text-2xl font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {initials(identity.displayName)}
              </div>
            )}
          </div>
        </StageItem>

        <StageItem as="header" className="mt-3 text-center">
          <ProfileName preview={preview} className="flex items-center justify-center gap-1.5 text-[1.15rem] font-semibold tracking-[-0.01em]">
            {identity.displayName}
            {/* Le badge marque un profil publie sur une carte active, pas une
                verification d identite : il rassure sans rien certifier. */}
            <BadgeCheck className="size-4 text-[var(--accent)]" aria-label="Profil actif" />
          </ProfileName>
          {identity.title && (
            <p className="mt-0.5 text-[0.75rem] text-neutral-500">{identity.title}</p>
          )}
        </StageItem>

        <StageItem className="mt-4 flex justify-center gap-3">
          {contact.phone && (
            <RoundAction href={`tel:${contact.phone}`} label="Appeler">
              <Phone className="size-[1.05rem]" />
            </RoundAction>
          )}
          {contact.email && (
            <RoundAction href={`mailto:${contact.email}`} label="E-mail">
              <Mail className="size-[1.05rem]" />
            </RoundAction>
          )}
          <RoundAction href={`/api/vcard/${cardToken}`} label="Enregistrer le contact">
            <UserRoundPlus className="size-[1.05rem]" />
          </RoundAction>
        </StageItem>

        <StageItem className="mt-4">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
            className="bg-neutral-900 text-white"
          />
        </StageItem>

        {tiles.length > 0 && (
          <StageItem className="mt-5 rounded-[1.5rem] bg-neutral-50 p-5">
            <h2 className="mb-4 text-center text-[0.78rem] font-medium text-neutral-500">
              Mes liens
            </h2>
            <BrandTileGrid links={tiles} profileId={id} preview={preview} />
          </StageItem>
        )}

        {rows.length > 0 && (
          <div className="mt-3">
            <LinkList links={rows} profileId={id} variant="outline" preview={preview} />
          </div>
        )}

        <ProfileFooter />
      </Stage>
    </main>
  );
}

function RoundAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-[var(--shadow-soft)] transition-colors hover:border-neutral-400"
    >
      {children}
    </a>
  );
}
