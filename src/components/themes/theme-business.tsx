import Image from "next/image";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  LinkList,
  ProfileFooter,
  QuickActions,
  SaveContactButton,
  Stage,
  StageItem,
} from "@/components/profile";
import { initials } from "@/lib/utils";
import { ProfileName } from "@/components/profile/profile-name";
import type { ThemeProps } from "@/types/profile";

/**
 * 06 - Business
 * L entreprise d abord, les coordonnees immediatement lisibles, les services
 * ensuite. Cible : PME, commerces, commerciaux.
 *
 * Seul theme ou le logo prime sur le portrait : c est la societe qu on retient,
 * pas la personne qui tend la carte. Les coordonnees sont des lignes
 * cliquables, pas du texte a recopier.
 */
export function ThemeBusiness({ profile, preview }: ThemeProps) {
  const { identity, contact, location, presentation, links, id, cardToken } = profile;
  const address = [location.address, location.city, location.country].filter(Boolean).join(", ");

  return (
    <main className="min-h-dvh bg-[var(--surface)]">
      <div
        aria-hidden
        className="h-28 w-full"
        style={{
          background:
            "linear-gradient(120deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #000))",
        }}
      />

      <Stage className="profile-shell -mt-16 pb-2">
        <StageItem as="section" className="rounded-[var(--radius-card)] bg-[var(--background)] p-5 shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-4">
            {identity.logoUrl ? (
              <Image
                src={identity.logoUrl}
                alt={identity.company ?? identity.displayName}
                width={64}
                height={64}
                priority
                sizes="64px"
                className="size-16 rounded-2xl object-contain"
              />
            ) : identity.avatarUrl ? (
              <Image
                src={identity.avatarUrl}
                alt={identity.displayName}
                width={64}
                height={64}
                priority
                sizes="64px"
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl text-[var(--accent-foreground)]">
                {initials(identity.company ?? identity.displayName)}
              </div>
            )}

            <div className="min-w-0">
              {identity.company && (
                <ProfileName preview={preview} className="truncate text-[length:var(--text-lead)] font-semibold leading-tight tracking-[-0.015em]">
                  {identity.company}
                </ProfileName>
              )}
              <p className="truncate text-[length:var(--text-caption)] text-[var(--muted)]">
                {identity.displayName}
                {identity.title ? ` · ${identity.title}` : ""}
              </p>
              {presentation.availability && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[length:var(--text-micro)] text-[var(--accent)]">
                  <span aria-hidden className="live-dot size-1.5 rounded-full bg-current" />
                  {presentation.availability}
                </p>
              )}
            </div>
          </div>

          {presentation.introText && (
            <p className="mt-4 text-[length:var(--text-body)] leading-[1.6] text-[var(--muted)]">
              {presentation.introText}
            </p>
          )}

          <div className="mt-5">
            <SaveContactButton
              token={cardToken}
              profileId={id}
              name={identity.displayName}
              preview={preview}
            />
          </div>
        </StageItem>

        <StageItem as="section" className="mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-card)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
          <Row icon={<Phone className="size-4" />} value={contact.phone} href={`tel:${contact.phone}`} />
          <Row icon={<Mail className="size-4" />} value={contact.email} href={`mailto:${contact.email}`} />
          <Row icon={<Globe className="size-4" />} value={contact.website} href={contact.website} />
          <Row icon={<MapPin className="size-4" />} value={address || null} href={location.mapUrl} />
        </StageItem>

        <StageItem>
          <QuickActions profile={profile} preview={preview} className="mt-5" />
        </StageItem>

        <section className="mt-6">
          <h2 className="mb-2 px-1 text-[length:var(--text-micro)] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
            Services et liens
          </h2>
          <LinkList links={links} profileId={id} variant="outline" preview={preview} />
        </section>

        <ProfileFooter />
      </Stage>
    </main>
  );
}

function Row({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value?: string | null;
  href?: string | null;
}) {
  if (!value) return null;
  const content = (
    <span className="tap-target px-4 text-[length:var(--text-body)]">
      <span className="text-[var(--accent)]">{icon}</span>
      <span className="truncate">{value}</span>
    </span>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="block transition-colors hover:bg-[var(--surface)]"
    >
      {content}
    </a>
  ) : (
    content
  );
}
