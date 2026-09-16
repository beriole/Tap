import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { buildCardModel } from "./premium/model";
import type { ThemeProps } from "@/types/profile";

/**
 * SERENE - Soft · Calm · Warm.
 *
 * Le parti pris : une page qui accueille avant de presenter. Le portrait est
 * pose dans une arche - la forme d une fenetre, pas celle d un avatar. Le nom
 * est compose dans une serif aux terminaisons adoucies, le nom de famille en
 * italique. Deux halos de couleur, fixes, rechauffent le fond ; rien ne
 * bouge, rien ne clignote.
 *
 * C est le seul design ou tout s arrondit : ici, la douceur est le message.
 *
 * Police : la serif Fraunces deja chargee par la plateforme, avec ses axes
 * SOFT et WONK. Aucun octet de police supplementaire au scan.
 */
export function ThemeSerene({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "serene");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const soft = { fontVariationSettings: '"SOFT" 100, "WONK" 0' } as React.CSSProperties;

  return (
    <main style={m.style} className="relative min-h-dvh overflow-hidden bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased">
      {/* Deux halos immobiles : la chaleur vient de la couleur, pas du mouvement. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[380px] rounded-full opacity-45 blur-3xl"
        style={{ background: "var(--pc-accent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-[320px] size-[340px] rounded-full opacity-25 blur-3xl"
        style={{ background: "color-mix(in srgb, var(--pc-accent) 60%, white)" }}
      />

      <div className="relative mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-end" style={{ "--d": "0ms" } as React.CSSProperties}>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="size-10 rounded-full bg-white/50 text-[var(--pc-ink-2)] backdrop-blur-sm"
          />
        </header>

        <section className="flex flex-col items-center text-center">
          {/* L arche */}
          <div className="pc-lift relative h-[228px] w-[176px]" style={{ "--d": "40ms" } as React.CSSProperties}>
            <div className="absolute inset-0 overflow-hidden rounded-b-[26px] rounded-t-full bg-[var(--pc-surface)] shadow-[0_24px_50px_-26px_rgba(58,46,42,0.45)]">
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="176px"
                position={m.photoPosition}
                className="size-full"
                fallback={
                  <div
                    className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-[54px] italic text-[var(--pc-ink-2)]"
                    style={soft}
                  >
                    {m.name.initials}
                  </div>
                }
              />
            </div>
            <span aria-hidden className="pointer-events-none absolute -inset-[7px] rounded-b-[32px] rounded-t-full border border-[var(--pc-line)]" />
          </div>

          <Name
            className="pc-rise mt-7 font-[family-name:var(--font-display)] text-[clamp(34px,10vw,40px)] font-normal leading-[1.02] tracking-[-0.02em]"
            style={{ ...soft, "--d": "160ms" } as React.CSSProperties}
          >
            {m.name.first} {m.name.last && <em className="italic">{m.name.last}</em>}
          </Name>
          {m.role.length > 0 && (
            <p className="pc-rise mt-2.5 text-[15.5px] leading-snug text-[var(--pc-ink-2)]" style={{ "--d": "210ms" } as React.CSSProperties}>
              {m.role.join(" · ")}
            </p>
          )}
          {m.availability && (
            <p
              className="pc-rise mt-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-[13px] text-[var(--pc-ink-2)] backdrop-blur-sm"
              style={{ "--d": "250ms" } as React.CSSProperties}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--pc-accent)]" />
              {m.availability}
            </p>
          )}
        </section>

        <div className="pc-rise mt-7" style={{ "--d": "300ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={1.9} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-medium tracking-[0.005em] text-[var(--pc-cta-ink)] shadow-[0_14px_30px_-18px_var(--pc-cta)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-5 grid gap-2"
            style={
              { "--d": "350ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
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
                className="flex flex-col items-center gap-2 rounded-[22px] py-2"
              >
                <span className="flex size-[52px] items-center justify-center rounded-full bg-white/70 text-[var(--pc-ink)] shadow-[0_8px_20px_-14px_rgba(58,46,42,0.5)]">
                  <ActionIcon kind={a.kind} className="size-[19px]" strokeWidth={1.7} />
                </span>
                <span className="text-[12.5px] text-[var(--pc-ink-2)]">{a.label}</span>
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <p className="pc-inview mx-auto mt-10 max-w-[32ch] text-center text-[16px] leading-[1.7] text-[var(--pc-ink-2)]">
            {intro}
          </p>
        )}

        {m.destinations.length > 0 && (
          <ul className="mt-10 space-y-2.5">
            {m.destinations.map((link) => (
              <li key={link.id} className="pc-inview">
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id.startsWith("profile-") ? null : link.id}
                  preview={preview}
                  external={link.external}
                  className="group flex items-center gap-3.5 rounded-full bg-white/65 py-2.5 pl-2.5 pr-5 backdrop-blur-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--pc-bg)]">
                    <BrandIcon name={link.icon ?? link.type} className="size-[17px] text-[var(--pc-ink-2)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{link.label}</span>
                    {link.detail && <span className="block truncate text-[12.5px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                  </span>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)] transition-transform group-hover:translate-x-0.5" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-8 flex flex-wrap justify-center gap-2.5">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  ariaLabel={link.label}
                  className="flex size-11 items-center justify-center rounded-full bg-white/65 text-[var(--pc-ink)] backdrop-blur-sm"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[18px]" />
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
            className="pc-inview mx-auto mt-10 flex w-fit flex-col items-center rounded-[22px] px-5 py-2 text-center"
          >
            <MapPin aria-hidden className="size-[17px] text-[var(--pc-accent)]" />
            <span className="mt-2 text-[15px]">{m.place}</span>
            {location.country && <span className="text-[13px] text-[var(--pc-ink-2)]">{location.country}</span>}
            <span className="mt-2 text-[13px] font-medium underline underline-offset-4">Itinéraire</span>
          </TrackedLink>
        )}

        <footer className="mt-12 flex flex-col items-center gap-3">
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager ce profil"
            className="h-11 rounded-full bg-white/65 px-5 text-[14px] backdrop-blur-sm"
          />
          <p className="text-[12px] text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}
