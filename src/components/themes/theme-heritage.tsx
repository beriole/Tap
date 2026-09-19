import Image from "next/image";
import { ArrowUpRight, MapPin, UserRoundPlus } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { heritageDisplay } from "./premium/font-heritage";
import { GRAIN } from "./premium/paper";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * HERITAGE - African · Premium · Contemporary.
 *
 * Le parti pris : les references graphiques du continent, tenues comme une
 * identite de marque - pas comme un folklore. Aucun zigzag, aucun motif
 * charge. La carte est un objet sombre a deux faces :
 *  - recto : une TRAME tissee de filets fins sur le tiers gauche (deux jeux
 *    de lignes croisees, en degrades CSS, a 18 % d opacite), le monogramme
 *    en serif dense, le nom en capitales espacees ;
 *  - verso : les coordonnees ecrites, un carre d accent, le QR.
 * Le disque plein qui deborde derriere la carte est la seule masse de
 * couleur de la page ; le bouton est a l encre.
 *
 * Serif ronde et dense (DM Serif Display) pour les titres, Geist pour le
 * courant. Les rubriques sont ouvertes, annoncees par un carre d accent.
 */
const WEAVE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, var(--pc-x-weave) 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, var(--pc-x-weave) 0 1px, transparent 1px 8px)",
};

export function ThemeHeritage({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "heritage");
  const { identity, contact, location } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const cardLines = [
    (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone,
    contact.email,
    contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    [location.city, location.country].filter(Boolean).join(", ") || null,
  ].filter((l): l is string => Boolean(l));

  const card = "relative flex size-full overflow-hidden rounded-[6px] bg-[var(--pc-x-card)] text-[var(--pc-x-cardInk)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_0_0_1px_rgba(0,0,0,0.25),0_30px_60px_-28px_rgba(0,0,0,0.75)]";

  return (
    <main style={m.style} className={cn(heritageDisplay.variable, "min-h-dvh overflow-x-clip bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}>
      <div className="relative mx-auto w-full max-w-[440px] px-6 pb-14 pt-[max(14px,env(safe-area-inset-top))] md:pt-12">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full border border-[var(--pc-line)] font-[family-name:var(--pc-display)] text-[12px]">
            {m.name.initials}
          </span>
          <ShareControl url={profile.canonicalUrl} title={identity.displayName} profileId={profile.id} preview={preview} className="-mr-2 size-10 rounded-full text-[var(--pc-ink-2)] hover:bg-[var(--pc-press)]" />
        </header>

        {/* Le disque, puis la carte posee dessus. */}
        <section className="relative mt-6">
          <span aria-hidden className="pc-settle pointer-events-none absolute -right-14 -top-10 size-[220px] rounded-full bg-[var(--pc-accent)]" style={{ "--d": "60ms" } as React.CSSProperties} />
          <div className="pc-lift relative" style={{ "--d": "140ms" } as React.CSSProperties}>
            <FlipCard
              className="aspect-[85/55] rounded-[6px]"
              front={
                <div className={card}>
                  <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
                  <div aria-hidden className="relative w-[30%] shrink-0 opacity-[0.22]" style={WEAVE} />
                  <span aria-hidden className="absolute inset-y-4 left-[30%] w-px bg-[var(--pc-accent)] opacity-60" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-[18px] pl-[22px]">
                    {identity.logoUrl ? (
                      <Portrait src={identity.logoUrl} alt="" sizes="40px" position="50% 50%" priority={false} className="size-10 rounded-[6px]" imageClassName="object-contain" fallback={null} />
                    ) : (
                      <span aria-hidden className="font-[family-name:var(--pc-display)] text-[clamp(30px,9vw,38px)] leading-none text-[var(--pc-accent)]">
                        {m.name.initials}
                      </span>
                    )}
                    <div>
                      <Name className="text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.26em]">{m.name.full}</Name>
                      {identity.company && <p className="mt-0.5 truncate text-[9.5px] uppercase tracking-[0.2em] text-[var(--pc-x-cardInk)] opacity-70">{identity.company}</p>}
                    </div>
                  </div>
                </div>
              }
              back={
                <div className={card}>
                  <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-[18px]">
                    <div>
                      <span aria-hidden className="mb-2 block size-2.5 bg-[var(--pc-accent)]" />
                      <p className="font-[family-name:var(--pc-display)] text-[clamp(19px,5.6vw,23px)] leading-[1.05]">{m.name.full}</p>
                      {identity.title && <p className="mt-1 line-clamp-2 text-[10.5px] leading-[1.4] opacity-80">{identity.title}</p>}
                    </div>
                    <ul className="space-y-[3px] text-[10px] leading-[1.4] opacity-90">
                      {cardLines.map((line) => (
                        <li key={line} className={line.includes("@") ? "[overflow-wrap:anywhere]" : "truncate"}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-end p-[14px]">
                    {qrReady ? (
                      <span className="block size-[60px] overflow-hidden rounded-[3px] bg-[#F4EAD8] p-1">
                        <Image src={`/api/qr/${token}`} alt="" width={52} height={52} unoptimized className="size-full" />
                      </span>
                    ) : (
                      <span aria-hidden className="size-[60px] opacity-[0.3]" style={WEAVE} />
                    )}
                  </div>
                </div>
              }
            />
          </div>
        </section>

        {/* Le portrait : un carre franc, sous le disque. */}
        <section className="mt-10 grid grid-cols-[112px_1fr] items-end gap-5">
          {identity.avatarUrl ? (
            <div className="pc-unveil relative aspect-square overflow-hidden bg-[var(--pc-surface)]">
              <Portrait src={identity.avatarUrl} alt={identity.displayName} sizes="112px" position={m.photoPosition} className="size-full" fallback={null} />
            </div>
          ) : (
            <span />
          )}
          <div className="min-w-0 pb-1">
            {identity.title && <p className="pc-rise text-[16px] leading-[1.35] text-[var(--pc-ink)]" style={{ "--d": "220ms" } as React.CSSProperties}>{identity.title}</p>}
            {identity.company && <p className="pc-rise mt-1 text-[14px] text-[var(--pc-ink-2)]" style={{ "--d": "260ms" } as React.CSSProperties}>{identity.company}</p>}
            {m.availability && (
              <p className="pc-rise mt-3 inline-flex items-center gap-2 text-[12.5px] text-[var(--pc-accent)]" style={{ "--d": "300ms" } as React.CSSProperties}>
                <span aria-hidden className="size-1.5 bg-current" />
                {m.availability}
              </p>
            )}
          </div>
        </section>

        <div className="pc-rise mt-7" style={{ "--d": "340ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={<UserRoundPlus className="size-[18px]" strokeWidth={2} />}
            className="h-[52px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-cta)] text-[14.5px] font-semibold tracking-[0.01em] text-[var(--pc-cta-ink)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav aria-label="Contacter" className="pc-rise mt-2.5 grid gap-2.5" style={{ "--d": "380ms", gridTemplateColumns: `repeat(${m.actions.length}, minmax(0, 1fr))` } as React.CSSProperties}>
            {m.actions.map((a) => (
              <TrackedLink key={a.kind} href={a.href} profileId={profile.id} action={a.action} linkId={a.linkId} preview={preview} external={a.external} className="flex h-[48px] items-center justify-center gap-2 rounded-[var(--pc-radius)] border border-[var(--pc-line)] text-[13.5px] hover:border-[var(--pc-accent)]">
                <ActionIcon kind={a.kind} className="size-[16px] text-[var(--pc-accent)]" />
                {a.label}
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <section className="pc-inview mt-12">
            <span aria-hidden className="mb-4 block size-2.5 bg-[var(--pc-accent)]" />
            <p className="font-[family-name:var(--pc-display)] text-[clamp(20px,5.6vw,24px)] leading-[1.35] text-[var(--pc-ink)]">{intro}</p>
          </section>
        )}

        {m.destinations.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3">
              <span aria-hidden className="size-2.5 bg-[var(--pc-accent)]" />
              <h2 className="font-[family-name:var(--pc-display)] text-[22px] leading-none">Liens</h2>
            </div>
            <ul className="mt-4 border-t border-[var(--pc-line)]">
              {m.destinations.map((link) => (
                <li key={link.id} className="pc-inview border-b border-[var(--pc-line)]">
                  <TrackedLink href={link.href} profileId={profile.id} action="LINK" linkId={link.id.startsWith("profile-") ? null : link.id} preview={preview} external={link.external} className="group flex items-center gap-4 py-[15px]">
                    <BrandIcon name={link.icon ?? link.type} className="size-[19px] shrink-0 text-[var(--pc-accent)]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15.5px] font-medium">{link.label}</span>
                      {link.detail && <span className="mt-0.5 block truncate text-[13px] text-[var(--pc-ink-2)]">{link.detail}</span>}
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-[var(--pc-ink-3)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview -ml-2.5 mt-8 flex flex-wrap gap-1">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink href={link.href} profileId={profile.id} action="LINK" linkId={link.id} preview={preview} external={link.external} ariaLabel={link.label} className="flex size-11 items-center justify-center rounded-full hover:bg-[var(--pc-press)]">
                  <BrandIcon name={link.icon ?? link.type} className="size-[20px]" />
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.place && m.mapHref && (
          <section className="pc-inview mt-10 border-t border-[var(--pc-line)] pt-5">
            <TrackedLink href={m.mapHref} profileId={profile.id} action="DIRECTIONS" preview={preview} external className="flex items-start gap-3.5">
              <MapPin aria-hidden className="mt-0.5 size-[18px] shrink-0 text-[var(--pc-accent)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug">{m.place}</span>
                {location.country && <span className="mt-0.5 block text-[13px] text-[var(--pc-ink-2)]">{location.country}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1 pt-0.5 text-[13px] font-medium">
                Itinéraire
                <ArrowUpRight aria-hidden className="size-3.5 text-[var(--pc-ink-3)]" />
              </span>
            </TrackedLink>
          </section>
        )}

        <footer className="mt-14 flex items-center justify-between border-t border-[var(--pc-line)] pt-5">
          <p className="text-[12px] tracking-[0.02em] text-[var(--pc-ink-3)]">Carte NFC · Tap</p>
          <ShareControl url={profile.canonicalUrl} title={identity.displayName} profileId={profile.id} preview={preview} showLabel label="Partager" className="h-10 rounded-full border border-[var(--pc-line)] px-4 text-[13.5px] font-medium hover:bg-[var(--pc-press)]" />
        </footer>
      </div>
    </main>
  );
}
