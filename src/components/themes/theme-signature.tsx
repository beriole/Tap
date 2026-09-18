import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TiltCard, TrackedLink } from "./premium/atoms";
import { GRAIN } from "./premium/paper";
import { signatureDisplay } from "./premium/font-signature";
import { ActionIcon } from "./premium/action-icon";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
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
  const { contact, location } = profile;
  // Les coordonnees ECRITES sur le carton, comme sur une carte imprimee.
  const cardLines = [
    contact.phone && formatPhone(normalizePhone(contact.phone).e164) || contact.phone,
    contact.email,
    contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    location.city,
  ].filter((l): l is string => Boolean(l));

  return (
    <main
      style={m.style}
      className={cn(
        signatureDisplay.variable,
        "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased",
      )}
    >
      <div className="mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(14px,env(safe-area-inset-top))] md:pt-12">
        {/* Barre haute : seulement le partage - l identite est sur le carton. */}
        <header className="pc-fade flex h-12 items-center justify-end" style={{ "--d": "0ms" } as React.CSSProperties}>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]"
          />
        </header>

        {/* Le portrait en tirage, puis le carton de visite pose dessus. */}
        <section className="relative mt-1">
          {identity.avatarUrl && (
            <div className="pc-unveil relative aspect-square w-full overflow-hidden rounded-[22px] bg-[var(--pc-surface)]">
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="(max-width: 440px) 92vw, 392px"
                position={m.photoPosition}
                className="size-full"
                fallback={null}
              />
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
              {m.availability && (
                <p className="absolute left-3.5 top-3.5 flex max-w-[calc(100%-28px)] items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[#7BE0A0]" />
                  <span className="truncate">{m.availability}</span>
                </p>
              )}
            </div>
          )}

          <div
            className={cn("pc-lift relative z-10 mx-auto w-[calc(100%-22px)]", identity.avatarUrl ? "-mt-[92px]" : "mt-8")}
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            <TiltCard className="rounded-[8px]">
              <div className="relative aspect-[85/55] w-full overflow-hidden rounded-[8px] bg-[var(--pc-x-card)] shadow-[0_1px_1px_rgba(0,0,0,0.05),0_3px_6px_-2px_rgba(0,0,0,0.08),0_28px_50px_-26px_rgba(0,0,0,0.45)]">
                <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
                <div className="relative grid h-full grid-cols-[1.2fr_1fr]">
                  <div className="flex min-w-0 flex-col justify-between py-[17px] pl-[18px] pr-3">
                    {identity.logoUrl ? (
                      <Portrait
                        src={identity.logoUrl}
                        alt=""
                        sizes="32px"
                        position="50% 50%"
                        priority={false}
                        className="size-8 shrink-0 rounded-[7px]"
                        imageClassName="object-contain"
                        fallback={null}
                      />
                    ) : (
                      <span aria-hidden className="flex size-[34px] items-center justify-center rounded-full border border-[var(--pc-line)] font-[family-name:var(--pc-display)] text-[12px] font-semibold tracking-[0.02em]">
                        {m.name.initials}
                      </span>
                    )}
                    <div>
                      <Name className="font-[family-name:var(--pc-display)] text-[clamp(18px,5.3vw,22px)] font-semibold leading-[1.08] tracking-[-0.03em]">
                        {m.name.first}
                        {m.name.last && (
                          <>
                            <br />
                            {m.name.last}
                          </>
                        )}
                      </Name>
                      {identity.title && (
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.35] text-[var(--pc-ink-2)]">{identity.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col justify-between border-l border-[var(--pc-line)] py-[17px] pl-3.5 pr-4">
                    {identity.company ? (
                      <p className="line-clamp-2 text-[9.5px] font-semibold uppercase leading-[1.5] tracking-[0.16em]">{identity.company}</p>
                    ) : (
                      <span />
                    )}
                    <ul className="space-y-[3px] text-[10.5px] leading-[1.35] text-[var(--pc-ink-2)]">
                      {cardLines.map((line) => (
                        <li key={line} className={line.includes("@") ? "[overflow-wrap:anywhere]" : "truncate"}>
                          {/* Une adresse e-mail se coupe apres l arobase, jamais au milieu d un mot. */}
                          {line.includes("@") ? (
                            <>
                              {line.slice(0, line.indexOf("@") + 1)}
                              <wbr />
                              {line.slice(line.indexOf("@") + 1)}
                            </>
                          ) : (
                            line
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* L action principale, seule a porter un aplat. */}
        <div className="pc-rise mt-6" style={{ "--d": "280ms" } as React.CSSProperties}>
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

        {intro && (
          <section className="pc-inview mt-11">
            <SectionLabel>À propos</SectionLabel>
            <p className="mt-3 font-[family-name:var(--pc-display)] text-[18px] font-medium leading-[1.55] tracking-[-0.015em] text-[var(--pc-ink)]">
              {intro}
            </p>
          </section>
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

