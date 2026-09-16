import Image from "next/image";
import { ArrowUpRight, Globe, Mail, MapPin, Phone, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { signatureDisplay } from "./premium/font-signature";
import { buildCardModel } from "./premium/model";
import { isValidCardToken, isValidShareSlug } from "@/lib/tokens";
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
    contact.phone && { icon: Phone, label: "Téléphone", value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`, action: "CALL" as const, external: false },
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
        {/* Bandeau de l entreprise */}
        <section className="relative h-[150px] bg-[var(--pc-x-band)] px-5 pt-[max(12px,env(safe-area-inset-top))] text-[var(--pc-x-bandInk)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "24px 100%" }}
          />
          <div className="pc-fade relative flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
            <div className="flex min-w-0 items-center gap-2.5">
              {identity.logoUrl && (
                <span className="relative size-8 shrink-0 overflow-hidden rounded-[8px] bg-white">
                  <Portrait src={identity.logoUrl} alt="" sizes="32px" position="50% 50%" priority={false} className="size-full" imageClassName="object-contain p-1" fallback={null} />
                </span>
              )}
              <span className="truncate font-[family-name:var(--pc-display)] text-[16px] font-bold tracking-[-0.01em]">
                {identity.company ?? "Carte professionnelle"}
              </span>
            </div>
            <ShareControl
              url={profile.canonicalUrl}
              title={identity.displayName}
              profileId={profile.id}
              preview={preview}
              className="-mr-2 size-10 rounded-full hover:bg-white/10"
            />
          </div>
        </section>

        {/* La fiche */}
        <section
          className="pc-lift relative mx-3 -mt-[72px] rounded-[20px] bg-[var(--pc-surface)] p-5 shadow-[0_1px_2px_rgba(15,27,45,0.06),0_18px_40px_-26px_rgba(15,27,45,0.45)]"
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          <div className="flex items-start gap-4">
            <div className="relative h-[96px] w-[80px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--pc-bg)]">
              <Portrait
                src={identity.avatarUrl}
                alt={identity.displayName}
                sizes="80px"
                position={m.photoPosition}
                className="size-full"
                fallback={
                  <div className="flex size-full items-center justify-center font-[family-name:var(--pc-display)] text-[24px] font-bold text-[var(--pc-accent)]">
                    {m.name.initials}
                  </div>
                }
              />
            </div>
            <div className="min-w-0 pt-1">
              <Name className="font-[family-name:var(--pc-display)] text-[clamp(22px,6.4vw,26px)] font-bold leading-[1.1] tracking-[-0.02em]">
                {m.name.full}
              </Name>
              {identity.title && <p className="mt-1 text-[14.5px] leading-snug text-[var(--pc-ink-2)]">{identity.title}</p>}
              {m.availability && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--pc-accent)]">
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {m.availability}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
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
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[var(--pc-radius)] bg-[var(--pc-bg)] text-[13px] font-semibold"
                >
                  <ActionIcon kind={a.kind} className="size-[15px] text-[var(--pc-accent)]" />
                  {a.label}
                </TrackedLink>
              ))}
            </nav>
          )}

          {details.length > 0 && (
            <ul className="mt-5 border-t border-[var(--pc-line)]">
              {details.map((d) => (
                <li key={d.label} className="border-b border-[var(--pc-line)] last:border-b-0">
                  <TrackedLink
                    href={d.href}
                    profileId={profile.id}
                    action={d.action}
                    preview={preview}
                    external={d.external}
                    className="group -mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3"
                  >
                    <d.icon aria-hidden className="size-[17px] shrink-0 text-[var(--pc-ink-2)]" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] font-medium uppercase tracking-[0.08em] text-[var(--pc-ink-2)]">{d.label}</span>
                      <span className="block truncate text-[15px] font-medium">{d.value}</span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
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
              <ul className="mt-2 overflow-hidden rounded-[16px] bg-[var(--pc-surface)]">
                {links.map((link) => (
                  <li key={link.id} className="pc-inview border-b border-[var(--pc-line)] last:border-b-0">
                    <TrackedLink
                      href={link.href}
                      profileId={profile.id}
                      action="LINK"
                      linkId={link.id}
                      preview={preview}
                      external={link.external}
                      className="flex items-center gap-3 px-4 py-3.5"
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

          {/* Face a face : l ecran tendu a quelqu un sans NFC. */}
          <section className="pc-inview mt-8 flex items-center gap-4 rounded-[16px] border border-[var(--pc-line)] p-4">
            <div className="relative flex size-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white p-1.5">
              {qrReady ? (
                <Image src={`/api/qr/${token}`} alt="QR Code de cette carte" width={80} height={80} unoptimized className="size-full" />
              ) : (
                <span className="text-center text-[10px] leading-tight text-[#7a8594]">QR Code visible sur la carte publiée</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold">Scannez pour enregistrer</p>
              <p className="mt-1 text-[13px] leading-snug text-[var(--pc-ink-2)]">
                Tendez cet écran à votre interlocuteur : le code ouvre cette même carte.
              </p>
            </div>
          </section>

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
