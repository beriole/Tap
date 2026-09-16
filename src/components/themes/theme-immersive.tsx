import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { immersiveDisplay } from "./premium/font-immersive";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * IMMERSIVE - Visual · Creative · Bold.
 *
 * Le parti pris : la photo EST la page. Elle occupe le premier ecran, le nom
 * se pose sur elle, et un panneau flottant garde le contact a portee de
 * pouce. En dessous, les liens deviennent des blocs visuels : tuiles de
 * reseaux, carte media pour la destination principale, mini-cartes pour le
 * reste.
 *
 * Lisibilite sur n importe quelle photo : un degrade bas assez dense pour un
 * texte blanc a 16 px, assez court pour ne pas eteindre l image. Le verre du
 * panneau reste leger - un flou, un voile, un filet - jamais un effet.
 *
 * Variantes : Glass (verre fume), Dark (panneau plein), Clean et Editorial
 * (panneau clair). La composition ne change pas, seule la matiere du panneau.
 */
export function ThemeImmersive({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "immersive");
  const { identity } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const photo = identity.avatarUrl ?? identity.coverUrl;
  const variant = m.variant.key;
  const lightPanel = variant === "clean" || variant === "editorial";

  // La couverture sert de fond a la carte media, si elle n est pas deja la
  // photo principale.
  const mediaImage = identity.avatarUrl && identity.coverUrl ? identity.coverUrl : null;
  const rest = m.destinations.filter((d) => d.id !== m.featured?.id);

  return (
    <main
      style={
        {
          ...m.style,
          "--pc-tile": "color-mix(in srgb, var(--pc-ink) 6%, transparent)",
        } as React.CSSProperties
      }
      className={cn(
        immersiveDisplay.variable,
        "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased",
      )}
    >
      <div className="mx-auto w-full max-w-[480px]">
        {/* ---------------------------------------------------------- Heros */}
        <section className="relative h-[min(94svh,880px)] min-h-[600px] overflow-hidden bg-[#111]">
          <div className="pc-settle absolute inset-0">
            <Portrait
              src={photo}
              alt={identity.displayName}
              sizes="(max-width: 480px) 100vw, 480px"
              position={m.photoPosition}
              className="size-full"
              fallback={<Poster initials={m.name.initials} />}
            />
          </div>

          {/* Degrade haut : lisibilite des pastilles. Degrade bas : du nom. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-32"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.38), transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 34%, rgba(0,0,0,0.12) 66%, transparent 100%)",
            }}
          />

          <div className="absolute inset-x-4 top-[max(16px,env(safe-area-inset-top))] flex items-center justify-between">
            {m.region ? (
              <span
                className="pc-fade inline-flex h-9 max-w-[70%] items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3.5 text-[12.5px] font-medium text-white backdrop-blur-md"
                style={{ "--d": "200ms" } as React.CSSProperties}
              >
                <MapPin aria-hidden className="size-[13px] shrink-0" strokeWidth={2} />
                <span className="truncate">{m.region}</span>
              </span>
            ) : (
              <span />
            )}
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              className="pc-fade size-9 rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md"
            />
          </div>

          {/* Identite posee sur la photo, au-dessus du panneau. */}
          <div
            className={cn(
              "absolute inset-x-6 text-white",
              m.actions.length > 0 ? "bottom-[178px]" : "bottom-[116px]",
            )}
          >
            {m.availability && (
              <p
                className="pc-rise mb-3 inline-flex items-center gap-2 text-[12.5px] font-medium text-white/85"
                style={{ "--d": "180ms" } as React.CSSProperties}
              >
                <span aria-hidden className="size-1.5 rounded-full bg-[#7EE3A6]" />
                <span className="line-clamp-1">{m.availability}</span>
              </p>
            )}
            <Name
              className="pc-rise font-[family-name:var(--pc-display)] text-[clamp(32px,9.4vw,40px)] font-bold leading-[0.98] tracking-[-0.04em] [text-wrap:balance]"
              style={{ "--d": "220ms" } as React.CSSProperties}
            >
              {m.name.full}
            </Name>
            {/* Fonction et entreprise sur deux lignes voulues : les joindre par
                un point les faisait casser n importe ou, "Studio" d un cote et
                "Mensah" de l autre. */}
            {identity.title && (
              <p
                className="pc-rise mt-2.5 text-[16px] leading-[1.35] text-white/85 [text-wrap:balance]"
                style={{ "--d": "270ms" } as React.CSSProperties}
              >
                {identity.title}
              </p>
            )}
            {identity.company && (
              <p
                className="pc-rise mt-1 text-[14px] font-medium tracking-[0.01em] text-white/60"
                style={{ "--d": "300ms" } as React.CSSProperties}
              >
                {identity.company}
              </p>
            )}
          </div>

          {/* Panneau flottant : le contact a portee de pouce. */}
          <div
            className={cn(
              "pc-lift absolute inset-x-3 bottom-3 rounded-[28px] p-2.5",
              variant === "glass" &&
                "border border-white/14 bg-[rgba(22,22,24,0.42)] backdrop-blur-2xl backdrop-saturate-150",
              variant === "dark" && "border border-white/8 bg-[#161618]",
              variant === "clean" && "bg-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)]",
              variant === "editorial" && "bg-[#EFEAE2] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.5)]",
            )}
            style={{ "--d": "300ms" } as React.CSSProperties}
          >
            <SaveContact
              token={profile.cardToken}
              profileId={profile.id}
              name={identity.displayName}
              preview={preview}
              icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
              className="h-[54px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
            />
            {m.actions.length > 0 && (
              <nav
                aria-label="Contacter"
                className="mt-2 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` }}
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
                    className={cn(
                      "flex h-[48px] items-center justify-center gap-2 rounded-[var(--pc-radius)] text-[13.5px] font-medium",
                      lightPanel
                        ? "bg-black/[0.05] text-[#141414]"
                        : "bg-white/[0.09] text-white",
                    )}
                  >
                    <ActionIcon kind={a.kind} className="size-[17px]" strokeWidth={1.9} />
                    {a.label}
                  </TrackedLink>
                ))}
              </nav>
            )}
          </div>
        </section>

        {/* ------------------------------------------------ Sous la photo */}
        <div className="px-5 pb-14 pt-9">
          {intro && (
            <p className="pc-inview text-[16px] leading-[1.6] text-[var(--pc-ink-2)]">{intro}</p>
          )}

          {m.social.length > 0 && (
            <section className={cn("pc-inview", intro && "mt-9")}>
              <Label>Réseaux</Label>
              <ul className="mt-3 grid grid-cols-4 gap-2.5">
                {m.social.map((link) => (
                  <li key={link.id}>
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id}
                      preview={preview}
                      external={link.external}
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[20px] bg-[var(--pc-tile)]"
                    >
                      <BrandIcon name={link.icon ?? link.type} className="size-[22px]" />
                      <span className="max-w-full truncate px-1 text-[11.5px] font-medium text-[var(--pc-ink-2)]">
                        {link.label}
                      </span>
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(m.featured || rest.length > 0 || (m.place && m.mapHref)) && (
            <section className="mt-9">
              <Label>À découvrir</Label>

              {m.featured && (
                <TrackedLink
                  href={m.featured.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={m.featured.id.startsWith("profile-") ? null : m.featured.id}
                  preview={preview}
                  external={m.featured.external}
                  className="pc-inview group mt-3 block overflow-hidden rounded-[24px]"
                >
                  <div className="relative h-[168px] bg-[var(--pc-tile)]">
                    {mediaImage ? (
                      <Portrait
                        src={mediaImage}
                        alt=""
                        sizes="(max-width: 480px) 92vw, 440px"
                        position="50% 50%"
                        priority={false}
                        className="absolute inset-0"
                        imageClassName="transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                        fallback={null}
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--pc-accent) 38%, transparent), transparent 60%), linear-gradient(135deg, #1b1b1e, #0e0e10)",
                        }}
                      />
                    )}
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.05) 70%)" }}
                    />
                    <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md">
                      <ArrowUpRight aria-hidden className="size-[17px]" />
                    </span>
                    <div className="absolute inset-x-5 bottom-4 text-white">
                      <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
                        <BrandIcon name={m.featured.icon ?? m.featured.type} className="size-[14px]" />
                        {m.featured.description ?? m.featured.kind}
                      </p>
                      <p className="mt-1.5 truncate font-[family-name:var(--pc-display)] text-[21px] font-bold tracking-[-0.02em]">
                        {m.featured.label}
                      </p>
                    </div>
                  </div>
                </TrackedLink>
              )}

              {rest.length > 0 && (
                <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {rest.map((link) => (
                    <li key={link.id} className="pc-inview">
                      <TrackedLink
                        href={link.href}
                        profileId={profile.id}
                        action="LINK"
                        linkId={link.id.startsWith("profile-") ? null : link.id}
                        preview={preview}
                        external={link.external}
                        className="flex h-full min-h-[108px] flex-col justify-between rounded-[20px] bg-[var(--pc-tile)] p-4"
                      >
                        <span className="flex items-start justify-between">
                          <BrandIcon name={link.icon ?? link.type} className="size-[20px]" />
                          <ArrowUpRight aria-hidden className="size-[15px] text-[var(--pc-ink-3)]" />
                        </span>
                        <span className="mt-4 min-w-0">
                          <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                            {link.label}
                          </span>
                          {link.detail && (
                            <span className="mt-0.5 block truncate text-[12.5px] text-[var(--pc-ink-2)]">
                              {link.detail}
                            </span>
                          )}
                        </span>
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
                  className="pc-inview mt-2.5 flex items-center gap-3.5 rounded-[20px] bg-[var(--pc-tile)] p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--pc-tile)]">
                    <MapPin aria-hidden className="size-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{m.place}</span>
                    {profile.location.country && (
                      <span className="block truncate text-[12.5px] text-[var(--pc-ink-2)]">
                        {profile.location.country}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium">
                    Itinéraire
                    <ArrowUpRight aria-hidden className="size-[14px] text-[var(--pc-ink-3)]" />
                  </span>
                </TrackedLink>
              )}
            </section>
          )}

          <footer className="mt-12 flex flex-col items-center gap-4">
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager ce profil"
              className="h-12 rounded-full bg-[var(--pc-tile)] px-6 text-[14px] font-semibold"
            />
            <p className="text-[12px] text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--pc-ink-2)]">
      {children}
    </h2>
  );
}

/** Sans photo : une affiche typographique plutot qu un avatar gris. */
function Poster({ initials }: { initials: string }) {
  return (
    <div
      className="flex size-full items-center justify-center"
      style={{
        background:
          "radial-gradient(90% 70% at 30% 20%, color-mix(in srgb, var(--pc-accent) 30%, #2a2a2e), #0d0d0f 75%)",
      }}
    >
      <span className="font-[family-name:var(--pc-display)] text-[132px] font-extrabold leading-none tracking-[-0.06em] text-white/90">
        {initials}
      </span>
    </div>
  );
}
