import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { NfcWaves } from "@/components/brand/logo";
import { Portrait, SaveContact, ShareControl, TiltCard, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { carteDisplay } from "./premium/font-carte";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * CARTE - Tangible · Signature · Modern.
 *
 * Le parti pris : prolonger l objet qu on vient de tenir. La page s ouvre sur
 * la carte physique elle-meme, a ses proportions reelles (85,6 x 54 mm),
 * gravee du nom, de la fonction et du logo, marquee du symbole sans contact.
 * Elle s incline sous le doigt, comme on retourne une carte pour la regarder.
 *
 * Sous elle, la page est volontairement sobre : une presentation, le bouton
 * principal, et une commande segmentee pour appeler, ecrire ou envoyer un
 * message. La carte est l evenement ; le reste s efface.
 */
export function ThemeCarte({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "carte");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;

  return (
    <main
      style={m.style}
      className={cn(carteDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[440px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="font-[family-name:var(--pc-display)] text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-ink-2)]">
            Carte de visite
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* La carte physique */}
        <div className="pc-lift mt-4" style={{ "--d": "40ms" } as React.CSSProperties}>
          <TiltCard className="aspect-[1.586] w-full rounded-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_24px_48px_-20px_rgba(0,0,0,0.45)]">
            <div
              className="relative size-full overflow-hidden rounded-[18px] p-5 text-[var(--pc-x-cardInk)]"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--pc-x-card) 100%, white 6%), var(--pc-x-card) 55%, color-mix(in srgb, var(--pc-x-card) 100%, black 8%))",
              }}
            >
              {/* Filet interieur : la tranche de la carte accroche la lumiere. */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
              <div className="flex items-start justify-between">
                <div className="relative size-11 overflow-hidden rounded-[11px] bg-white/10">
                  <Portrait
                    src={identity.logoUrl ?? identity.avatarUrl}
                    alt=""
                    sizes="44px"
                    position={identity.logoUrl ? "50% 50%" : m.photoPosition}
                    className="size-full"
                    imageClassName={identity.logoUrl ? "object-contain p-1" : undefined}
                    fallback={
                      <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[15px] font-semibold">
                        {m.name.initials}
                      </div>
                    }
                  />
                </div>
                <NfcWaves className="h-6 w-6 text-[var(--pc-x-cardInk2)]" />
              </div>
              <div className="absolute bottom-5 left-5 right-[64px]">
                <Name className="truncate font-[family-name:var(--pc-display)] text-[clamp(21px,6.2vw,25px)] font-semibold leading-tight tracking-[-0.025em]">
                  {m.name.full}
                </Name>
                <p className="mt-1 truncate text-[12.5px] text-[var(--pc-x-cardInk2)]">
                  {m.role.join(" · ")}
                </p>
              </div>
              <span
                aria-hidden
                className="absolute bottom-5 right-5 h-[22px] w-[30px] rounded-[5px] border border-[var(--pc-accent)]/60"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--pc-accent) 70%, transparent), color-mix(in srgb, var(--pc-accent) 30%, transparent))",
                }}
              />
            </div>
          </TiltCard>
        </div>

        {/* Portrait et presentation, sous la carte */}
        <section className="mt-7 flex items-start gap-4">
          {identity.avatarUrl && identity.logoUrl && (
            <div className="pc-unveil relative size-[60px] shrink-0 overflow-hidden rounded-[16px]">
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="60px"
                position={m.photoPosition}
                className="size-full bg-[var(--pc-surface)]"
                fallback={null}
              />
            </div>
          )}
          {intro && (
            <p
              className="pc-rise line-clamp-4 text-[15px] leading-[1.6] text-[var(--pc-ink-2)]"
              style={{ "--d": "180ms" } as React.CSSProperties}
            >
              {intro}
            </p>
          )}
        </section>

        <div className="pc-rise mt-6" style={{ "--d": "240ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-2.5 grid overflow-hidden rounded-[var(--pc-radius)] bg-[var(--pc-surface)]"
            style={
              { "--d": "290ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
            }
          >
            {m.actions.map((a, i) => (
              <TrackedLink
                key={a.kind}
                href={a.href}
                profileId={profile.id}
                action={a.action}
                linkId={a.linkId}
                preview={preview}
                external={a.external}
                className={cn(
                  "flex h-[52px] items-center justify-center gap-2 text-[13.5px] font-medium",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
              >
                <ActionIcon kind={a.kind} className="size-[16px]" />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-10">
            <h2 className="font-[family-name:var(--pc-display)] text-[13px] font-medium text-[var(--pc-ink-2)]">Liens</h2>
            <ul className="mt-3">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)] last:border-b-0">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group -mx-2 flex items-center gap-3.5 rounded-[12px] px-2 py-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-[var(--pc-surface)]">
                      <BrandIcon name={link.icon ?? link.type} className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{link.label}</span>
                      {link.detail && <span className="block truncate text-[13px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)] transition-transform group-hover:translate-x-0.5" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
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
                  ariaLabel={link.label}
                  className="flex size-11 items-center justify-center rounded-full bg-[var(--pc-surface)]"
                >
                  <BrandIcon name={link.icon ?? link.type} className="size-[19px]" />
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
            className="pc-inview mt-8 flex items-center gap-3 border-t border-[var(--pc-line)] pt-5"
          >
            <MapPin aria-hidden className="size-[18px] shrink-0 text-[var(--pc-ink-2)]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px]">{m.place}</span>
              {location.country && <span className="block text-[13px] text-[var(--pc-ink-2)]">{location.country}</span>}
            </span>
            <span className="text-[13px] font-medium">Itinéraire</span>
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
            className="h-11 rounded-full bg-[var(--pc-surface)] px-5 text-[14px] font-medium"
          />
          <p className="text-[12px] text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}
