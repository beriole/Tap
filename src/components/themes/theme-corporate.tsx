import Image from "next/image";
import { ArrowUpRight, Globe, Mail, MapPin, Phone, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { signatureDisplay } from "./premium/font-signature";
import { buildCardModel } from "./premium/model";
import { isValidCardToken, isValidShareSlug } from "@/lib/tokens";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * CORPORATE - Structured · Trustworthy · Clear.
 *
 * Le parti pris : l entreprise d abord, la personne ensuite. Un bandeau aux
 * couleurs de la societe, puis une fiche unique qui remonte sur lui et porte
 * tout l essentiel. Contrairement aux autres designs, les coordonnees sont
 * ECRITES en toutes lettres - un acheteur, un service achats, un partenaire
 * veut pouvoir relire un numero ou une adresse, pas seulement toucher un
 * bouton.
 *
 * Un QR Code clot la fiche : en rendez-vous, on tend son ecran a quelqu un
 * dont le telephone n a pas le sans-contact.
 */
export function ThemeCorporate({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "corporate");
  const { identity, contact, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && (isValidCardToken(token) || (token === token.toLowerCase() && isValidShareSlug(token)));

  const details = [
    contact.phone && { icon: Phone, label: "Téléphone", value: formatPhone(normalizePhone(contact.phone).e164) || contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`, action: "CALL" as const, external: false },
    contact.email && { icon: Mail, label: "E-mail", value: contact.email, href: `mailto:${contact.email}`, action: "EMAIL" as const, external: false },
    contact.website && {
      icon: Globe,
      label: "Site web",
      value: contact.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      href: /^https?:\/\//.test(contact.website) ? contact.website : `https://${contact.website}`,
      action: "LINK" as const,
      external: true,
    },
    m.place && m.mapHref && { icon: MapPin, label: "Adresse", value: [m.place, location.country].filter(Boolean).join(", "), href: m.mapHref, action: "DIRECTIONS" as const, external: true },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string; action: "CALL" | "EMAIL" | "LINK" | "DIRECTIONS"; external: boolean }[];

  const links = m.destinations.filter((d) => d.type !== "WEBSITE" && d.id !== "profile-website");

  return (
    <main
      style={m.style}
      className={cn(signatureDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[460px] pb-14">
        <header className="pc-fade flex h-12 items-center justify-between px-5 pt-[max(8px,env(safe-area-inset-top))]" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--pc-ink-3)]">Carte professionnelle</span>
          <ShareControl url={profile.canonicalUrl} title={identity.displayName} profileId={profile.id} preview={preview} className="-mr-2 size-10 rounded-full hover:bg-[var(--pc-press)]" />
        </header>

        {/* La carte : recto aux couleurs de la societe, le portrait pris dans
            la bande ; verso, les coordonnees ecrites et le QR. */}
        <section className="pc-lift mt-3 px-4" style={{ "--d": "100ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[8px]"
            front={
              <div className="relative flex size-full overflow-hidden rounded-[8px] bg-[var(--pc-surface)] shadow-[0_1px_2px_rgba(15,27,45,0.08),0_24px_48px_-28px_rgba(15,27,45,0.5)] ring-1 ring-[var(--pc-line)]">
                <div className="relative w-[36%] shrink-0 overflow-hidden bg-[var(--pc-x-band)]">
                  <div aria-hidden className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "18px 100%", color: "var(--pc-x-bandInk)" }} />
                  {identity.avatarUrl && <Portrait src={identity.avatarUrl} alt="" sizes="140px" position={m.photoPosition} priority className="size-full" imageClassName="object-cover" fallback={null} />}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--pc-x-band)] via-transparent to-transparent opacity-70" />
                  {identity.logoUrl ? (
                    <span className="absolute bottom-3 left-3 size-8 overflow-hidden rounded-[6px] bg-white">
                      <Portrait src={identity.logoUrl} alt="" sizes="32px" position="50% 50%" priority={false} className="size-full" imageClassName="object-contain p-1" fallback={null} />
                    </span>
                  ) : (
                    <span className="absolute bottom-3 left-3 font-[family-name:var(--pc-display)] text-[13px] font-bold tracking-[0.04em] text-[var(--pc-x-bandInk)]">{m.name.initials}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between p-[16px]">
                  <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--pc-accent)]">{identity.company ?? " "}</p>
                  <div>
                    <Name className="font-[family-name:var(--pc-display)] text-[clamp(17px,5vw,21px)] font-bold leading-[1.08] tracking-[-0.025em]">
                      {m.name.first}
                      {m.name.last && (
                        <>
                          <br />
                          {m.name.last}
                        </>
                      )}
                    </Name>
                    {identity.title && <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-[1.35] text-[var(--pc-ink-2)]">{identity.title}</p>}
                  </div>
                  <span aria-hidden className="block h-[3px] w-8 bg-[var(--pc-x-band)]" />
                </div>
              </div>
            }
            back={
              <div className="relative flex size-full overflow-hidden rounded-[8px] bg-[var(--pc-surface)] shadow-[0_1px_2px_rgba(15,27,45,0.08),0_24px_48px_-28px_rgba(15,27,45,0.5)] ring-1 ring-[var(--pc-line)]">
                <span aria-hidden className="absolute inset-y-0 left-0 w-[6px] bg-[var(--pc-x-band)]" />
                <div className="flex min-w-0 flex-1 flex-col justify-between p-[16px] pl-[20px]">
                  <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--pc-accent)]">{identity.company ?? m.name.full}</p>
                  <ul className="space-y-[5px] text-[10.5px] leading-[1.35]">
                    {details.map((d) => (
                      <li key={d.label} className="flex min-w-0 items-baseline gap-2">
                        <span className="w-[54px] shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[var(--pc-ink-3)]">{d.label}</span>
                        <span className={d.value.includes("@") ? "min-w-0 [overflow-wrap:anywhere]" : "min-w-0 truncate"}>{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-end p-[14px]">
                  {qrReady ? (
                    <span className="block size-[64px] overflow-hidden rounded-[4px] bg-white p-1 ring-1 ring-[var(--pc-line)]">
                      <Image src={`/api/qr/${token}`} alt="" width={56} height={56} unoptimized className="size-full" />
                    </span>
                  ) : (
                    <span className="flex size-[64px] items-center justify-center rounded-[4px] bg-[var(--pc-bg)] text-center text-[8px] leading-tight text-[var(--pc-ink-3)]">QR sur la carte publiée</span>
                  )}
                </div>
              </div>
            }
          />
        </section>

        <section className="px-5">
          <div className="mt-6">
            <SaveContact
              token={profile.cardToken}
              profileId={profile.id}
              name={identity.displayName}
              preview={preview}
              icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
              className="h-[50px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[14.5px] font-semibold text-[var(--pc-cta-ink)]"
            />
          </div>

          {m.actions.length > 0 && (
            <nav aria-label="Contacter" className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` }}>
              {m.actions.map((a) => (
                <TrackedLink key={a.kind} href={a.href} profileId={profile.id} action={a.action} linkId={a.linkId} preview={preview} external={a.external} className="flex h-[46px] items-center justify-center gap-2 rounded-[var(--pc-radius)] bg-[var(--pc-surface)] text-[13px] font-semibold ring-1 ring-[var(--pc-line)]">
                  <ActionIcon kind={a.kind} className="size-[15px] text-[var(--pc-accent)]" />
                  {a.label}
                </TrackedLink>
              ))}
            </nav>
          )}
          {m.availability && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--pc-accent)]">
              <span aria-hidden className="size-1.5 rounded-full bg-current" />
              {m.availability}
            </p>
          )}
        </section>

        <div className="px-5">
          {intro && (
            <section className="pc-inview mt-8">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--pc-ink-2)]">Présentation</h2>
              <p className="mt-2 text-[15px] leading-[1.65]">{intro}</p>
            </section>
          )}

          {links.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--pc-ink-2)]">Ressources</h2>
              <ul className="mt-2 border-t border-[var(--pc-line)]">
                {links.map((link) => (
                  <li key={link.id} className="pc-inview border-b border-[var(--pc-line)] last:border-b-0">
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id}
                      preview={preview}
                      external={link.external}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <BrandIcon name={link.icon ?? link.type} className="size-[18px] shrink-0 text-[var(--pc-accent)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{link.label}</span>
                        {link.detail && <span className="block truncate text-[12.5px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                      </span>
                      <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)]" />
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {m.social.length > 0 && (
            <ul className="pc-inview mt-6 flex flex-wrap gap-2">
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
                    className="flex size-11 items-center justify-center rounded-[12px] bg-[var(--pc-surface)]"
                  >
                    <BrandIcon name={link.icon ?? link.type} className="size-[18px]" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          )}


          <footer className="mt-10 flex items-center justify-between border-t border-[var(--pc-line)] pt-4">
            <span className="text-[12px] text-[var(--pc-ink-3)]">Carte NFC · Tap</span>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              showLabel
              label="Partager"
              className="h-10 rounded-[10px] bg-[var(--pc-surface)] px-4 text-[13.5px] font-semibold"
            />
          </footer>
        </div>
      </div>
    </main>
  );
}
