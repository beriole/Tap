import Image from "next/image";
import {
  LinkList,
  ProfileFooter,
  ProfileHeader,
  QuickActions,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { LinkButton } from "@/components/profile/link-button";
import { nonWorkLinks, workLinks } from "@/lib/link-groups";
import type { ThemeProps } from "@/types/profile";

/**
 * 04 - Tech
 * Sombre, une ligne lumineuse en haut, etiquettes en mono. Cible :
 * developpeurs, startups.
 *
 * Le theme est le seul a hierarchiser les liens : "Travaux" avant "Liens".
 * Pour ce public, le depot et le portfolio sont l argument, pas le reseau
 * social - la structure de la page dit donc quelque chose de vrai sur le metier.
 */
export function ThemeTech({ profile, preview }: ThemeProps) {
  const { identity, links, id, cardToken } = profile;
  // Le travail se montre avant le reseau : c est l argument de ce public.
  const featured = workLinks(links);
  const others = nonWorkLinks(links);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#05060a] text-[#e6e8ee]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-45"
        style={{
          background: "radial-gradient(60% 100% at 50% 0%, var(--accent) 0%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
      />

      <Stage className="profile-shell relative pb-2 pt-14">
        {identity.logoUrl && (
          <StageItem className="flex justify-center">
            <Image src={identity.logoUrl} alt="" width={40} height={40} className="mb-6 opacity-80" />
          </StageItem>
        )}

        <StageItem as="header">
          <ProfileHeader
            preview={preview}
            profile={profile}
            avatarSize={96}
            align="center"
            rounded="card"
            family="grotesk"
          />
        </StageItem>

        {identity.bio && (
          <StageItem>
            <p className="mt-5 text-center font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] leading-[1.7] text-white/50">
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

        {featured.length > 0 && (
          <section className="mt-9">
            <SectionLabel>Travaux</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {featured.map((link) => (
                <StageItem key={link.id}>
                  <LinkButton
                    link={link}
                    profileId={id}
                    variant="glass"
                    preview={preview}
                    className="border-white/10 bg-white/[0.04]"
                  />
                </StageItem>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Liens</SectionLabel>
            <LinkList links={others} profileId={id} variant="glass" preview={preview} />
          </section>
        )}

        <ProfileFooter />
      </Stage>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-[family-name:var(--font-mono)] text-[length:var(--text-micro)] uppercase tracking-[0.28em] text-white/30">
      {children}
    </h2>
  );
}
