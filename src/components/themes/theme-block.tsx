import { ArrowUpRight, MapPin } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { blockDisplay } from "./premium/font-block";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * BLOCK - Bold · Graphic · Architectural.
 *
 * Le parti pris : une affiche construite. La photo est traitee en bichromie -
 * noir et blanc teinte par la couleur du bloc - et coupee net par un aplat de
 * cette meme couleur. Le nom, en capitales condensees, chevauche la frontiere
 * entre l image et l aplat : c est lui qui relie les deux moitiees.
 *
 * Tout est a angle droit. La force tient a la taille des lettres et a la
 * franchise des couleurs, pas a des effets.
 */
export function ThemeBlock({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "block");
  const { identity, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const photo = identity.avatarUrl ?? identity.coverUrl;

  return (
    <main
      style={m.style}
      className={cn(blockDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[480px]">
        {/* Photo bichrome */}
        <section className="relative h-[clamp(300px,46svh,420px)] overflow-hidden bg-[var(--pc-x-block)]">
          <div className="pc-settle absolute inset-0">
            <Portrait
              src={photo}
              alt={identity.displayName}
              sizes="(max-width: 480px) 100vw, 480px"
              position={m.photoPosition}
              className="size-full"
              imageClassName="grayscale contrast-[1.15] brightness-[0.95]"
              fallback={
                <div className="flex size-full items-end justify-end p-6 font-[family-name:var(--pc-display)] text-[180px] leading-[0.8] text-[var(--pc-x-blockInk)] opacity-25">
                  {m.name.initials}
                </div>
              }
            />
          </div>
          {/* La teinte : le noir et blanc prend la couleur du bloc. */}
          <div aria-hidden className="absolute inset-0 bg-[var(--pc-x-block)] mix-blend-multiply" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />

          <div className="absolute inset-x-5 top-[max(14px,env(safe-area-inset-top))] flex items-center justify-between text-[var(--pc-x-blockInk)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{m.region ?? ""}</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              className="size-10 bg-black/20 backdrop-blur-sm"
            />
          </div>
        </section>

        {/* L aplat et le nom qui chevauche la coupe */}
        <section className="relative bg-[var(--pc-x-block)] px-5 pb-6 text-[var(--pc-x-blockInk)]">
          <Name className="-mt-[0.62em] font-[family-name:var(--pc-display)] text-[clamp(58px,19vw,86px)] uppercase leading-[0.86] tracking-[-0.005em]">
            <span className="pc-rise block" style={{ "--d": "80ms" } as React.CSSProperties}>
              {m.name.first}
            </span>
            {m.name.last && (
              <span className="pc-rise block" style={{ "--d": "140ms" } as React.CSSProperties}>
                {m.name.last}
              </span>
            )}
          </Name>

          {m.role.length > 0 && (
            <p
              className="pc-rise mt-3 text-[13px] font-semibold uppercase tracking-[0.16em] opacity-90"
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              {m.role.join(" — ")}
            </p>
          )}

          <div className="pc-rise mt-5" style={{ "--d": "250ms" } as React.CSSProperties}>
            <SaveContact
              token={profile.cardToken}
              profileId={profile.id}
              name={identity.displayName}
              preview={preview}
              icon={null}
              trailing={<ArrowUpRight aria-hidden className="size-5" strokeWidth={2.2} />}
              className="h-[56px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-x-blockInk)] px-5 text-[15px] font-bold uppercase tracking-[0.08em] text-[var(--pc-x-block)]"
            />
          </div>

          {m.actions.length > 0 && (
            <nav
              aria-label="Contacter"
              className="pc-rise mt-2 grid gap-2"
              style={
                { "--d": "300ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties
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
                  className="flex h-[50px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-current/30 text-[12.5px] font-bold uppercase tracking-[0.08em]"
                >
                  <ActionIcon kind={a.kind} className="size-[15px]" strokeWidth={2.2} />
                  {a.label}
                </TrackedLink>
              ))}
            </nav>
          )}
        </section>

        <div className="px-5 pb-14 pt-10">
          {intro && (
            <p className="pc-inview text-[21px] font-medium leading-[1.3] tracking-[-0.015em]">{intro}</p>
          )}

          {m.destinations.length > 0 && (
            <ul className="mt-10 border-t-2 border-[var(--pc-ink)]">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group flex items-center justify-between gap-4 py-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-[family-name:var(--pc-display)] text-[30px] uppercase leading-none">
                        {link.label}
                      </span>
                      {link.detail && (
                        <span className="mt-1.5 block truncate text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-ink-2)]">
                          {link.detail}
                        </span>
                      )}
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center bg-[var(--pc-x-block)] text-[var(--pc-x-blockInk)] transition-transform duration-200 group-hover:-translate-y-0.5">
                      <ArrowUpRight aria-hidden className="size-5" strokeWidth={2.2} />
                    </span>
                  </TrackedLink>
                </li>
              ))}
            </ul>
          )}

          {m.social.length > 0 && (
            <ul className="pc-inview mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {m.social.map((link) => (
                <li key={link.id}>
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id}
                    preview={preview}
                    external={link.external}
                    className="inline-flex items-center gap-2 py-1 font-[family-name:var(--pc-display)] text-[22px] uppercase"
                  >
                    <BrandIcon name={link.icon ?? link.type} className="size-[17px]" />
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
              className="pc-inview mt-10 flex items-start gap-3 border-t-2 border-[var(--pc-ink)] pt-4"
            >
              <MapPin aria-hidden className="mt-1 size-[18px] shrink-0" strokeWidth={2.2} />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold">{m.place}</span>
                {location.country && <span className="block text-[14px] text-[var(--pc-ink-2)]">{location.country}</span>}
              </span>
              <span className="pt-1 text-[12px] font-bold uppercase tracking-[0.12em]">Itinéraire</span>
            </TrackedLink>
          )}

          <footer className="mt-12 flex items-center justify-between border-t border-[var(--pc-line)] pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--pc-ink-2)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="h-10 bg-[var(--pc-ink)] px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--pc-bg)]"
            />
          </footer>
        </div>
      </div>
    </main>
  );
}
