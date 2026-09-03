import Image from "next/image";
import {
  Ambience,
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
 * 02 - Executive
 * Bleu nuit profond, filet metallique, portrait cadre, coordonnees tenues au
 * cordeau. Cible : dirigeants, managers, avocats.
 *
 * Le parti pris : les coordonnees sont presentees comme un en-tete de courrier
 * officiel - etiquette a gauche, valeur alignee a droite, filet entre chaque
 * ligne. C est ce que ce public lit tous les jours.
 */
export function ThemeExecutive({ profile, preview }: ThemeProps) {
  const { identity, contact, location, presentation, links, id, cardToken } = profile;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080b14] text-[#eef0f6]">
      {/* Bandeau de couverture : present, mais tenu court et fondu au noir -
          ce public veut une carte, pas une banniere. */}
      {identity.coverUrl && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-56 overflow-hidden">
          <Image
            src={identity.coverUrl}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080b14]/60 to-[#080b14]" />
        </div>
      )}
      <Ambience from="var(--accent)" to="#1b2a4a" className="opacity-45" />

      <Stage className="profile-shell relative pb-2 pt-14">
        <StageItem as="header">
          <ProfileHeader
            preview={preview}
            profile={profile}
            avatarSize={128}
            align="center"
            rounded="card"
            ringed
            family="display"
          />
        </StageItem>

        {identity.bio && (
          <StageItem>
            <p className="mt-6 text-center text-[length:var(--text-body)] leading-[1.65] text-white/60">
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
          <dl className="mt-8 divide-y divide-white/8 border-y border-white/8 text-[length:var(--text-caption)]">
            <Row label="Telephone" value={contact.phone} />
            <Row label="E-mail" value={contact.email} />
            <Row
              label="Bureau"
              value={[location.address, location.city].filter(Boolean).join(", ")}
            />
          </dl>
        </StageItem>

        <StageItem>
          <QuickActions profile={profile} tone="ink" preview={preview} className="mt-8" />
        </StageItem>

        {presentation.ctaUrl && presentation.ctaLabel && (
          <StageItem>
            <a
              href={presentation.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mt-8 justify-center rounded-[var(--radius-button)] border border-[var(--accent)] px-6 text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-[var(--accent)]"
            >
              {presentation.ctaLabel}
            </a>
          </StageItem>
        )}

        <div className="mt-8">
          <LinkList links={links} profileId={id} variant="glass" preview={preview} />
        </div>

        <ProfileFooter />
      </Stage>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-6 py-3.5">
      <dt className="shrink-0 text-[length:var(--text-micro)] uppercase tracking-[0.2em] text-white/35">
        {label}
      </dt>
      <dd className="truncate text-right text-white/85">{value}</dd>
    </div>
  );
}
