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
 * 10 - Carbone
 * Metal brosse, gravure, filets d un cheveu. Cible : marques premium, cartes
 * metal, horlogerie, immobilier de prestige, conseil haut de gamme.
 *
 * Le theme prolonge litteralement l objet : la carte NFC premium se vend en
 * metal, la page en reprend la matiere - trame brossee, texte grave (une ombre
 * claire sous le texte plutot qu au-dessus), et le numero de carte marque au
 * dos comme un numero de serie. Le token cesse d etre une donnee technique
 * pour devenir la preuve que l objet est authentique.
 */
export function ThemeCarbone({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0c0c0d] text-[#e9e7e2]">
      {/* Trame brossee : lignes fines a 100 %, invisibles une a une. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(96deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[45vh]"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, rgba(255,255,255,0.09) 0%, transparent 70%)",
        }}
      />

      <Stage className="profile-shell relative pb-2 pt-16">
        <StageItem as="header">
          <ProfileHeader
            preview={preview}
            profile={profile}
            avatarSize={96}
            align="start"
            rounded="card"
            family="grotesk"
            // Texte grave : la lumiere vient du haut, l ombre tombe en dessous.
            // Cible h1 ET p : en apercu le nom n est plus un titre de niveau 1.
            className="[&_h1]:[text-shadow:0_1px_0_rgba(255,255,255,0.14),0_-1px_0_rgba(0,0,0,0.6)] [&_p:first-of-type]:[text-shadow:0_1px_0_rgba(255,255,255,0.14),0_-1px_0_rgba(0,0,0,0.6)]"
          />
        </StageItem>

        <StageItem>
          <div
            className="my-7 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            }}
            aria-hidden
          />
        </StageItem>

        {identity.bio && (
          <StageItem>
            <p className="text-[length:var(--text-body)] leading-[1.65] text-white/55">
              {identity.bio}
            </p>
          </StageItem>
        )}

        <StageItem className="mt-7">
          <SaveContactButton
            token={cardToken}
            profileId={id}
            name={identity.displayName}
            preview={preview}
          />
        </StageItem>

        <StageItem>
          <QuickActions profile={profile} tone="ink" preview={preview} className="mt-7" />
        </StageItem>

        <div className="mt-8">
          <LinkList links={links} profileId={id} variant="glass" preview={preview} />
        </div>

        {/* Numero de serie : la marque au dos de l objet. */}
        <StageItem>
          <p className="mt-9 text-center font-[family-name:var(--font-mono)] text-[length:var(--text-micro)] uppercase tracking-[0.3em] text-white/22">
            Carte no {cardToken}
          </p>
        </StageItem>

        <ProfileFooter compact />
      </Stage>
    </main>
  );
}
