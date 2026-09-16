import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { signatureDisplay } from "./premium/font-signature";
import { ActionIcon } from "./premium/action-icon";
import { buildCardModel } from "./premium/model";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * SIGNATURE - Minimal · Professional · Elegant.
 *
 * Le parti pris : une carte de visite composee comme un papier a lettres.
 * Le nom sur deux lignes, fer a gauche ; le portrait a sa droite, en format
 * 4:5, comme un tirage pose sur la page. Pas un cercle au centre - la
 * disposition de toutes les applications.
 *
 * Aucune information n est enfermee dans une carte. Ce qui structure l ecran,
 * ce sont des filets d un pixel, un alignement unique sur la marge gauche, et
 * la difference de graisse entre ce qu on lit d abord et ce qu on lit ensuite.
 *
 * Premier ecran (390 x 844) : identite, portrait, presentation, bouton
 * principal et actions de contact - sans defiler.
 */
export function ThemeSignature({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "signature");
  const { identity } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;

  return (
    <main
      style={m.style}
      className={cn(
        signatureDisplay.variable,
        "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased",
      )}
    >
      <div className="mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(14px,env(safe-area-inset-top))] md:pt-12">
        {/* Barre haute : la marque du client a gauche, le partage a droite. */}
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <div className="flex min-w-0 items-center gap-2.5">
            {identity.logoUrl && (
              <Portrait
                src={identity.logoUrl}
                alt=""
                sizes="28px"
                position="50% 50%"
                priority={false}
                className="size-7 shrink-0 rounded-[8px] ring-1 ring-[var(--pc-line)]"
                imageClassName="object-contain"
                fallback={null}
              />
            )}
            {identity.logoUrl && identity.company && (
              <span className="truncate text-[13px] font-medium tracking-[-0.005em] text-[var(--pc-ink-2)]">
                {identity.company}
              </span>
            )}
          </div>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Identite : texte fer a gauche, tirage a droite, bas alignes. */}
        <section className="mt-4 grid grid-cols-[1fr_auto] items-end gap-5">
          <div className="min-w-0">
            {m.availability && (
              <p
                className="pc-rise mb-4 flex items-center gap-2 text-[12.5px] leading-snug text-[var(--pc-ink-2)]"
                style={{ "--d": "80ms" } as React.CSSProperties}
              >
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--pc-accent)]" />
                <span className="line-clamp-2">{m.availability}</span>
              </p>
            )}
            <Name
              className="pc-rise font-[family-name:var(--pc-display)] text-[clamp(30px,8.6vw,35px)] font-semibold leading-[1.02] tracking-[-0.038em]"
              style={{ "--d": "120ms" } as React.CSSProperties}
            >
              {m.name.first}
              {m.name.last && (
                <>
                  <br />
                  {m.name.last}
                </>
              )}
            </Name>
          </div>

          {/* L entree est portee par le conteneur : le squelette de l image
              utilise lui aussi `animation`, les deux ne peuvent pas cohabiter
              sur le meme element. Le filet est interieur - une ombre
              exterieure serait rognee par le clip-path du devoilement. */}
          <div className="pc-unveil relative h-[140px] w-[112px] overflow-hidden rounded-[18px]">
            <Portrait
              src={identity.avatarUrl}
              alt={identity.displayName}
              sizes="112px"
              position={m.photoPosition}
              className="size-full bg-[var(--pc-surface)]"
              fallback={
                <div className="flex size-full items-center justify-center bg-[var(--pc-surface)] font-[family-name:var(--pc-display)] text-[34px] font-semibold tracking-[-0.04em] text-[var(--pc-ink-2)]">
                  {m.name.initials}
                </div>
              }
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-[var(--pc-line)]" />
          </div>
        </section>

        {(identity.title || identity.company) && (
          <p
            className="pc-rise mt-3.5 text-[16px] leading-[1.45] text-[var(--pc-ink-2)]"
            style={{ "--d": "170ms" } as React.CSSProperties}
          >
            {identity.title}
            {identity.title && identity.company && <br />}
            {identity.company && (
              <span className="font-medium text-[var(--pc-ink)]">{identity.company}</span>
            )}
          </p>
        )}

        {intro && (
          <p
            className="pc-rise mt-5 line-clamp-4 text-[15px] leading-[1.6] text-[var(--pc-ink-2)]"
            style={{ "--d": "220ms" } as React.CSSProperties}
          >
            {intro}
          </p>
        )}

        {/* L action principale, seule a porter un aplat. */}
        <div className="pc-rise mt-7" style={{ "--d": "280ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[15px] font-semibold tracking-[-0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise mt-3 grid border-y border-[var(--pc-line)]"
            style={
              {
                "--d": "330ms",
                gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))`,
              } as React.CSSProperties
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
                  "flex flex-col items-center gap-1.5 py-3.5 text-[var(--pc-ink)]",
                  i > 0 && "border-l border-[var(--pc-line)]",
                )}
              >
                <ActionIcon kind={a.kind} className="size-[19px]" />
                <span className="text-[12.5px] font-medium text-[var(--pc-ink-2)]">{a.label}</span>
              </TrackedLink>
            ))}
          </nav>
        )}

        {/* Au-dela du premier ecran : les liens, puis le lieu. */}
        {m.destinations.length > 0 && (
          <section className="mt-11">
            <SectionLabel>Liens</SectionLabel>
            <ul className="mt-2 border-t border-[var(--pc-line)]">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink
                    href={link.href}
                    profileId={profile.id}
                    action="LINK"
                    linkId={link.id.startsWith("profile-") ? null : link.id}
                    preview={preview}
                    external={link.external}
                    className="group -mx-3 flex items-center gap-4 rounded-[12px] px-3 py-[15px]"
                  >
                    <BrandIcon
                      name={link.icon ?? link.type}
                      className="size-[19px] shrink-0 text-[var(--pc-ink-2)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-medium tracking-[-0.01em]">
                        {link.label}
                      </span>
                      {link.detail && (
                        <span className="mt-0.5 block truncate text-[13px] text-[var(--pc-ink-2)]">
                          {link.detail}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 text-[var(--pc-ink-3)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <section className="pc-inview mt-10">
            <SectionLabel>Réseaux</SectionLabel>
            <ul className="-ml-2.5 mt-2 flex flex-wrap gap-1">
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
                    className="flex size-11 items-center justify-center rounded-full text-[var(--pc-ink)] hover:bg-[var(--pc-press)]"
                  >
                    <BrandIcon name={link.icon ?? link.type} className="size-[20px]" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.place && m.mapHref && (
          <section className="pc-inview mt-10 border-t border-[var(--pc-line)] pt-5">
            <TrackedLink
              href={m.mapHref}
              profileId={profile.id}
              action="DIRECTIONS"
              preview={preview}
              external
              className="group -mx-3 flex items-start gap-3.5 rounded-[12px] px-3 py-2"
            >
              <MapPin aria-hidden className="mt-0.5 size-[18px] shrink-0 text-[var(--pc-ink-2)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug">{m.place}</span>
                {profile.location.country && (
                  <span className="mt-0.5 block text-[13px] text-[var(--pc-ink-2)]">
                    {profile.location.country}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1 pt-0.5 text-[13px] font-medium">
                Itinéraire
                <ArrowUpRight aria-hidden className="size-3.5 text-[var(--pc-ink-3)]" />
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className="mt-14 flex flex-col items-center gap-4 border-t border-[var(--pc-line)] pt-8">
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            showLabel
            label="Partager ce profil"
            className="h-11 rounded-full border border-[var(--pc-line)] px-5 text-[14px] font-medium text-[var(--pc-ink)] hover:bg-[var(--pc-press)]"
          />
          <p className="text-[12px] tracking-[0.02em] text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
        </footer>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-medium tracking-[-0.005em] text-[var(--pc-ink-2)]">
      {children}
    </h2>
  );
}

