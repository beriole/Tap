import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { BrandIcon } from "@/components/profile/brand-icon";
import { FlipCard, Portrait, SaveContact, ShareControl, TrackedLink } from "./premium/atoms";
import { ActionIcon } from "./premium/action-icon";
import { blockDisplay } from "./premium/font-block";
import { buildCardModel } from "./premium/model";
import { formatPhone, normalizePhone } from "@/lib/events/phone";
import { isValidCardToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { ThemeProps } from "@/types/profile";

/**
 * BLOCK - Creative Studio · Bold · Graphic.
 *
 * Le parti pris : l identite d un studio de creation, construite en aplats.
 * Trois masses et rien d autre - la photo en bichromie, le bloc de couleur,
 * une bande d encre - et un nom en capitales condensees assez grand pour
 * chevaucher la coupe entre l image et l aplat.
 *  - recto : composition asymetrique. Photo bichrome sur les deux cinquiemes
 *    gauches, bloc de couleur a droite, le nom a cheval sur la frontiere ; la
 *    fonction sur une bande d encre en pied, la ou le petit texte reste lisible ;
 *  - verso : un aplat plein, les coordonnees en colonne, le QR, et les
 *    initiales geantes coupees par le bord.
 *
 * Contraste : un bloc de teinte moyenne (terre cuite) ne porte jamais de
 * petit texte - ni le clair ni le fonce n y atteignent 4,5:1. Le verso passe
 * alors a l aplat d encre ; sur un bloc assez fonce (cobalt), il reste au bloc.
 * Tout est a angle droit : la force tient a la taille et aux couleurs franches.
 */
export function ThemeBlock({ profile, preview }: ThemeProps) {
  const m = buildCardModel(profile, "block");
  const { identity, location, contact } = profile;
  const Name = preview ? "p" : "h1";
  const intro = identity.bio ?? identity.tagline;
  const photo = identity.avatarUrl ?? identity.coverUrl;
  const token = profile.cardToken;
  const qrReady = !preview && isValidCardToken(token);
  const extra = m.variant.tokens.extra ?? {};
  // Le bloc peut-il porter du petit texte ? Sinon le verso passe a l encre.
  const blockReads = contrast(extra.block ?? "#000000", extra.blockInk ?? "#FFFFFF") >= 4.5;

  const fields = [
    (contact.phone && formatPhone(normalizePhone(contact.phone).e164)) || contact.phone,
    contact.email,
    contact.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null,
    m.region,
  ].filter((l): l is string => Boolean(l));

  // Le nom se regle sur son mot le plus long (Anton : ~0,46 em par capitale).
  const longest = Math.max(m.name.first.length, m.name.last?.length ?? 0);
  const nameSize = `min(19cqw, ${(80 / (longest * 0.46)).toFixed(2)}cqw)`;

  const face = "@container relative flex size-full overflow-hidden rounded-[2px] shadow-[0_26px_50px_-28px_rgba(0,0,0,0.55)]";
  const display = "font-[family-name:var(--pc-display)] uppercase";

  return (
    <main
      style={m.style}
      className={cn(blockDisplay.variable, "min-h-dvh bg-[var(--pc-bg)] text-[var(--pc-ink)] antialiased")}
    >
      <div className="mx-auto w-full max-w-[480px] px-5 pb-14 pt-[max(12px,env(safe-area-inset-top))] md:pt-10">
        <header className="pc-fade flex h-12 items-center justify-between" style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em]">
            <span aria-hidden className="size-3 bg-[var(--pc-x-block)]" />
            {identity.company ?? m.region ?? "Studio"}
          </span>
          <ShareControl
            url={profile.canonicalUrl}
            title={identity.displayName}
            profileId={profile.id}
            preview={preview}
            className="-mr-2 size-11 hover:bg-[var(--pc-press)]"
          />
        </header>

        <section className="pc-lift mt-4" style={{ "--d": "100ms" } as React.CSSProperties}>
          <FlipCard
            className="aspect-[85/55] rounded-[2px]"
            front={
              <div className={cn(face, "bg-[var(--pc-x-block)] text-[var(--pc-x-blockInk)]")}>
                {/* Photo bichrome : noir et blanc, puis teinte par multiplication. */}
                <div className="absolute inset-y-0 left-0 w-[40%] overflow-hidden bg-[color-mix(in_srgb,var(--pc-x-block)_40%,#000)]">
                  <Portrait
                    src={photo}
                    alt=""
                    sizes="160px"
                    position={m.photoPosition}
                    className="size-full"
                    imageClassName="grayscale contrast-[1.25] brightness-[1.05]"
                    fallback={
                      <div className={cn(display, "flex size-full items-end p-[3cqw] text-[30cqw] leading-[0.78] text-[var(--pc-x-block)]")}>
                        {m.name.initials.slice(0, 1)}
                      </div>
                    }
                  />
                  {photo && <div aria-hidden className="absolute inset-0 bg-[var(--pc-x-block)] mix-blend-multiply" />}
                </div>

                {/* La bande d encre, en pied du bloc : le seul support du petit texte. */}
                <div className="absolute bottom-0 left-[40%] right-0 flex h-[24%] items-center justify-between gap-2 bg-[var(--pc-ink)] px-[4.5cqw] text-[var(--pc-bg)]">
                  <p className="line-clamp-2 min-w-0 text-[max(9px,2.6cqw)] font-bold uppercase leading-[1.25] tracking-[0.12em]">
                    {identity.title ?? identity.company ?? m.region}
                  </p>
                  <span aria-hidden className="size-[2.6cqw] shrink-0 bg-[var(--pc-x-block)]" />
                </div>

                {/* Le nom, a cheval sur la coupe entre l image et l aplat. */}
                <Name
                  className={cn(display, "absolute left-[29%] top-[7%] leading-[0.86] tracking-[0.005em]")}
                  style={{ fontSize: nameSize }}
                >
                  <span className="block">{m.name.first}</span>
                  {m.name.last && <span className="block">{m.name.last}</span>}
                </Name>
              </div>
            }
            back={
              <div
                className={cn(
                  face,
                  blockReads
                    ? "bg-[var(--pc-x-block)] text-[var(--pc-x-blockInk)]"
                    : "bg-[var(--pc-ink)] text-[var(--pc-bg)]",
                )}
              >
                {/* Initiales geantes, coupees par le bord : la signature du verso. */}
                <span
                  aria-hidden
                  className={cn(
                    display,
                    "pointer-events-none absolute -right-[9cqw] -top-[7cqw] text-[56cqw] leading-[0.8]",
                    blockReads ? "text-[var(--pc-x-blockInk)] opacity-[0.14]" : "text-[var(--pc-x-block)]",
                  )}
                >
                  {m.name.initials}
                </span>
                <div className="relative flex min-w-0 flex-1 flex-col justify-between p-[5cqw]">
                  <div className="max-w-[40cqw]">
                    <p className={cn(display, "text-[max(22px,8.4cqw)] leading-[0.88]")}>{m.name.full}</p>
                    {identity.title && (
                      <p className="mt-[1.8cqw] line-clamp-2 text-[max(9px,2.6cqw)] leading-[1.25] font-bold uppercase tracking-[0.12em]">
                        {identity.title}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-[0.6cqw] text-[max(10.5px,3.3cqw)] font-semibold leading-[1.35]">
                    {fields.map((line) => (
                      <li key={line} className="truncate">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                {qrReady && (
                  <div className="relative flex shrink-0 items-end p-[5cqw] pl-0">
                    <span className="block size-[19cqw] bg-white p-[0.9cqw]">
                      <Image src={`/api/qr/${token}`} alt="" width={64} height={64} unoptimized className="size-full" />
                    </span>
                  </div>
                )}
              </div>
            }
          />
        </section>

        <div className="pc-rise mt-6" style={{ "--d": "240ms" } as React.CSSProperties}>
          <SaveContact
            token={profile.cardToken}
            profileId={profile.id}
            name={identity.displayName}
            preview={preview}
            icon={null}
            trailing={
              <span aria-hidden className="-mr-5 flex h-[58px] w-[58px] items-center justify-center bg-[var(--pc-x-block)] text-[var(--pc-x-blockInk)]">
                <ArrowUpRight className="size-6" strokeWidth={2.2} />
              </span>
            }
            className="h-[58px] w-full rounded-[var(--pc-radius)] bg-[var(--pc-ink)] pl-5 pr-5 text-[15px] font-bold uppercase tracking-[0.08em] text-[var(--pc-bg)]"
          />
        </div>

        {m.actions.length > 0 && (
          <nav
            aria-label="Contacter"
            className="pc-rise grid border-b-2 border-[var(--pc-ink)]"
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
                  "flex h-[64px] flex-col justify-center gap-1 px-3",
                  i > 0 && "border-l-2 border-[var(--pc-ink)]",
                )}
              >
                <ActionIcon kind={a.kind} className="size-[15px]" strokeWidth={2.2} />
                <span className={cn(display, "truncate text-[20px] leading-none")}>{a.label}</span>
              </TrackedLink>
            ))}
          </nav>
        )}

        {intro && (
          <p className="pc-inview mt-12 text-[21px] font-medium leading-[1.3] tracking-[-0.015em]">
            <span aria-hidden className="mr-2 inline-block size-[14px] bg-[var(--pc-x-block)]" />
            {intro}
          </p>
        )}

        {m.destinations.length > 0 && (
          <ul className="mt-11 border-t-2 border-[var(--pc-ink)]">
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
                    <span className={cn(display, "block truncate text-[30px] leading-none")}>{link.label}</span>
                    {link.detail && (
                      <span className="mt-1.5 block truncate text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-ink-2)]">
                        {link.detail}
                      </span>
                    )}
                  </span>
                  <span className="flex size-11 shrink-0 items-center justify-center bg-[var(--pc-x-block)] text-[var(--pc-x-blockInk)] transition-transform duration-200 group-hover:-translate-y-0.5">
                    <ArrowUpRight aria-hidden className="size-5" strokeWidth={2.2} />
                  </span>
                </TrackedLink>
              </li>
            ))}
          </ul>
        )}

        {m.social.length > 0 && (
          <ul className="pc-inview mt-8 flex flex-wrap gap-x-5">
            {m.social.map((link) => (
              <li key={link.id}>
                <TrackedLink
                  href={link.href}
                  profileId={profile.id}
                  action="LINK"
                  linkId={link.id}
                  preview={preview}
                  external={link.external}
                  className={cn(display, "inline-flex min-h-11 items-center gap-2 text-[22px]")}
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
            className="pc-inview mt-10 flex min-h-11 items-start gap-3 border-t-2 border-[var(--pc-ink)] pt-4"
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
            className="h-11 bg-[var(--pc-ink)] px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--pc-bg)]"
          />
        </footer>
      </div>
    </main>
  );
}

/** Rapport de contraste WCAG entre deux couleurs hexadecimales. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = hex.replace("#", "");
    const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6);
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
