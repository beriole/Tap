import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { obsidianDisplay } from "./premium/font-obsidian";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * INSTANT - Playful · Personal · Warm.
 *
 * Le parti pris : une presentation qui ressemble a une rencontre, pas a un
 * CV. Le portrait est un tirage instantane - large marge blanche en pied,
 * legende en serif italique comme ecrite a la main - pose legerement de
 * travers sur un second tirage. L inclinaison est fixe : c est une
 * composition, pas une animation.
 *
 * Le reste de la page reste net et lisible : la fantaisie est dans l objet,
 * jamais dans l information.
 */
export function ThemeInstant({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "instant");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const caption = [m.name.first, location.city].filter(Boolean).join(", ");

  return (
    <main
      style={m.style}
      className={cn(obsidianDisplay.variable, "relative min-h-dvh overflow-hidden bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="grain opacity-[0.07]" aria-hidden />

      <div className="relative mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          {m.availability ? (
            <span className="inline-flex max-w-[75%] items-center gap-2 text-[12.5px] text-[var(--pc-ink-2)]">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--pc-accent)]" />
              <span className="truncate">{m.availability}</span>
            </span>
          ) : (
            <span />
          )}
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Deux tirages superposes */}
        <section className="relative mx-auto mt-4 w-[80%] max-w-[300px]">
          <div
            aria-hidden
            className="pc-fade absolute inset-0 rotate-[5deg] rounded-[6px] bg-[var(--pc-surface)] opacity-70 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)]"
            style={{ "--d": "60ms" } as React.CSSProperties}
          />
          <figure
            className="pc-lift relative -rotate-[2.5deg] rounded-[6px] bg-[var(--pc-surface)] p-3 pb-0 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_22px_40px_-22px_rgba(0,0,0,0.55)]"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            <div className="relative aspect-square overflow-hidden rounded-[2px] bg-[#e7e2d9]">
              <Portrait
                src={identity.avatarUrl ?? identity.coverUrl}
                alt={identity.displayName}
                sizes="(max-width: 440px) 72vw, 280px"
                position={m.photoPosition}
                className="size-full"
                imageClassName="saturate-[1.05]"
                fallback={
                  <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[84px] italic text-[#8a8278]">
                    {m.name.initials}
                  </div>
                }
              />
            </div>
            <figcaption className="flex h-[58px] items-center justify-center font-[family-name:var(--pc-display)] text-[23px] italic text-[#2a2622]">
              {caption}
            </figcaption>
          </figure>
        </section>

        <section className="mt-8 text-center">
          <Name
            className="pc-rise text-[clamp(28px,8.4vw,34px)] font-bold leading-[1.05] tracking-[-0.035em]"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            {m.name.full}
          </Name>
          {m.role.length > 0 && (
            <p className="pc-rise mt-1.5 text-[15.5px] text-[var(--pc-ink-2)]" style={{ "--d": "260ms" } as React.CSSProperties}>
              {m.role.join(" · ")}
            </p>
          )}
        </section>

        <div className="pc-rise mt-6" style={{ "--d": "300ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2.5 flex justify-center gap-2"
            style={{ "--d": "340ms" } as React.CSSProperties}
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
                className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-full border border-[var(--pc-line)] text-[13.5px] font-medium"
              >
                <ActionIcon kind={a.kind} className="size-[16px] text-[var(--pc-accent)]" />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <p className="pc-inview mt-10 text-center font-[family-name:var(--pc-display)] text-[21px] italic leading-[1.4]">
            {intro}
          </p>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-9 flex flex-wrap justify-center gap-2">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--pc-press)] px-3.5 text-[13.5px] font-medium"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[16px]" />
                  {link.hint ?? link.label}
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.destinations.length > 0 && (
          <ul className="mt-9 space-y-3">
            {m.destinations.map((link, i) => (
              <li key={link.id} className="pc-inview">
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id.startsWith("profile-") ? null : link.id}
                  preview={preview}
                  external={link.external}
                  className={cn(
                    "group flex items-center gap-4 rounded-[6px] bg-[var(--pc-surface)] px-4 py-3.5 text-[#1e1b18] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_24px_-18px_rgba(0,0,0,0.45)]",
                    // Une bande de couleur a gauche, comme un ruban adhesif - une sur deux seulement.
                    i % 2 === 0 ? "border-l-[3px] border-[var(--pc-accent)]" : "border-l-[3px] border-transparent",
                  )}
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[18px] shrink-0 text-[#5b554e]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{link.label}</span>
                    {link.detail && <span className="block truncate text-[12.5px] text-[#6b645c]">{link.detail}</span>}
                  </span>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[#9a9289] transition-transform group-hover:translate-x-0.5" />
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
            className="pc-inview mx-auto mt-10 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[14px]"
          >
            <MapPin aria-hidden className="size-4 text-[var(--pc-accent)]" />
            {m.place}
            <span className="font-semibold underline underline-offset-4">Itinéraire</span>
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
            className="h-11 rounded-full border border-[var(--pc-line)] px-5 text-[14px] font-medium"
          />
          <p className="font-[family-name:var(--pc-display)] text-[15px] italic text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}
