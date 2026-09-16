import { ArrowUpRight, Clock, MapPin, Navigation, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { tableDisplay } from "./premium/font-table";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * TABLE - Hospitality · Warm · Inviting.
 *
 * Le parti pris : une devanture. La photo du lieu en banniere, l enseigne
 * posee a cheval sur elle, puis ce qu un client cherche en premier - est-ce
 * ouvert, ou est-ce, comment reserver. L itineraire est a cote du bouton
 * principal, pas en bas de page : pour un lieu, venir compte autant que
 * garder le contact.
 *
 * La destination principale - reservation, menu, boutique - devient un grand
 * bandeau colore, le seul de la page.
 */
export function ThemeTable({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "table");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const banner = identity.coverUrl ?? identity.avatarUrl;
  const badge = identity.logoUrl ?? (identity.coverUrl ? identity.avatarUrl : null);
  const rest = m.destinations.filter((d) => d.id !== m.featured?.id);

  return (
    <main
      style={m.style}
      className={cn(tableDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] pb-14">
        {/* Banniere */}
        <section className="relative px-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="pc-fade relative h-[230px] overflow-hidden rounded-[28px] bg-[var(--pc-surface)]">
            <div className="pc-settle absolute inset-0">
              <Portrait
                src={banner}
                alt=""
                sizes="(max-width: 460px) 96vw, 440px"
                position={identity.coverUrl ? "50% 50%" : m.photoPosition}
                className="size-full"
                fallback={
                  <div
                    className="size-full"
                    style={{ background: "radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, var(--pc-accent) 55%, transparent), var(--pc-surface) 70%)" }}
                  />
                }
              />
            </div>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/15" />
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              className="absolute right-3 top-3 size-10 rounded-full bg-black/25 text-white backdrop-blur-md"
            />
          </div>

          {/* Enseigne a cheval sur la banniere */}
          <div
            className="pc-lift absolute -bottom-10 left-7 size-[84px] overflow-hidden rounded-[24px] bg-[var(--pc-bg)] p-1.5 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.5)]"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            <div className="relative size-full overflow-hidden rounded-[19px] bg-[var(--pc-surface)]">
              <Portrait
                src={badge}
                alt=""
                sizes="72px"
                position="50% 50%"
                className="size-full"
                imageClassName={identity.logoUrl ? "object-contain p-1.5" : undefined}
                fallback={
                  <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[28px] text-[var(--pc-accent)]">
                    {m.name.initials}
                  </div>
                }
              />
            </div>
          </div>
        </section>

        <div className="px-6 pt-14">
          <Name
            className="pc-rise font-[family-name:var(--pc-display)] text-[clamp(32px,9.5vw,40px)] font-normal leading-[1.02] tracking-[-0.015em]"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            {identity.company && identity.company !== identity.displayName ? identity.company : m.name.full}
          </Name>
          <p className="pc-rise mt-2 text-[15px] leading-snug text-[var(--pc-ink-2)]" style={{ "--d": "210ms" } as React.CSSProperties}>
            {identity.company && identity.company !== identity.displayName
              ? [m.name.full, identity.title].filter(Boolean).join(" · ")
              : identity.title}
          </p>

          <div className="pc-rise mt-4 flex flex-wrap gap-2" style={{ "--d": "250ms" } as React.CSSProperties}>
            {m.availability && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[12.5px]">
                <Clock aria-hidden className="size-3.5 text-[var(--pc-accent)]" />
                {m.availability}
              </span>
            )}
            {m.region && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[12.5px]">
                <MapPin aria-hidden className="size-3.5 text-[var(--pc-accent)]" />
                {m.region}
              </span>
            )}
          </div>

          {/* Garder le contact, ou venir : les deux gestes cote a cote. */}
          <div className="pc-rise mt-6 flex gap-2" style={{ "--d": "300ms" } as React.CSSProperties}>
            <SaveContact
              token={profile.cardToken}
              profileId={profile.id}
              name={identity.displayName}
              preview={preview}
              icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
              className="h-[54px] flex-1 rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold text-[var(--pc-cta-ink)]"
            />
            {m.mapHref && (
              <TrackedLink
                href={m.mapHref}
                profileId={profile.id}
                action="DIRECTIONS"
                preview={preview}
                external
                ariaLabel="Itinéraire"
                className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[var(--pc-radius)] bg-[var(--pc-surface)]"
              >
                <Navigation aria-hidden className="size-[19px]" strokeWidth={2} />
              </TrackedLink>
            )}
          </div>

          {m.actions.length > 0 && (
            <nav
              aria-label="Contacter"
              className="pc-rise mt-2 grid gap-2"
              style={
                { "--d": "340ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
              }
            >
              {m.actions.map((a) => (
                <TrackedLink
                  key={a.kind}
                  href={a.href}
                  profileId={profile.id}
                  action={a.action}
                  linkId={a.linkId}
                  preview={preview}
                  external={a.external}
                  className="flex h-[48px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-[var(--pc-line)] text-[13.5px] font-medium"
                >
                  <ActionIcon kind={a.kind} className="size-[16px]" />
                  {a.label}
                </TrackedLink>
              ))}
            </nav>
          )}

          {m.featured && (
            <TrackedLink
              href={m.featured.href}
              profileId={profile.id}
              action="LINK"
              linkId={m.featured.id.startsWith("profile-") ? null : m.featured.id}
              preview={preview}
              external={m.featured.external}
              className="pc-inview group mt-8 flex items-center justify-between gap-4 rounded-[22px] bg-[var(--pc-accent)] px-5 py-5 text-[var(--pc-bg)]"
            >
              <span className="min-w-0">
                <span className="block text-[12px] font-medium uppercase tracking-[0.14em] opacity-80">{m.featured.kind}</span>
                <span className="mt-1 block truncate font-[family-name:var(--pc-display)] text-[25px] leading-tight">
                  {m.featured.label}
                </span>
              </span>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--pc-bg)] text-[var(--pc-accent)] transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight aria-hidden className="size-5" />
              </span>
            </TrackedLink>
          )}

          {intro && (
            <section className="pc-inview mt-10">
              <h2 className="font-[family-name:var(--pc-display)] text-[24px] italic">Notre histoire</h2>
              <p className="mt-2 text-[15.5px] leading-[1.65] text-[var(--pc-ink-2)]">{intro}</p>
            </section>
          )}

          {rest.length > 0 && (
            <ul className="mt-8 grid grid-cols-2 gap-2">
              {rest.map((link) => (
                <li key={link.id} className="pc-inview">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="flex h-full flex-col gap-3 rounded-[20px] bg-[var(--pc-surface)] p-4"
                  >
                    <BrandIcon name={link.icon ?? link.type} className="size-[19px] text-[var(--pc-accent)]" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 block font-[family-name:var(--pc-display)] text-[18px] leading-tight">{link.label}</span>
                      {link.detail && <span className="mt-0.5 block truncate text-[12.5px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                    </span>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          )}

          {m.social.length > 0 && (
            <ul className="pc-inview mt-8 flex flex-wrap gap-2">
              {m.social.map((link) => (
                <li key={link.id}>
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--pc-line)] px-4 text-[13.5px]"
                  >
                    <BrandIcon name={link.icon ?? link.type} className="size-[16px]" />
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>
          )}

          {m.place && m.mapHref && (
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="pc-inview mt-10 block border-t border-[var(--pc-line)] pt-6"
            >
              <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--pc-ink-2)]">Nous trouver</span>
              <span className="mt-2 block font-[family-name:var(--pc-display)] text-[24px] leading-tight">{m.place}</span>
              {location.country && <span className="block text-[14px] text-[var(--pc-ink-2)]">{location.country}</span>}
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--pc-accent)]">
                Itinéraire
                <ArrowUpRight aria-hidden className="size-4" />
              </span>
            </TrackedLink>
          )}

          <footer className="mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-4">
            <span className="text-[12px] text-[var(--pc-ink-3)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="h-10 rounded-full bg-[var(--pc-surface)] px-4 text-[13.5px] font-medium"
            />
          </footer>
        </div>
      </div>
    </main>
  );
}
